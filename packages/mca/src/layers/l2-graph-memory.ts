import { 
  MCAConfig, 
  WorkingMemoryTurn,
  L2RetrievalResult,
  MemoryRetrievalQuery,
  Character,
  FactNode,
  RelationshipEdge,
  VADState,
  EventDetectionResult,
  MemoryOperation
} from '@cas/types';
// DatabaseManager passed as parameter
import { Session } from 'neo4j-driver';

/**
 * L2 Graph Memory - Episodic & Emotional Graph using Neo4j
 * Stores structured "who, what, when" with VAD emotional states
 */
export class L2GraphMemory {
  constructor(
    private dbManager: any, // DatabaseManager type
    private config: MCAConfig
  ) {}

  /**
   * Ingest a conversation turn into the graph memory
   */
  async ingestTurn(
    turn: WorkingMemoryTurn,
    eventDetection: EventDetectionResult,
    sessionId: string
  ): Promise<{
    operations: MemoryOperation[];
    facts_updated: string[];
    relationships_modified: string[];
  }> {
    const session = this.dbManager.getNeo4jSession();
    const operations: MemoryOperation[] = [];
    const factsUpdated: string[] = [];
    const relationshipsModified: string[] = [];

    try {
      // 1. Create or update characters with emotional states
      for (const emotionalChange of eventDetection.emotional_changes) {
        const characterId = emotionalChange.character_id;
        const newVAD = emotionalChange.new_vad;
        
        await this.upsertCharacter(session, characterId, newVAD);
        
        operations.push({
          id: crypto.randomUUID(),
          type: 'update',
          layer: 'L2',
          operation: 'updateCharacterEmotion',
          timestamp: new Date().toISOString(),
          duration_ms: 0,
          details: { character_id: characterId, vad_state: newVAD }
        });
      }

      // 2. Process detected events for fact extraction
      for (const event of eventDetection.detected_events) {
        switch (event.type) {
          case 'fact_assertion':
            const factResult = await this.processFact(session, event, turn, sessionId);
            operations.push(...factResult.operations);
            factsUpdated.push(...factResult.fact_ids);
            break;
            
          case 'relationship_change':
            const relResult = await this.processRelationship(session, event, turn, sessionId);
            operations.push(...relResult.operations);
            relationshipsModified.push(...relResult.relationship_ids);
            break;
        }
      }

      // 3. Store the conversation turn itself
      await this.storeTurn(session, turn, sessionId, eventDetection.significance_score);
      
      operations.push({
        id: crypto.randomUUID(),
        type: 'write',
        layer: 'L2',
        operation: 'storeTurn',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
        details: { turn_id: turn.id, session_id: sessionId }
      });

      return { operations, facts_updated: factsUpdated, relationships_modified: relationshipsModified };

    } catch (error) {
      console.error('L2 ingestion error:', error);
      return { operations, facts_updated: factsUpdated, relationships_modified: relationshipsModified };
    } finally {
      await session.close();
    }
  }

  /**
   * Retrieve relevant context from graph memory
   */
  async retrieve(query: MemoryRetrievalQuery): Promise<L2RetrievalResult> {
    const session = this.dbManager.getNeo4jSession();
    
    try {
      // Multi-query approach: characters, facts, and relationships
      const [characters, facts, relationships] = await Promise.all([
        this.retrieveRelevantCharacters(session, query),
        this.retrieveRelevantFacts(session, query),
        this.retrieveRelevantRelationships(session, query)
      ]);

      // Calculate overall relevance score
      const relevanceScore = this.calculateL2RelevanceScore(characters, facts, relationships, query);
      
      // Estimate token count
      const tokenCount = this.estimateL2TokenCount(characters, facts, relationships);

      return {
        characters,
        facts,
        relationships,
        relevance_score: relevanceScore,
        token_count: tokenCount
      };

    } catch (error) {
      console.error('L2 retrieval error:', error);
      return {
        characters: [],
        facts: [],
        relationships: [],
        relevance_score: 0,
        token_count: 0
      };
    } finally {
      await session.close();
    }
  }

  private async upsertCharacter(session: Session, characterId: string, vadState: VADState): Promise<void> {
    const query = `
      MERGE (c:Character {id: $characterId})
      ON CREATE SET 
        c.name = $name,
        c.type = 'Character',
        c.created_at = datetime(),
        c.emotional_state = $vadState
      ON MATCH SET 
        c.last_updated = datetime(),
        c.emotional_state = $vadState
      RETURN c
    `;

    const name = characterId.replace('character:', '');
    await session.run(query, { 
      characterId, 
      name, 
      vadState: {
        valence: vadState.valence,
        arousal: vadState.arousal,
        dominance: vadState.dominance
      }
    });
  }

  private async processFact(
    session: Session, 
    event: any, 
    turn: WorkingMemoryTurn, 
    sessionId: string
  ): Promise<{ operations: MemoryOperation[]; fact_ids: string[] }> {
    // Extract fact information from the event
    // This is a simplified implementation - in reality, we'd use NLP
    const factId = `fact:${crypto.randomUUID()}`;
    const operations: MemoryOperation[] = [];
    
    // For now, create a simple fact from the event description
    const query = `
      CREATE (f:Fact {
        id: $factId,
        entity: $entity,
        attribute: $attribute,
        current_value: $value,
        created_at: datetime(),
        last_updated: datetime(),
        importance_score: $importance,
        session_id: $sessionId,
        turn_id: $turnId
      })
      RETURN f
    `;

    await session.run(query, {
      factId,
      entity: event.entities_involved[0] || 'unknown',
      attribute: 'description',
      value: event.description,
      importance: event.confidence * 10,
      sessionId,
      turnId: turn.id
    });

    operations.push({
      id: crypto.randomUUID(),
      type: 'write',
      layer: 'L2',
      operation: 'createFact',
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      details: { fact_id: factId }
    });

    return { operations, fact_ids: [factId] };
  }

  private async processRelationship(
    session: Session, 
    event: any, 
    turn: WorkingMemoryTurn, 
    sessionId: string
  ): Promise<{ operations: MemoryOperation[]; relationship_ids: string[] }> {
    if (event.entities_involved.length < 2) {
      return { operations: [], relationship_ids: [] };
    }

    const relationshipId = `rel:${crypto.randomUUID()}`;
    const operations: MemoryOperation[] = [];

    const query = `
      MATCH (from:Character {id: $fromEntity})
      MATCH (to:Character {id: $toEntity})
      CREATE (from)-[r:RELATIONSHIP {
        id: $relationshipId,
        relationship_type: $relType,
        strength: $strength,
        created_at: datetime(),
        last_updated: datetime(),
        session_id: $sessionId,
        turn_id: $turnId
      }]->(to)
      RETURN r
    `;

    await session.run(query, {
      relationshipId,
      fromEntity: event.entities_involved[0],
      toEntity: event.entities_involved[1],
      relType: event.type,
      strength: event.confidence,
      sessionId,
      turnId: turn.id
    });

    operations.push({
      id: crypto.randomUUID(),
      type: 'write',
      layer: 'L2',
      operation: 'createRelationship',
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      details: { relationship_id: relationshipId }
    });

    return { operations, relationship_ids: [relationshipId] };
  }

  private async storeTurn(
    session: Session, 
    turn: WorkingMemoryTurn, 
    sessionId: string, 
    significanceScore: number
  ): Promise<void> {
    const query = `
      MERGE (s:Session {id: $sessionId})
      ON CREATE SET s.created_at = datetime()
      ON MATCH SET s.last_updated = datetime()
      
      CREATE (t:Turn {
        id: $turnId,
        role: $role,
        content: $content,
        timestamp: datetime($timestamp),
        tokens: $tokens,
        significance_score: $significanceScore,
        session_id: $sessionId
      })
      
      CREATE (s)-[:HAS_TURN]->(t)
      RETURN t
    `;

    await session.run(query, {
      sessionId,
      turnId: turn.id,
      role: turn.role,
      content: turn.content,
      timestamp: turn.timestamp,
      tokens: turn.tokens,
      significanceScore
    });
  }

  private async retrieveRelevantCharacters(session: Session, query: MemoryRetrievalQuery): Promise<Character[]> {
    const cypherQuery = `
      MATCH (c:Character)
      WHERE toLower(c.name) CONTAINS toLower($queryText)
      RETURN c
      ORDER BY c.last_updated DESC
      LIMIT 10
    `;

    const result = await session.run(cypherQuery, { queryText: query.query_text });
    
    return result.records.map((record: any) => {
      const node = record.get('c').properties;
      return {
        id: node.id,
        name: node.name,
        type: 'Character',
        emotional_state: node.emotional_state || { valence: 0, arousal: 0, dominance: 0 },
        created_at: node.created_at.toString(),
        last_updated: node.last_updated.toString()
      };
    });
  }

  private async retrieveRelevantFacts(session: Session, query: MemoryRetrievalQuery): Promise<FactNode[]> {
    const cypherQuery = `
      MATCH (f:Fact)
      WHERE toLower(f.current_value) CONTAINS toLower($queryText)
         OR toLower(f.entity) CONTAINS toLower($queryText)
         OR toLower(f.attribute) CONTAINS toLower($queryText)
      RETURN f
      ORDER BY f.importance_score DESC, f.last_updated DESC
      LIMIT 10
    `;

    const result = await session.run(cypherQuery, { queryText: query.query_text });
    
    return result.records.map((record: any) => {
      const node = record.get('f').properties;
      return {
        id: node.id,
        entity: node.entity,
        attribute: node.attribute,
        current_value: node.current_value,
        history: [], // TODO: Implement version history
        importance_score: node.importance_score,
        created_at: node.created_at.toString(),
        last_updated: node.last_updated.toString()
      };
    });
  }

  private async retrieveRelevantRelationships(session: Session, query: MemoryRetrievalQuery): Promise<RelationshipEdge[]> {
    const cypherQuery = `
      MATCH (from)-[r:RELATIONSHIP]->(to)
      WHERE toLower(r.relationship_type) CONTAINS toLower($queryText)
         OR toLower(from.name) CONTAINS toLower($queryText)
         OR toLower(to.name) CONTAINS toLower($queryText)
      RETURN r, from.id as fromId, to.id as toId
      ORDER BY r.strength DESC, r.last_updated DESC
      LIMIT 10
    `;

    const result = await session.run(cypherQuery, { queryText: query.query_text });
    
    return result.records.map((record: any) => {
      const rel = record.get('r').properties;
      return {
        id: rel.id,
        from_entity: record.get('fromId'),
        to_entity: record.get('toId'),
        relationship_type: rel.relationship_type,
        strength: rel.strength,
        created_at: rel.created_at.toString(),
        last_updated: rel.last_updated.toString()
      };
    });
  }

  private calculateL2RelevanceScore(
    characters: Character[], 
    facts: FactNode[], 
    relationships: RelationshipEdge[], 
    query: MemoryRetrievalQuery
  ): number {
    const totalItems = characters.length + facts.length + relationships.length;
    if (totalItems === 0) return 0;

    // Simple relevance calculation based on matches
    return Math.min(1.0, totalItems / 10); // Normalized to max of 1.0
  }

  private estimateL2TokenCount(characters: Character[], facts: FactNode[], relationships: RelationshipEdge[]): number {
    let tokenCount = 0;
    
    // Rough estimation: 50 tokens per character, 30 per fact, 25 per relationship
    tokenCount += characters.length * 50;
    tokenCount += facts.length * 30;
    tokenCount += relationships.length * 25;
    
    return tokenCount;
  }

  // Public API methods
  async getAllCharacters(): Promise<Character[]> {
    const session = this.dbManager.getNeo4jSession();
    
    try {
      const result = await session.run('MATCH (c:Character) RETURN c ORDER BY c.name');
      return result.records.map((record: any) => {
        const node = record.get('c').properties;
        return {
          id: node.id,
          name: node.name,
          type: 'Character',
          emotional_state: node.emotional_state || { valence: 0, arousal: 0, dominance: 0 },
          created_at: node.created_at.toString(),
          last_updated: node.last_updated.toString()
        };
      });
    } finally {
      await session.close();
    }
  }

  async getEmotionalHistory(characterId: string, limit: number): Promise<any[]> {
    // TODO: Implement emotional history tracking
    return [];
  }

  async getFactWithHistory(factId: string): Promise<FactNode | null> {
    const session = this.dbManager.getNeo4jSession();
    
    try {
      const result = await session.run('MATCH (f:Fact {id: $factId}) RETURN f', { factId });
      if (result.records.length === 0) return null;
      
      const node = result.records[0].get('f').properties;
      return {
        id: node.id,
        entity: node.entity,
        attribute: node.attribute,
        current_value: node.current_value,
        history: [], // TODO: Implement version history
        importance_score: node.importance_score,
        created_at: node.created_at.toString(),
        last_updated: node.last_updated.toString()
      };
    } finally {
      await session.close();
    }
  }

  async inspect(): Promise<any> {
    const session = this.dbManager.getNeo4jSession();
    
    try {
      const [charResult, factResult, relResult, turnResult] = await Promise.all([
        session.run('MATCH (c:Character) RETURN count(c) as count'),
        session.run('MATCH (f:Fact) RETURN count(f) as count'),
        session.run('MATCH ()-[r:RELATIONSHIP]->() RETURN count(r) as count'),
        session.run('MATCH (t:Turn) RETURN count(t) as count')
      ]);

      return {
        characters: charResult.records[0].get('count').toNumber(),
        facts: factResult.records[0].get('count').toNumber(),
        relationships: relResult.records[0].get('count').toNumber(),
        conversation_turns: turnResult.records[0].get('count').toNumber()
      };
    } finally {
      await session.close();
    }
  }

  async getStatistics(): Promise<any> {
    return await this.inspect();
  }
}