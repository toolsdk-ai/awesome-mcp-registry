build:
	bun scripts/cat-dirs.ts
  # Install the dependencies needed to run `indexing-lists.ts`
	pnpm install --no-frozen-lockfile
	bun scripts/indexing-lists.ts
	bun scripts/check-config.ts
  # Install dependencies based on the updated `package.json`
	pnpm install --no-frozen-lockfile
	npx tsx scripts/test-mcp-clients.ts
	pnpm install --no-frozen-lockfile
	pnpm prune
	bun scripts/readme-gen.ts
	pnpm run sort
	pnpm run check
	pnpm run build

build-py:
	bun scripts/py-deps-lists.ts
	./install-python-deps.sh
	bun scripts/py-test-mcp-clients.ts

# Docker commands - for quick deployment
up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

# Local development commands
search:
	docker compose up meilisearch -d --wait --wait-timeout 60

dev:
	pnpm run dev