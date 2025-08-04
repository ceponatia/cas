import { useState, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { UnderTheHoodPanel } from './components/UnderTheHoodPanel';
import { MemoryInspectorPanel } from './components/MemoryInspectorPanel';
import { PromptInspectorPanel } from './components/PromptInspectorPanel';
import { TokenCostTuner } from './components/TokenCostTuner';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { WeightedMemoryFusion, ChatMessage, MemoryOperation } from '@cas/types';

function App() {
  const [fusionWeights, setFusionWeights] = useState<WeightedMemoryFusion>({
    w_L1: 0.4,
    w_L2: 0.4,
    w_L3: 0.2
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memoryOperations, setMemoryOperations] = useState<MemoryOperation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Generate session ID on mount
  useEffect(() => {
    setCurrentSessionId(crypto.randomUUID());
  }, []);

  const handleNewMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    
    // Add memory operations from message metadata
    if (message.metadata?.memory_operations) {
      setMemoryOperations(prev => [...prev, ...(message.metadata?.memory_operations || [])]);
    }
  };

  const handleFusionWeightsChange = (newWeights: WeightedMemoryFusion) => {
    setFusionWeights(newWeights);
  };

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Cognitive Architecture Simulator
              </h1>
              <div className="text-sm text-gray-500">
                Session: {currentSessionId.slice(0, 8)}...
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Token Cost Tuner */}
          <div className="mb-6">
            <TokenCostTuner
              fusionWeights={fusionWeights}
              onWeightsChange={handleFusionWeightsChange}
              sessionId={currentSessionId}
            />
          </div>

          {/* Main 4-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]">
            {/* Top Left: Chat Panel */}
            <div className="bg-white rounded-lg shadow">
              <ChatPanel
                sessionId={currentSessionId}
                onNewMessage={handleNewMessage}
                fusionWeights={fusionWeights}
              />
            </div>

            {/* Top Right: Under the Hood Panel */}
            <div className="bg-white rounded-lg shadow">
              <UnderTheHoodPanel operations={memoryOperations} />
            </div>

            {/* Bottom Left: Memory Inspector Panel */}
            <div className="bg-white rounded-lg shadow">
              <MemoryInspectorPanel sessionId={currentSessionId} />
            </div>

            {/* Bottom Right: Prompt Inspector Panel */}
            <div className="bg-white rounded-lg shadow">
              <PromptInspectorPanel 
                messages={messages}
                fusionWeights={fusionWeights}
              />
            </div>
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}

export default App;