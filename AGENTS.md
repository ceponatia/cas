# AGENTS

## Zod Schema Generation
- Run `pnpm --filter @cas/types generate:zod` after modifying TypeScript types.
- Commit generated files under `packages/types/src/zod`.
- Schemas are re-exported from `@cas/types` so consumers can import directly.

## To-Do
- [ ] Replace backend validation with Zod schemas.
- [ ] Replace frontend validation with Zod schemas.
- [ ] Document schema usage examples in backend and frontend.
