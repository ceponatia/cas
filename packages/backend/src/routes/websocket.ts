import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import WebSocket from 'ws';

// Extend FastifyInstance to include websocket clients
declare module 'fastify' {
  interface FastifyInstance {
    websocketClients?: Set<WebSocket>;
  }
}

export async function websocketRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Initialize WebSocket clients set
  if (!fastify.websocketClients) {
    fastify.websocketClients = new Set<WebSocket>();
  }

  // WebSocket endpoint for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/updates', { websocket: true }, (connection, req) => {
      const socket = connection;
      
      // Add client to the set
      fastify.websocketClients!.add(socket);
      
      fastify.log.info('New WebSocket client connected');
      
      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connection_established',
        timestamp: new Date().toISOString(),
        message: 'Connected to Cognitive Architecture Simulator'
      }));

      // Handle incoming messages
      socket.on('message', async (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'subscribe_to_memory_operations':
              // Client wants to receive memory operation updates
              socket.send(JSON.stringify({
                type: 'subscription_confirmed',
                subscription: 'memory_operations',
                timestamp: new Date().toISOString()
              }));
              break;
              
            case 'subscribe_to_emotional_changes':
              // Client wants to receive emotional state changes
              socket.send(JSON.stringify({
                type: 'subscription_confirmed',
                subscription: 'emotional_changes',
                timestamp: new Date().toISOString()
              }));
              break;
              
            case 'ping':
              socket.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
              }));
              break;
              
            default:
              socket.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${data.type}`,
                timestamp: new Date().toISOString()
              }));
          }
        } catch (error) {
          fastify.log.error('WebSocket message parsing error:', error);
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      });

      // Handle client disconnect
      socket.on('close', () => {
        fastify.websocketClients!.delete(socket);
        fastify.log.info('WebSocket client disconnected');
      });

      // Handle errors
      socket.on('error', (error: any) => {
        fastify.log.error('WebSocket error:', error);
        fastify.websocketClients!.delete(socket);
      });
    });
  });

  // Helper function to broadcast to all connected clients
  fastify.decorate('broadcastToClients', function(data: any) {
    const message = JSON.stringify(data);
    this.websocketClients?.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}