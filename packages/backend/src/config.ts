import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, '../../../.env') });

interface Config {
  // Server
  PORT: number;
  NODE_ENV: string;
  
  // Neo4j
  NEO4J_URI: string;
  NEO4J_USER: string;
  NEO4J_PASSWORD: string;
  
  // Redis (optional)
  REDIS_URL?: string;
  
  // Ollama
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  
  // FAISS
  FAISS_INDEX_PATH: string;
  VECTOR_DIMENSION: number;
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
  NEO4J_USER: process.env.NEO4J_USERNAME || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'test1234',
  
  REDIS_URL: process.env.REDIS_URL,
  
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'mistral:instruct',
  
  FAISS_INDEX_PATH: process.env.FAISS_INDEX_PATH || './data/faiss_index',
  VECTOR_DIMENSION: parseInt(process.env.VECTOR_DIMENSION || '1536')
};