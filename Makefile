
build:
	bun scripts/cat-dirs.ts
  # Install the dependencies needed to run `indexing-lists.ts`
	pnpm install --no-frozen-lockfile
	bun scripts/indexing-lists.ts
	bun scripts/check-config.ts
  # Install dependencies based on the updated `package.json`
	pnpm install --no-frozen-lockfile
	bun scripts/test-mcp-clients.ts
	bun scripts/readme-gen.ts
	pnpm run lint
	pnpm run build

build-safe:
	bun scripts/cat-dirs.ts
  # Install the dependencies needed to run `indexing-lists.ts`
	pnpm install --no-frozen-lockfile
	bun scripts/indexing-lists.ts
	bun scripts/check-config.ts
  # Install dependencies based on the updated `package.json`
	pnpm install --no-frozen-lockfile
  # Skip test-mcp-clients.ts to avoid installation errors
	bun scripts/readme-gen.ts
	pnpm run lint
	pnpm run build