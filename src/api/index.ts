import dotenv from 'dotenv';
import path from 'path';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { apiRoutes } from './routes';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = new Hono();

app.route('/api', apiRoutes);

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

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
