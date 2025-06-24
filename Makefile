
build:
	pnpm install
	bun scripts/cat-dirs.ts
	bun scripts/indexing-lists.ts
	bun scripts/check-config.ts
	pnpm install --no-frozen-lockfile
	bun scripts/test-mcp-clients.ts
	bun scripts/readme-gen.ts
	pnpm run lint
	pnpm run build