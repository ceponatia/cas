# Characters Feature — Implementation Plan

This document captures the plan and open questions for implementing selectable characters with isolated memory and trait-based prompt injection.

## Current status
- Branch: `characters`
- Implemented:
  - Type `CharacterProfile` with structured `attributes` in `@cas/types` (`packages/types/src/character.ts`).
  - Prompt system is template-driven with dynamic memory injection and low-risk consistency heuristics.

## Plan (in order)

### 1) Data store + seeding
- Create JSON files under `packages/backend/data/characters/*.json` conforming to `CharacterProfile`.
- Add a Neo4j seeder to upsert Character nodes:
  - File: `packages/backend/src/scripts/seed-characters.ts`
  - Upsert by `id`; set properties: `id`, `name`, `baseline_vad` (as nested object or separate properties), and store `attributes` as JSON for now.
  - Keep schema-compatible with existing L2 graph memory; no breaking changes.
- Add scripts:
  - In `packages/backend/package.json`: `"seed:characters": "tsx src/scripts/seed-characters.ts"` (or `ts-node` if preferred).
  - In root: `"seed:characters": "pnpm --filter @cas/backend run seed:characters"`.

### 2) CharacterRegistry + API
- Implement `CharacterRegistry` to load/cache JSON:
  - File: `packages/backend/src/services/character-registry.ts`
  - Methods: `list()`, `get(id)`, internal file watching or simple memoization.
- Add routes:
  - File: `packages/backend/src/routes/characters.ts`
  - `GET /api/characters` → list minimal info (id, name, avatar_url, short description).
  - `GET /api/characters/:id` → full `CharacterProfile`.
  - Register route in `packages/backend/src/routes/index.ts`.

### 3) Chat route + session and prompt wiring
- Update `packages/backend/src/routes/chat.ts` to accept `character_id` and optional `template_vars`.
- Behavior when `character_id` is present:
  - Default `prompt_template` to `roleplay`.
  - Resolve `template_vars.char` from `CharacterProfile` (include name and selected attributes as needed).
  - Scope session: `sessionId = `${baseSessionId}:${character_id}``.
  - Pass `character_id` into memory retrieval queries.

### 4) Memory scoping (L2/L3)
- L2 Graph:
  - Add optional `characterId` filter to retrieval queries so only facts/relationships relevant to the selected character are returned when provided.
- L3 Vector:
  - Ensure ingested fragments are tagged with `character_id` metadata.
  - Filter retrieval by `character_id` when present.

### 5) L1 working memory partitioning
- Maintain per-session-and-character working turns (e.g., key by `sessionId:characterId`).

### 6) Frontend selector and wiring
- Add a `CharacterSelector` component (simple list → selects one `character_id`).
- Update `ChatPanel` to include the selected `character_id` when sending messages.
- When `character_id` is set, send `prompt_template=roleplay` and `template_vars.char` from the selected profile.

## Notes on prompt injection
- Continue using the template system with `{{MEMORY_CONTEXT}}`.
- For roleplay, inject only high-salience character attributes (e.g., category `speech`, `personality`, and key `physical` traits) to stay within token budget.
- Consistency injector can treat roleplay as a strong cue and optionally increase cadence early in the session, still respecting cooldowns.

## Open questions
1) Seed data
   - OK to include 2–3 sample characters (e.g., Alex, Blake) as initial JSON and seed into Neo4j?
2) Template defaulting
   - Should `roleplay` be the default template whenever `character_id` is provided?
3) API and scripts naming
   - Any preference for API paths (`/api/characters`) or seeder script names/locations?

## Acceptance criteria
- Backend exposes character list/detail endpoints.
- Seeder creates/updates Character nodes in Neo4j from JSON files.
- Chat API accepts `character_id` and uses it to:
  - Select the `roleplay` template (by default),
  - Populate template vars from the profile,
  - Scope L1/L2/L3 memory to the selected character,
  - Partition working memory by session+character.
- Frontend can select a character and chat with isolated memory.

## Rollout and testing
- Run Neo4j and the backend; execute the seeder.
- Verify `/api/characters` and `/api/characters/:id`.
- Start a session with character A, create some facts; switch to character B and confirm isolation.
- Confirm prompt contains expected per-trait injections and respects token budget.

## Risks and mitigations
- Token pressure from verbose attributes → limit to salient attributes and categories.
- Schema drift with L2 graph → keep attributes as JSON initially; evolve mapping later.
- Frontend state complexity → keep selector minimal; default to “None” when unselected.
