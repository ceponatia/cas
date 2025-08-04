import { Ollama } from 'ollama';
import { config } from '../config.js';
import { MemoryRetrievalResult, LLMResponse } from '@cas/types';
import { encoding_for_model, Tiktoken } from 'tiktoken';

export class OllamaService {
  private ollama: Ollama;
  private tokenizer: Tiktoken | null;

  constructor() {
    this.ollama = new Ollama({ host: config.OLLAMA_BASE_URL });
    // Initialize tokenizer for token counting
    try {
      this.tokenizer = encoding_for_model('gpt-3.5-turbo'); // Close approximation for Mistral
    } catch {
      console.warn('Failed to initialize tokenizer, using fallback estimation');
      this.tokenizer = null;
    }
  }

  async generateResponse(userMessage: string, memoryContext: MemoryRetrievalResult): Promise<LLMResponse> {
    const prompt = this.constructPrompt(userMessage, memoryContext);
    
    try {
      const response = await this.ollama.generate({
        model: config.OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2000
        }
      });

      return {
        response: response.response,
        model: config.OLLAMA_MODEL,
        created_at: new Date().toISOString(),
        done: true,
        total_duration: response.total_duration,
        load_duration: response.load_duration,
        prompt_eval_count: response.prompt_eval_count,
        prompt_eval_duration: response.prompt_eval_duration,
        eval_count: response.eval_count,
        eval_duration: response.eval_duration
      };
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  private constructPrompt(userMessage: string, memoryContext: MemoryRetrievalResult): string {
    const { l1, l2, l3 } = memoryContext;
    
    let prompt = `You are an AI assistant with access to a sophisticated memory system. Use the provided context to give relevant, personalized responses.

WORKING MEMORY (Recent conversation):
${l1.turns.map(turn => `${turn.role}: ${turn.content}`).join('\n')}

EPISODIC MEMORY (Characters and facts):
`;

    // Add character information
    if (l2.characters.length > 0) {
      prompt += `Characters:\n`;
      l2.characters.forEach(char => {
        prompt += `- ${char.name}: VAD emotional state (valence: ${char.emotional_state.valence.toFixed(2)}, arousal: ${char.emotional_state.arousal.toFixed(2)}, dominance: ${char.emotional_state.dominance.toFixed(2)})\n`;
      });
    }

    // Add facts
    if (l2.facts.length > 0) {
      prompt += `Facts:\n`;
      l2.facts.forEach(fact => {
        prompt += `- ${fact.attribute}: ${fact.current_value} (importance: ${fact.importance_score})\n`;
      });
    }

    // Add relationships
    if (l2.relationships.length > 0) {
      prompt += `Relationships:\n`;
      l2.relationships.forEach(rel => {
        prompt += `- ${rel.from_entity} ${rel.relationship_type} ${rel.to_entity} (strength: ${rel.strength})\n`;
      });
    }

    // Add semantic archive
    if (l3.fragments.length > 0) {
      prompt += `\nSEMANTIC ARCHIVE (Relevant insights):\n`;
      l3.fragments.forEach(fragment => {
        prompt += `- ${fragment.content} (relevance: ${fragment.similarity_score?.toFixed(2)})\n`;
      });
    }

    prompt += `\nCurrent user message: ${userMessage}

Please respond naturally, incorporating relevant information from the memory context above. Be conversational and helpful.

Response:`;

    return prompt;
  }

  async countTokens(text: string): Promise<number> {
    if (this.tokenizer) {
      try {
        const tokens = this.tokenizer.encode(text);
        return tokens.length;
      } catch {
        console.warn('Tokenizer error, using fallback estimation');
      }
    }
    
    // Fallback: rough estimation (4 characters per token)
    return Math.ceil(text.length / 4);
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.ollama.list();
      return Array.isArray(response.models);
    } catch (error) {
      console.error('Ollama connection check failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((model: { name: string }) => model.name);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [];
    }
  }
}