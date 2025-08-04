import { VADState, TokenCost } from './common.js';
import { MemoryRetrievalResult } from './memory.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: TokenCost;
    processing_time?: number;
    memory_operations?: MemoryOperation[];
    memory_retrieval?: MemoryRetrievalResult;
    emotional_state_changes?: VADStateChange[];
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  last_updated: string;
  total_tokens: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  fusion_weights?: {
    w_L1: number;
    w_L2: number;
    w_L3: number;
  };
}

export interface ChatResponse {
  id: string;
  content: string;
  session_id: string;
  timestamp: string;
  metadata: {
    tokens: TokenCost;
    processing_time: number;
    memory_retrieval: MemoryRetrievalResult;
    memory_operations: MemoryOperation[];
    emotional_state_changes?: VADStateChange[];
  };
}

export interface MemoryOperation {
  id: string;
  type: 'read' | 'write' | 'update' | 'delete';
  layer: 'L1' | 'L2' | 'L3';
  operation: string;
  timestamp: string;
  duration_ms: number;
  details?: any;
}

export interface VADStateChange {
  character_id: string;
  character_name: string;
  previous_state: VADState;
  new_state: VADState;
  trigger: string;
}