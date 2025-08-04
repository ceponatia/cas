import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ChatRequest, ChatResponse, ChatMessage } from '@cas/types';
import { OllamaService } from '../services/ollama.js';
import { randomUUID } from 'crypto';

export async function chatRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const ollama = new OllamaService();

  // Send a chat message
  fastify.post<{ Body: ChatRequest }>('/message', async (request, reply) => {
    const { message, session_id, fusion_weights } = request.body;
    const startTime = Date.now();
    
    try {
      // Use provided session_id or create new one
      const sessionId = session_id || randomUUID();
      
      // Use provided fusion weights or defaults
      const weights = fusion_weights || fastify.mca.config.default_fusion_weights;
      
      // Retrieve relevant context from memory layers
      const memoryResult = await fastify.mca.retrieveRelevantContext({
        query_text: message,
        session_id: sessionId,
        fusion_weights: weights
      });
      
      // Generate response using Ollama
      const response = await ollama.generateResponse(message, memoryResult);
      
      // Process the conversation turn for memory ingestion
      const userTurn = {
        id: randomUUID(),
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString(),
        tokens: await ollama.countTokens(message)
      };
      
      const assistantTurn = {
        id: randomUUID(),
        role: 'assistant' as const,
        content: response.content,
        timestamp: new Date().toISOString(),
        tokens: response.tokens
      };
      
      // Ingest conversation turns into memory
      const ingestionResult = await fastify.mca.ingestConversationTurn(
        assistantTurn,
        [userTurn],
        sessionId
      );
      
      const processingTime = Date.now() - startTime;
      
      const chatResponse: ChatResponse = {
        id: assistantTurn.id,
        content: response.content,
        session_id: sessionId,
        timestamp: assistantTurn.timestamp,
        metadata: {
          tokens: {
            total_tokens: userTurn.tokens + assistantTurn.tokens,
            l1_tokens: memoryResult.l1.token_count,
            l2_tokens: memoryResult.l2.token_count,
            l3_tokens: memoryResult.l3.token_count,
            estimated_cost: 0 // TODO: Calculate actual cost
          },
          processing_time: processingTime,
          memory_retrieval: memoryResult,
          memory_operations: ingestionResult.operations_performed,
          emotional_state_changes: ingestionResult.emotional_changes.map(change => ({
            character_id: change.character_id,
            character_name: change.character_id.replace('character:', ''),
            previous_state: change.previous_vad,
            new_state: change.new_vad,
            trigger: change.trigger
          }))
        }
      };
      
      // Broadcast to WebSocket clients
      fastify.websocketClients?.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({
            type: 'chat_response',
            data: chatResponse
          }));
        }
      });
      
      return chatResponse;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get chat history for a session
  fastify.get<{ Params: { sessionId: string } }>('/history/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const history = await fastify.mca.getChatHistory(sessionId);
      return { session_id: sessionId, messages: history };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch chat history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all sessions
  fastify.get('/sessions', async (request, reply) => {
    try {
      const sessions = await fastify.mca.getAllSessions();
      return { sessions };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}