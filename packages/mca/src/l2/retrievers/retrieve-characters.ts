// Retrieves relevant characters from Neo4j graph based on query
import { ManagedTransaction } from 'neo4j-driver';
import { Character } from '@cas/types';
import { MemoryRetrievalQuery } from '@cas/types';
import { mapNodeToCharacter } from '../mapping/character.js';

export async function retrieveRelevantCharacters(
  tx: ManagedTransaction, 
  query: MemoryRetrievalQuery
): Promise<Character[]> {
  const cypherQuery = `
    MATCH (c:Character)
    WHERE toLower(c.name) CONTAINS toLower($queryText)
    RETURN c
    ORDER BY c.last_updated DESC
    LIMIT 10
  `;

  const result = await tx.run(cypherQuery, { queryText: query.query_text });
  
  return result.records.map((record: any) => {
    const node = record.get('c');
    return mapNodeToCharacter(node);
  });
}