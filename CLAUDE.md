# Cognitive Architecture Simulator Project

## Project Overview
Multi-layered memory architecture simulator combining L1 working memory, L2 graph memory (Neo4j), and L3 vector memory (FAISS). Full-stack TypeScript with React frontend and Node.js backend.

## Status
✅ **Production Ready** - All lint errors resolved, build passes, strong TypeScript typing enforced

## Core Components
- **L1**: Working memory (session buffer)
- **L2**: Neo4j graph (entities, relationships, VAD emotions)  
- **L3**: FAISS vectors (semantic archive)
- **MCA**: Memory Controller Agent (ingestion, retrieval, state management)

## Tech Stack
Backend: Node.js/TypeScript, Frontend: React/Vite, UI: Tailwind/shadcn, Storage: Neo4j/FAISS, LLM: Ollama

## Key Features
- Multi-panel UI (Chat, Memory Inspector, Under the Hood)
- Interactive token cost & fusion weight tuning
- VAD emotional state tracking and visualization
- Fact versioning with conflict resolution
- Real-time memory operation monitoring

## Development Commands
- **`pnpm dev`**: When running this command, it starts watch mode processes that run indefinitely. Always use with timeout or run in background to avoid getting stuck waiting forever.