// Retrieves relevant facts from Neo4j graph based on query
import { ManagedTransaction } from 'neo4j-driver';
import { FactNode } from '@cas/types';
import { MemoryRetrievalQuery } from '@cas/types';
import { mapNodeToFact } from '../mapping/fact.js';

export async function retrieveRelevantFacts(
  tx: ManagedTransaction, 
  query: MemoryRetrievalQuery
): Promise<FactNode[]> {
  const cypherQuery = `
    MATCH (f:Fact)
    WHERE toLower(f.current_value) CONTAINS toLower($queryText)
       OR toLower(f.entity) CONTAINS toLower($queryText)
       OR toLower(f.attribute) CONTAINS toLower($queryText)
    RETURN f
    ORDER BY f.importance_score DESC, f.last_updated DESC
    LIMIT 10
  `;

  const result = await tx.run(cypherQuery, { queryText: query.query_text });
  
  return result.records.map((record: any) => {
    const node = record.get('f');
    return mapNodeToFact(node);
  });
}