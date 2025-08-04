# Cognitive Architecture Simulator

A comprehensive **multi-layered memory system simulator** for advanced AI chatbots, implementing a "best-of-breed" cognitive architecture combining ideas from Gemini, GPT, and Claude memory systems.

## 🧠 Architecture Overview

The simulator implements a sophisticated three-layer memory architecture:

### Memory Layers

- **L1 - Working Memory**: Ephemeral session buffer holding the last N conversational turns for immediate context
- **L2 - Episodic & Emotional Graph**: Neo4j graph database storing structured "who, what, when" with VAD emotional states  
- **L3 - Semantic Archive**: FAISS vector database for hierarchical summaries and insights

### Memory Controller Agent (MCA)

Central orchestrator responsible for:
- **Intelligent Ingestion**: Automated event detection and significance scoring
- **Precision Retrieval**: Weighted memory fusion combining all layers
- **Autonomous State Management**: Conflict resolution, versioning, and pruning

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and PNPM
- Docker and Docker Compose
- Ollama with Mistral Instruct model

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd memory
   pnpm install
   ```

2. **Start infrastructure services:**
   ```bash
   pnpm docker:up
   ```

3. **Install and start Ollama with Mistral:**
   ```bash
   # Install Ollama (see https://ollama.ai)
   ollama pull mistral:instruct
   ollama serve
   ```

4. **Build and start the application:**
   ```bash
   pnpm build
   pnpm dev
   ```

5. **Open the simulator:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Neo4j Browser: http://localhost:7474 (neo4j/test123)

## 🎛️ Features

### Interactive UI Panels

- **Chat Panel**: Direct conversation with the cognitive agent
- **Under the Hood Panel**: Real-time memory operations and processing steps
- **Memory Inspector Panel**: Live view of all memory layers (L1/L2/L3)
- **Prompt Inspector Panel**: Complete prompt construction visualization

### Advanced Capabilities

- **Token Cost & Fusion Tuner**: Interactive sliders to adjust memory layer weights
- **Emotional State Visualizer**: VAD model tracking with Chart.js
- **Real-time WebSocket Updates**: Live memory operation streaming
- **Significance Scoring**: Automated event detection and importance ranking

## 🏗️ Project Structure

```
memory/
├── packages/
│   ├── types/          # Shared TypeScript interfaces
│   ├── backend/        # Fastify API server
│   ├── frontend/       # React + Vite UI
│   ├── mca/           # Memory Controller Agent
│   └── utils/         # Common utilities
├── docker-compose.yml  # Neo4j + Redis services
├── .env               # Environment configuration
└── requirements.md    # Detailed specifications
```

## 📊 Memory Architecture Details

### L1 Working Memory
- In-memory buffer with configurable size limits
- FIFO eviction policy for turns and tokens
- Immediate context for ongoing conversations

### L2 Graph Memory (Neo4j)
- **Characters**: VAD emotional states with temporal tracking
- **Facts**: Versioned nodes with importance scoring
- **Relationships**: Weighted edges with emotional context
- **Turns**: Complete conversation history storage

### L3 Vector Memory (FAISS)
- **Summaries**: Hierarchically generated content summaries
- **Insights**: High-importance extracted knowledge
- **Events**: Significant conversation milestones
- **Metadata**: Access patterns and importance scores

## 🔧 Configuration

Key configuration options in `.env`:

```bash
# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=test123

# Ollama LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:instruct

# Server
PORT=3001
VECTOR_DIMENSION=1536
```

## 🧪 Development

### Available Scripts

```bash
pnpm build          # Build all packages
pnpm dev           # Start development servers
pnpm dev:backend   # Backend only
pnpm dev:frontend  # Frontend only
pnpm docker:up     # Start infrastructure
pnpm docker:down   # Stop infrastructure
```

### Key Technologies

- **Backend**: Fastify, Neo4j Driver, Ollama, tiktoken
- **Frontend**: React, Vite, Tailwind CSS, Chart.js
- **Database**: Neo4j (graph), FAISS (vectors), Redis (optional)
- **LLM**: Mistral Instruct via Ollama

## 📈 Advanced Features

### VAD Emotional Model
The system tracks character emotional states using the Valence-Arousal-Dominance model:
- **Valence**: Pleasure/displeasure (-1 to +1)
- **Arousal**: Activity level (0 to 1)
- **Dominance**: Control/power (0 to 1)

### Weighted Memory Fusion
Final context scoring formula:
```
FinalScore = (w_L1 * R_L1 + w_L2 * R_L2 + w_L3 * R_L3) * Importance * Decay
```

### Significance Scoring
Multi-factor analysis including:
- Keyword-based event detection
- Emotional intensity scoring
- Named entity recognition
- Context-based relevance

## 🔮 Future Development

### Phase 3 Enhancements (Advanced Agent Logic)
- Complete conflict resolution policies
- Autonomous memory pruning algorithms
- Advanced scoring and decay models
- Multi-session context bridging

### Planned Features
- Memory export/import functionality
- Performance analytics dashboard
- Custom significance scoring rules
- Multi-user session support

## 📝 API Reference

### Chat Endpoints
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `GET /api/chat/sessions` - List all sessions

### Memory Endpoints
- `GET /api/memory/inspect` - Current memory state
- `POST /api/memory/search` - Search across memory layers
- `GET /api/memory/characters` - List all characters
- `GET /api/memory/characters/:id/emotions` - Emotional history

### Configuration Endpoints
- `GET /api/config` - Current MCA configuration
- `POST /api/config/fusion-weights` - Update fusion weights
- `POST /api/config/estimate-tokens` - Estimate token costs

### WebSocket Events
- `connection_established` - Client connected
- `chat_response` - New chat response
- `memory_operation` - Real-time memory updates
- `emotional_change` - Character state changes

## 🤝 Contributing

This is a research and educational project exploring advanced AI memory architectures. Contributions are welcome for:

- Additional memory layer implementations
- Enhanced significance scoring algorithms
- UI/UX improvements
- Documentation and examples

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for advancing AI memory research**