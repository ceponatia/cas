import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function memoryRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  
  // Inspect current memory state
  fastify.get('/inspect', async (request, reply) => {
    try {
      const memoryState = await fastify.mca.inspectMemoryState();
      return memoryState;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to inspect memory',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Search memory layers
  fastify.post<{ 
    Body: { 
      query: string; 
      layers?: ('L1' | 'L2' | 'L3')[]; 
      limit?: number;
    } 
  }>('/search', async (request, reply) => {
    try {
      const { query, limit = 10 } = request.body;
      
      const results = await fastify.mca.searchMemory(query, {
        limit,
        threshold: 0.1
      });
      
      return results;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Memory search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get character emotional states
  fastify.get('/characters', async (request, reply) => {
    try {
      const characters = await fastify.mca.getAllCharacters();
      return { characters };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch characters',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get character emotional history
  fastify.get<{ 
    Params: { characterId: string };
    Querystring: { limit?: number };
  }>('/characters/:characterId/emotions', async (request, reply) => {
    try {
      const { characterId } = request.params;
      const { limit = 50 } = request.query;
      
      const emotionalHistory = await fastify.mca.getCharacterEmotionalHistory(
        characterId, 
        limit
      );
      
      return { character_id: characterId, emotional_history: emotionalHistory };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch emotional history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get fact versions
  fastify.get<{ Params: { factId: string } }>('/facts/:factId/versions', async (request, reply) => {
    try {
      const { factId } = request.params;
      const fact = await fastify.mca.getFactWithHistory(factId);
      
      if (!fact) {
        return reply.status(404).send({ error: 'Fact not found' });
      }
      
      return { fact };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch fact versions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual memory management
  fastify.post('/prune', async (request, reply) => {
    try {
      const pruningResult = await fastify.mca.pruneMemory();
      return { 
        message: 'Memory pruning completed',
        results: pruningResult
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Memory pruning failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get memory statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await fastify.mca.getMemoryStatistics();
      return stats;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch memory statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}