import { CharacterProfile } from '@cas/types';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';

export class CharacterRegistry {
  private static instance: CharacterRegistry;
  private characters: Map<string, CharacterProfile> = new Map();
  private loaded = false;
  private dataDir: string;

  private constructor(dataDir?: string) {
    this.dataDir = dataDir || path.resolve(process.cwd(), 'packages/backend/data/characters');
  }

  static getInstance(dataDir?: string): CharacterRegistry {
    if (!CharacterRegistry.instance) {
      CharacterRegistry.instance = new CharacterRegistry(dataDir);
    }
    return CharacterRegistry.instance;
  }

  load(force = false): void {
    if (this.loaded && !force) return;
    this.characters.clear();
    try {
      const files = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = readFileSync(path.join(this.dataDir, file), 'utf-8');
            const parsed: CharacterProfile = JSON.parse(raw);
            if (parsed.id && parsed.name) {
              this.characters.set(parsed.id, parsed);
            }
        } catch (err) {
          console.error(`Failed to load character file ${file}:`, err);
        }
      }
      this.loaded = true;
    } catch (e) {
      console.error('CharacterRegistry load error:', e);
    }
  }

  list(): CharacterProfile[] {
    if (!this.loaded) this.load();
    return Array.from(this.characters.values());
  }

  get(id: string): CharacterProfile | undefined {
    if (!this.loaded) this.load();
    return this.characters.get(id);
  }
}
