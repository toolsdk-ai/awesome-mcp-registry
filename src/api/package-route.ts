import { Hono } from 'hono';
import { packageController } from './package-controller';

export const packageRoutes = new Hono();

packageRoutes.post('/tools/execute', packageController.executeTool);
