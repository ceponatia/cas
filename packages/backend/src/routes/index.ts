import { FastifyInstance } from 'fastify';
import { chatRoutes } from './chat.js';
import { memoryRoutes } from './memory.js';
import { configRoutes } from './config.js';
import { websocketRoutes } from './websocket.js';

export async function setupRoutes(fastify: FastifyInstance): Promise<void> {
  // API routes
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(memoryRoutes, { prefix: '/api/memory' });
  await fastify.register(configRoutes, { prefix: '/api/config' });
  
  // WebSocket routes
  await fastify.register(websocketRoutes, { prefix: '/ws' });
}