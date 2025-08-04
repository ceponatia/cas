# **Project Brief: The Cognitive Architecture Simulator**

## **1\. Vision & Objective**

This project's objective is to build an interactive **Cognitive Architecture Simulator**: a web-based application for prototyping, visualizing, and stress-testing the "best-of-breed" chatbot memory system.

The final product will not be just a chatbot, but a powerful developer tool. It will allow a user to visually inspect the inner workings of a sophisticated, multi-layered memory system, manipulate its parameters in real-time, and understand the trade-offs between different memory strategies. The primary goal is to create a "glass box" environment to de-mystify advanced AI memory and accelerate the development of truly persistent, context-aware conversational agents.

**Target LLM for Integration:** Mistral Instruct (via Ollama) for local, high-performance testing.

## **2\. The Unified Cognitive Architecture**

The simulator will be a faithful implementation of our synthesized "best-of-breed" architecture, which combines the strengths of the Gemini, GPT, and Claude proposals.

* **L1 \- Working Memory (The Scratchpad):** An ephemeral, session-based buffer holding the last N conversational turns. Its purpose is to provide immediate, low-latency context for the ongoing dialogue.  
* **L2 \- Episodic & Emotional Graph (The Core Memory):** The heart of the system. A graph database (Neo4j) that stores the structured "who, what, when" of the conversation. It goes beyond simple facts to map relationships, track entity state, and, crucially, model emotional evolution using the VAD (Valence-Arousal-Dominance) framework. Its purpose is to enable deep reasoning and maintain character consistency.  
* **L3 \- Semantic Archive (The Long-Term Recall):** A vector database (FAISS) that stores embeddings of hierarchically-generated summaries and generalized insights. Its purpose is to provide broad, semantically-relevant context for exploratory queries that may not map to a specific entity in the graph.

### **The Brain of the Operation: The Memory Controller Agent (MCA)**

The MCA is the central agentic process that orchestrates the entire system. It is not a passive data manager; it is an intelligent orchestrator guided by a specific system prompt and equipped with tools to interact with the memory layers. Its core responsibilities are:

* **Intelligent Ingestion (The "Write" Path):** On receiving a new conversational turn, the MCA decides *what* is worth remembering and *how*. It uses **Automated Event Detection** (e.g., based on emotional valence or keyword triggers) to identify significant moments that warrant a memory update.  
* **Precision Retrieval (The "Read" Path):** On receiving a user query, the MCA performs a multi-stage retrieval process, culminating in **Weighted Memory Fusion** to construct a token-efficient, highly-relevant context block for the LLM.  
* **Autonomous State Management:** The MCA is responsible for the long-term health of the memory system, executing policies for **conflict resolution, fact versioning, and memory pruning/archiving.**

## **3\. Functional Modules & MVP Scope**

The project will be developed in modules, with the Minimum Viable Product (MVP) encompassing the core functionality of each.

### **Module A: The Living Memory Core (Backend)**

This module represents the foundational memory architecture itself.

* **A1. Multi-Layer Storage:**  
  * Implement L1 as an in-memory buffer.  
  * Implement L2 using Neo4j, with a clearly defined schema for character nodes (including VAD attributes) and relationship edges.  
  * Implement L3 using FAISS for local vector storage.  
* **A2. The Memory Controller Agent (MCA):**  
  * Develop the core logic for the MCA, including the read/write paths.  
  * Implement the manage\_memory\_state() function to handle **fact versioning and conflict resolution**. A new, contradictory fact should not overwrite the old one but should be added as the current\_value in a versioned history on the graph node.  
* **A3. LLM Integration:**  
  * Create a wrapper to communicate with a local Mistral Instruct model served via Ollama.

### **Module B: The Interactive Command Center (Frontend)**

This is the user-facing simulator UI, designed for interaction and insight.

* **B1. Multi-Panel Simulator View:**  
  * **Chat Panel:** A standard interface for interacting with the chatbot.  
  * **"Under the Hood" Panel:** A real-time log that visualizes the MCA's operations for each turn (e.g., "Querying L2 Graph for 'Project Phoenix'...", "Fusing 3 memories...").  
  * **Memory Inspector Panel:** A raw data inspector that allows the user to view the current state of L1, L2 (e.g., via graph visualization), and L3.  
* **B2. Token Cost & Fusion Tuner:**  
  * A dedicated UI component that displays the token cost of the final context sent to the LLM.  
  * This component **must** include interactive sliders allowing the user to **adjust the fusion weights** for L1, L2, and L3, with the token counter updating in real-time to show the impact of their choices.  
* **B3. Emotional State Visualizer:**  
  * A Chart.js-based line graph that queries the L2 graph to plot the historical VAD emotional state for a selected character over time.

## **4\. Proposed Technology Stack**

This stack is chosen to prioritize a cohesive, modern development experience using TypeScript across the stack, which allows for shared data models and types.

| Layer | Tool / Framework | Justification |
| :---- | :---- | :---- |
| **LLM Backend** | **Ollama** with **Mistral Instruct** | Provides excellent local performance for free, ideal for rapid prototyping without API costs. |
| **Application Backend** | **Node.js** with **Fastify** or **Hono** | High-performance, low-overhead frameworks perfect for building a responsive API. TypeScript-native. |
| **Frontend** | **React** with **Vite** & **TypeScript** | The industry standard for building complex, interactive UIs. Vite provides a best-in-class developer experience. |
| **UI Components** | **Tailwind CSS** & **shadcn/ui** | For rapid, professional, and accessible UI development. |
| **Data Visualization** | **Chart.js** | Lightweight, powerful, and easy to integrate for the emotional state and token cost graphs. |
| **L2 Graph Memory** | **Neo4j** (via Docker) | The most mature and powerful graph database, with an excellent official JavaScript driver for the backend. |
| **L3 Vector Memory** | **FAISS** (via faiss-node) | A highly performant, industry-standard library for vector search that can be run entirely locally. |
| **Tokenization** | **tiktoken** | An accurate library for estimating token counts for OpenAI-compatible models like Mistral. |

## **5\. Phased Development Roadmap**

### **Phase 1: The Foundation (Backend Setup)**

* **Goal:** Establish the core architectural components and data flow.  
* **Tasks:**  
  1. Set up the local development environment: Node.js, Ollama, Neo4j (Docker), Vite.  
  2. Build the backend API service.  
  3. Implement the Ollama wrapper for LLM communication.  
  4. Implement the L2 Neo4j and L3 FAISS storage connectors.  
  5. Develop the initial version of the Memory Controller Agent, focusing on the basic read/write paths.

### **Phase 2: The Simulator (Frontend & Interaction)**

* **Goal:** Create the interactive user interface for visualizing memory operations.  
* **Tasks:**  
  1. Scaffold the React frontend with Tailwind CSS.  
  2. Build the multi-panel UI (Chat, Under the Hood, Inspector).  
  3. Connect the frontend to the backend API.  
  4. Implement the **Token Cost & Fusion Tuner** with interactive sliders.  
  5. Implement the **Emotional State Visualizer** using Chart.js, fetching data from the L2 graph.

### **Phase 3: The Intelligence (Advanced Agent Logic)**

* **Goal:** Enhance the MCA with autonomous state management capabilities.  
* **Tasks:**  
  1. Implement the full manage\_memory\_state() logic, including **conflict resolution and versioning** in Neo4j.  
  2. Implement a basic **scoring and decay model** for memories.  
  3. Develop a **pruning policy** to archive low-score memories.  
  4. Refine the UI to expose these new intelligent behaviors (e.g., showing a version history for a fact).

## **6\. Data Schemas (Initial Draft)**

* **L2 Graph Node (Character):**  
  {  
    "id": "character:alice",  
    "name": "Alice",  
    "type": "Character",  
    "emotional\_state": {  
      "valence": 0.6,  
      "arousal": 0.3,  
      "dominance": 0.5  
    },  
    "created\_at": "2025-08-03T12:00:00Z",  
    "last\_updated": "2025-08-03T12:00:00Z"  
  }

* **L2 Graph Node (Fact with Versioning):**  
  {  
    "id": "fact:alice\_cloak\_color",  
    "entity": "character:alice",  
    "attribute": "cloak\_color",  
    "current\_value": "red",  
    "history": \[  
      {"value": "blue", "timestamp": "2025-06-02T10:00:00Z"},  
      {"value": "red", "timestamp": "2025-08-03T14:30:00Z"}  
    \]  
  }

* **L3 Vector Metadata:**  
  {  
    "doc\_id": "summary\_12345",  
    "source\_session\_id": "session\_abc",  
    "timestamp": "2025-08-03T15:00:00Z",  
    "importance\_score": 8.5,  
    "last\_accessed": "2025-08-03T15:00:00Z",  
    "access\_count": 1  
  }  
