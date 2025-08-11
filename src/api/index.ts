import dotenv from 'dotenv';
import path from 'path';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { packageRoutes } from './package-route';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = new Hono();

app.route('/api/v1', packageRoutes);

app.get('/', (c) => {
  return c.text('MCP Registry API Server is running!');
});

app.notFound((c) => {
  return c.json({ success: false, message: 'Route not found' }, 404);
});

app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

const port = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3000;
console.log(`Server is running on: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
