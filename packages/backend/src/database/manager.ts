import neo4j, { Driver, Session } from 'neo4j-driver';
// import { FaissNode } from 'faiss-node';
import { createClient, RedisClientType } from 'redis';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { IDatabaseManager } from '@cas/mca/interfaces/database.js';
import { FaissIndex } from '@cas/types';

interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
}

interface FaissConfig {
  indexPath: string;
  dimension: number;
}

interface RedisConfig {
  url: string;
}

interface DatabaseConfig {
  neo4j: Neo4jConfig;
  faiss: FaissConfig;
  redis?: RedisConfig;
}

export class DatabaseManager implements IDatabaseManager {
  private neo4jDriver: Driver | null = null;
  private faissIndex: FaissIndex | null = null;
  public redis: RedisClientType | null = null;
  
  constructor(private config: DatabaseConfig) {}

  async initialize(): Promise<void> {
    await this.initializeNeo4j();
    await this.initializeFaiss();
    if (this.config.redis) {
      await this.initializeRedis();
    }
  }

  private async initializeNeo4j(): Promise<void> {
    try {
      this.neo4jDriver = neo4j.driver(
        this.config.neo4j.uri,
        neo4j.auth.basic(this.config.neo4j.user, this.config.neo4j.password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        }
      );

      // Test connection
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      
      // Create constraints and indexes
      await this.createNeo4jConstraints();
      
      console.log('✅ Neo4j connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  private async createNeo4jConstraints(): Promise<void> {
    const session = this.neo4jDriver!.session();
    
    try {
      // Create constraints for unique IDs
      const constraints = [
        'CREATE CONSTRAINT character_id_unique IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE',
        'CREATE CONSTRAINT fact_id_unique IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE',
        'CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE',
        'CREATE CONSTRAINT turn_id_unique IF NOT EXISTS FOR (t:Turn) REQUIRE t.id IS UNIQUE'
      ];

      for (const constraint of constraints) {
        try {
          await session.run(constraint);
        } catch (error: unknown) {
          // Constraint might already exist, that's okay
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('already exists')) {
            console.warn('Constraint creation warning:', errorMessage);
          }
        }
      }

      // Create indexes for performance
      const indexes = [
        'CREATE INDEX character_name_index IF NOT EXISTS FOR (c:Character) ON (c.name)',
        'CREATE INDEX fact_entity_index IF NOT EXISTS FOR (f:Fact) ON (f.entity)',
        'CREATE INDEX fact_attribute_index IF NOT EXISTS FOR (f:Fact) ON (f.attribute)',
        'CREATE INDEX turn_timestamp_index IF NOT EXISTS FOR (t:Turn) ON (t.timestamp)',
        'CREATE INDEX session_timestamp_index IF NOT EXISTS FOR (s:Session) ON (s.created_at)'
      ];

      for (const index of indexes) {
        try {
          await session.run(index);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('already exists')) {
            console.warn('Index creation warning:', errorMessage);
          }
        }
      }
    } finally {
      await session.close();
    }
  }

  private async initializeFaiss(): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(dirname(this.config.faiss.indexPath), { recursive: true });

      // Mock FAISS initialization (would use actual FaissNode in production)
      this.faissIndex = {
        add: () => {},
        search: () => ({ distances: [[]], labels: [[]] }),
        ntotal: () => 0,
        writeIndex: () => Promise.resolve(),
        readIndex: () => Promise.resolve()
      } as FaissIndex;
      console.log('✅ Mock FAISS index created');
    } catch (error) {
      console.error('❌ Failed to initialize FAISS:', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = createClient({ url: this.config.redis!.url });
      await this.redis.connect();
      
      // Test connection
      await this.redis.ping();
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      // Redis is optional, so we don't throw here
      this.redis = null;
    }
  }

  async checkNeo4jHealth(): Promise<boolean> {
    if (!this.neo4jDriver) return false;
    
    try {
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      return true;
    } catch {
      return false;
    }
  }

  getNeo4jSession(): Session {
    if (!this.neo4jDriver) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.neo4jDriver.session();
  }

  getDriver(): Driver {
    if (!this.neo4jDriver) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.neo4jDriver;
  }

  getFaissIndex(): FaissIndex {
    if (!this.faissIndex) {
      throw new Error('FAISS index not initialized');
    }
    return this.faissIndex;
  }

  async saveFaissIndex(): Promise<void> {
    if (this.faissIndex) {
      await this.faissIndex.writeIndex(this.config.faiss.indexPath);
    }
  }

  async close(): Promise<void> {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
    }
    
    if (this.faissIndex) {
      await this.saveFaissIndex();
    }
    
    if (this.redis) {
      await this.redis.quit();
    }
    
    console.log('🔌 Database connections closed');
  }
}