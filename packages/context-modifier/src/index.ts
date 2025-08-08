/**
 * Context Modifier Package - Public API
 * 
 * Generates LLM system prompts based on user input context with:
 * - Static persona injection
 * - Dynamic scene-specific modifiers 
 * - Intent detection and state persistence
 * - RAG context integration
 */

// Core classes
export { PersonaManager } from './persona.js';
export { IntentDetector } from './intentDetector.js';
export { ModifierManager } from './modifiers.js';
export { ModifierStateManager } from './modifierState.js';
export { PromptBuilder, buildPrompt } from './buildPrompt.js';

// Types and interfaces
export type { IntentDetectionResult } from './intentDetector.js';
export type { ModifierConfig } from './modifiers.js';
export type { StateConfig, StateStorage } from './modifierState.js';
export type { 
  PromptBuilderConfig, 
  PromptBuildResult 
} from './buildPrompt.js';

// Re-export types from the types package for convenience
export type {
  Intent,
  IntentDetectionRule,
  ModifierFragment,
  PersonaDefinition,
  ModifierState,
  PromptParts,
  ContextModifierConfig,
  ModifierApplication,
  VADState
} from '@cas/types';

/**
 * Factory function to create a fully configured PromptBuilder
 * TODO: Implement factory function with sensible defaults
 */
export async function createPromptBuilder(config?: {
  personaManager?: PersonaManager;
  intentDetector?: IntentDetector;  
  modifierManager?: ModifierManager;
  stateManager?: ModifierStateManager;
  builderConfig?: Partial<import('./buildPrompt.js').PromptBuilderConfig>;
}): Promise<PromptBuilder> {
  // TODO: Implement factory function
  // - Create default components if not provided
  // - Load default personas and modifiers
  // - Configure intent detection rules
  // - Set up state management
  // - Return fully configured PromptBuilder
  throw new Error('createPromptBuilder factory not implemented');
}

/**
 * Default configuration for quick setup
 * TODO: Define sensible defaults
 */
export const DEFAULT_CONFIG = {
  // TODO: Add default configuration object
  // - Intent detection rules for common intents
  // - Default modifiers for romantic, conflict, etc.
  // - Reasonable thresholds and decay rates
  // - Standard persona template
} as const;