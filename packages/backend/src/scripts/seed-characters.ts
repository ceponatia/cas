import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import neo4j from 'neo4j-driver';
import { config } from '../config.js';
import { CharacterProfile } from '@cas/types';

async function run(): Promise<void> {
  const dataDir = path.resolve(process.cwd(), 'packages/backend/data/characters');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  const driver = neo4j.driver(
    config.NEO4J_URI,
    neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD)
  );
  const session = driver.session();

  try {
    for (const file of files) {
      const raw = readFileSync(path.join(dataDir, file), 'utf-8');
      const profile: CharacterProfile = JSON.parse(raw);
      if (!profile.id || !profile.name) continue;

      const baseline = profile.baseline_vad || { valence: 0, arousal: 0, dominance: 0 };
      const attributes = profile.attributes || [];

      await session.run(
        `MERGE (c:Character {id: $id})
         ON CREATE SET c.name = $name, c.type = 'Character', c.created_at = timestamp()
         ON MATCH SET c.name = $name
         SET c.emotional_state = $emotional_state, c.attributes = $attributes` ,
        {
          id: profile.id,
          name: profile.name,
          emotional_state: baseline,
          attributes: attributes
        }
      );
      console.log(`Upserted character ${profile.id}`);
    }
  } catch (e) {
    console.error('Seeding failed', e);
  } finally {
    await session.close();
    await driver.close();
  }
}

void run();
