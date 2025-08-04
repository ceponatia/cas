// Retrieves relevant relationships from Neo4j graph based on query
import { ManagedTransaction } from 'neo4j-driver';
import { RelationshipEdge } from '@cas/types';
import { MemoryRetrievalQuery } from '@cas/types';
import { mapRecordToRelationship } from '../mapping/relationship.js';

export async function retrieveRelevantRelationships(
  tx: ManagedTransaction, 
  query: MemoryRetrievalQuery
): Promise<RelationshipEdge[]> {
  const cypherQuery = `
    MATCH (from)-[r:RELATIONSHIP]->(to)
    WHERE toLower(r.relationship_type) CONTAINS toLower($queryText)
       OR toLower(from.name) CONTAINS toLower($queryText)
       OR toLower(to.name) CONTAINS toLower($queryText)
    RETURN r, from.id as fromId, to.id as toId
    ORDER BY r.strength DESC, r.last_updated DESC
    LIMIT 10
  `;

  const result = await tx.run(cypherQuery, { queryText: query.query_text });
  
  return result.records.map((record: { get(key: string): unknown }) => {
    return mapRecordToRelationship(record);
  });
}