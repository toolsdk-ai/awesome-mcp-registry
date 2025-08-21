
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

dev:
	pnpm run dev

docker-build:
	docker build -t awesome-mcp-registry .

docker-run:
	docker run -d -p 3003:3003 --name mcp-registry awesome-mcp-registry