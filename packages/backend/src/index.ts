import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { setupRoutes } from './routes/index.js';
import { DatabaseManager } from './database/manager.js';
import { MemoryController } from '@cas/mca';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'debug' : 'info'
  }
});

// Register plugins
await fastify.register(cors, {
  origin: config.NODE_ENV === 'development' ? 'http://localhost:5173' : false
});

await fastify.register(websocket);

// Initialize database connections
const dbManager = new DatabaseManager({
  neo4j: {
    uri: config.NEO4J_URI,
    user: config.NEO4J_USER,
    password: config.NEO4J_PASSWORD
  },
  faiss: {
    indexPath: config.FAISS_INDEX_PATH,
    dimension: config.VECTOR_DIMENSION
  },
  redis: config.REDIS_URL ? { url: config.REDIS_URL } : undefined
});

// Add to fastify context (will be initialized in start() function)
fastify.decorate('db', dbManager);
let memoryController: MemoryController;

// Setup routes
await setupRoutes(fastify);

// Health check
fastify.get('/health', async () => {
  const neo4jHealth = await dbManager.checkNeo4jHealth();
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      neo4j: neo4jHealth ? 'healthy' : 'unhealthy',
      faiss: 'healthy', // TODO: Add FAISS health check
      redis: dbManager.redis ? 'healthy' : 'not_configured'
    }
  };
});

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('Shutting down gracefully...');
  await dbManager.close();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async (): Promise<void> => {
  try {
    await dbManager.initialize();
    
    // Initialize Memory Controller Agent after database is ready
    memoryController = new MemoryController(dbManager, {
      l1_max_turns: 20,
      l1_max_tokens: 4000,
      l2_significance_threshold: 5.0,
      l2_emotional_delta_threshold: 0.3,
      l3_vector_dimension: config.VECTOR_DIMENSION,
      l3_max_fragments: 1000,
      default_fusion_weights: {
        w_L1: 0.4,
        w_L2: 0.4,
        w_L3: 0.2
      },
      importance_decay_rate: 0.1,
      access_boost_factor: 1.2,
      recency_boost_factor: 1.5
    });
    
    // Add MCA to fastify context
    fastify.decorate('mca', memoryController);
    
    await fastify.listen({ 
      port: config.PORT, 
      host: '0.0.0.0' 
    });
    console.log(`🚀 Cognitive Architecture Simulator backend running on port ${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

void start();