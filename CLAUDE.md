# Cognitive Architecture Simulator Project

## Project Overview
This is a **Cognitive Architecture Simulator**: a web-based tool for prototyping, visualizing, and stress-testing advanced chatbot memory systems. It implements a "best-of-breed" multi-layered memory architecture combining ideas from Gemini, GPT, and Claude.

## Architecture Components

### Memory Layers
- **L1 - Working Memory**: Ephemeral session buffer (last N turns)
- **L2 - Episodic & Emotional Graph**: Neo4j graph database storing entities, relationships, and VAD emotional states
- **L3 - Semantic Archive**: FAISS vector database for hierarchical summaries and insights

### Memory Controller Agent (MCA)
Central orchestrator responsible for:
- Intelligent ingestion (write path with automated event detection)
- Precision retrieval (read path with weighted memory fusion)
- Autonomous state management (conflict resolution, versioning, pruning)

## Technology Stack
- **LLM**: Mistral Instruct via Ollama (local)
- **Backend**: Node.js with Fastify/Hono (TypeScript)
- **Frontend**: React + Vite + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Visualization**: Chart.js
- **L2 Storage**: Neo4j (Docker)
- **L3 Storage**: FAISS (faiss-node)
- **Tokenization**: tiktoken

## Key Features
- Multi-panel UI: Chat, "Under the Hood" logging, Memory Inspector
- Token Cost & Fusion Tuner with interactive sliders
- Emotional State Visualizer (VAD tracking over time)
- Real-time memory operation visualization
- Fact versioning and conflict resolution

## Data Schemas
- Character nodes with VAD emotional states
- Versioned fact nodes with history tracking
- Vector metadata with importance scoring and access tracking

## Development Phases
1. **Foundation**: Backend setup, core components, basic MCA
2. **Simulator**: Frontend UI, visualization, interaction
3. **Intelligence**: Advanced MCA logic, state management, pruning

## Production-Ready Features (from Analysis)

### Memory Controller Agent Core Functions
- **`manage_memory_state()`**: Runs after every write operation with three sub-processes:
  1. **Conflict Resolution**: Query L2 graph for contradictory facts, trigger resolution policy
  2. **Versioning**: Create versioned history on nodes/edges (audit trail in L2 graph)
  3. **Pruning & Archiving**: Use composite scoring (recency + importance) for memory lifecycle

### Interactive Token Cost Analysis
- **Weighted Memory Fusion UI**: Interactive sliders for L1/L2/L3 weights
- Real-time token meter updates showing impact of weight adjustments
- Educational tool for developers to learn memory system tuning

### VAD Emotional Model Implementation
- Store VAD state (`{valence, arousal, dominance}`) as properties on character nodes in L2 graph
- Enable powerful queries: "Show Alice interactions when arousal > 0.7"
- Historical VAD visualization via Chart.js querying L2 graph data
- Timestamp updates on character nodes for emotional evolution tracking

### Context-Aware Development Tools
- Dynamic tool recommendations in "Under the Hood" panel
- Clickable tool names with modals showing documentation/code snippets
- Just-in-time learning integrated with memory operations

## Important Notes
- Focus on developer tool experience and "glass box" visibility
- Implement fact versioning (don't overwrite conflicting facts)
- Real-time token cost visualization with interactive weight tuning
- Local-first development (no API costs)
- VAD emotional state as first-class queryable citizen of core memory

## Development Commands
- **`pnpm dev`**: When running this command, it starts watch mode processes that run indefinitely. Always use with timeout or run in background to avoid getting stuck waiting forever.