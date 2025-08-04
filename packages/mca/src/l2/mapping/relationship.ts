// Maps Neo4j relationship records to RelationshipEdge interface
import { RelationshipEdge } from '@cas/types';

export function mapRecordToRelationship(record: { get(key: string): { properties?: { id: string; relationship_type: string; strength: number; created_at: { toString(): string }; last_updated?: { toString(): string } } } | string }): RelationshipEdge {
  const rel = record.get('r').properties;
  return {
    id: rel.id,
    from_entity: record.get('fromId'),
    to_entity: record.get('toId'),
    relationship_type: rel.relationship_type,
    strength: rel.strength,
    created_at: rel.created_at.toString(),
    last_updated: rel.last_updated?.toString() || rel.created_at.toString()
  };
}