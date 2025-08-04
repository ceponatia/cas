import React, { useState, useEffect } from 'react';
import { FileText, Copy, Eye, EyeOff, Zap } from 'lucide-react';
import { ChatMessage, WeightedMemoryFusion } from '@cas/types';

interface PromptInspectorPanelProps {
  messages: ChatMessage[];
  fusionWeights: WeightedMemoryFusion;
}

interface PromptBreakdown {
  sections: {
    system: string;
    working_memory: string;
    episodic_memory: string;
    semantic_archive: string;
    user_query: string;
  };
  token_estimates: {
    system: number;
    working_memory: number;
    episodic_memory: number;
    semantic_archive: number;
    user_query: number;
    total: number;
  };
  fusion_weights: WeightedMemoryFusion;
}

export const PromptInspectorPanel: React.FC<PromptInspectorPanelProps> = ({
  messages,
  fusionWeights
}) => {
  const [promptBreakdown, setPromptBreakdown] = useState<PromptBreakdown | null>(null);
  // const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['user_query']));

  // Mock prompt construction (in a real implementation, this would come from the backend)
  useEffect(() => {
    if (messages.length === 0) return;

    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!latestUserMessage) return;

    // Simulate prompt breakdown
    const breakdown: PromptBreakdown = {
      sections: {
        system: "You are an AI assistant with access to a sophisticated memory system. Use the provided context to give relevant, personalized responses.",
        working_memory: messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n'),
        episodic_memory: "Characters:\n- Alice: VAD emotional state (valence: 0.2, arousal: 0.4, dominance: 0.6)\n- Bob: VAD emotional state (valence: -0.1, arousal: 0.7, dominance: 0.3)\n\nFacts:\n- Alice likes coffee (importance: 7.2)\n- Bob prefers tea (importance: 6.8)",
        semantic_archive: "- Previous discussion about beverage preferences (relevance: 0.85)\n- Context about morning routines (relevance: 0.72)",
        user_query: latestUserMessage.content
      },
      token_estimates: {
        system: 25,
        working_memory: Math.min(200, messages.slice(-4).reduce((sum, m) => sum + (m.content.length / 4), 0)),
        episodic_memory: 45,
        semantic_archive: 30,
        user_query: Math.ceil(latestUserMessage.content.length / 4),
        total: 0
      },
      fusion_weights: fusionWeights
    };

    breakdown.token_estimates.total = 
      breakdown.token_estimates.system +
      breakdown.token_estimates.working_memory +
      breakdown.token_estimates.episodic_memory +
      breakdown.token_estimates.semantic_archive +
      breakdown.token_estimates.user_query;

    setPromptBreakdown(breakdown);
  }, [messages, fusionWeights]);

  const toggleSection = (section: string): void => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyFullPrompt = (): void => {
    if (!promptBreakdown) return;

    const fullPrompt = [
      promptBreakdown.sections.system,
      "",
      "WORKING MEMORY (Recent conversation):",
      promptBreakdown.sections.working_memory,
      "",
      "EPISODIC MEMORY (Characters and facts):",
      promptBreakdown.sections.episodic_memory,
      "",
      "SEMANTIC ARCHIVE (Relevant insights):",
      promptBreakdown.sections.semantic_archive,
      "",
      `Current user message: ${promptBreakdown.sections.user_query}`,
      "",
      "Please respond naturally, incorporating relevant information from the memory context above."
    ].join('\n');

    void navigator.clipboard.writeText(fullPrompt);
  };

  const getSectionColor = (section: string): string => {
    switch (section) {
      case 'system':
        return 'gray';
      case 'working_memory':
        return 'blue';
      case 'episodic_memory':
        return 'green';
      case 'semantic_archive':
        return 'purple';
      case 'user_query':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getSectionWeight = (section: string): number => {
    switch (section) {
      case 'working_memory':
        return fusionWeights.w_L1;
      case 'episodic_memory':
        return fusionWeights.w_L2;
      case 'semantic_archive':
        return fusionWeights.w_L3;
      default:
        return 0;
    }
  };

  const renderSection = (sectionKey: string, title: string, content: string, tokens: number): JSX.Element => {
    const isExpanded = expandedSections.has(sectionKey);
    const color = getSectionColor(sectionKey);
    const weight = getSectionWeight(sectionKey);

    return (
      <div key={sectionKey} className={`border border-${color}-200 rounded-lg overflow-hidden`}>
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full px-4 py-3 bg-${color}-50 hover:bg-${color}-100 transition-colors flex items-center justify-between`}
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{title}</span>
            {weight > 0 && (
              <span className={`text-xs px-2 py-1 bg-${color}-100 text-${color}-700 rounded`}>
                {(weight * 100).toFixed(0)}% weight
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>{tokens}</span>
            </div>
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-white border-t border-gray-200">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border overflow-x-auto">
              {content}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <div className="flex justify-between items-center">
          <h2 className="panel-title flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Prompt Inspector</span>
          </h2>
          <div className="flex items-center space-x-2">
            {promptBreakdown && (
              <>
                <div className="text-sm text-gray-600 flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>{promptBreakdown.token_estimates.total} tokens</span>
                </div>
                <button
                  onClick={copyFullPrompt}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="Copy full prompt"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Live view of the final prompt sent to the LLM
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {!promptBreakdown ? (
          <div className="text-center text-gray-500 py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm mt-2">
              Send a message to see the constructed prompt
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Token Distribution Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Token Distribution</h3>
              <div className="space-y-2">
                {Object.entries(promptBreakdown.token_estimates)
                  .filter(([key]) => key !== 'total')
                  .map(([section, tokens]) => {
                    const percentage = (tokens / promptBreakdown.token_estimates.total) * 100;
                    const color = getSectionColor(section);
                    return (
                      <div key={section} className="flex items-center space-x-3">
                        <div className="w-20 text-sm text-gray-600 capitalize">
                          {section.replace('_', ' ')}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${color}-400 h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-gray-600 text-right">
                          {tokens}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Prompt Sections */}
            <div className="space-y-3">
              {renderSection('system', 'System Prompt', promptBreakdown.sections.system, promptBreakdown.token_estimates.system)}
              {renderSection('working_memory', 'Working Memory (L1)', promptBreakdown.sections.working_memory, promptBreakdown.token_estimates.working_memory)}
              {renderSection('episodic_memory', 'Episodic Memory (L2)', promptBreakdown.sections.episodic_memory, promptBreakdown.token_estimates.episodic_memory)}
              {renderSection('semantic_archive', 'Semantic Archive (L3)', promptBreakdown.sections.semantic_archive, promptBreakdown.token_estimates.semantic_archive)}
              {renderSection('user_query', 'User Query', promptBreakdown.sections.user_query, promptBreakdown.token_estimates.user_query)}
            </div>

            {/* Fusion Weights Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Memory Fusion Weights</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {(fusionWeights.w_L1 * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-600">L1 Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {(fusionWeights.w_L2 * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-600">L2 Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {(fusionWeights.w_L3 * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-600">L3 Weight</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};