import { DatabaseManager } from '../database/manager.js';
import { MemoryController } from '@cas/mca';

declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseManager;
    mca: MemoryController;
    websocketClients?: Set<WebSocket>;
    broadcastToClients?: (data: any) => void;
  }
}