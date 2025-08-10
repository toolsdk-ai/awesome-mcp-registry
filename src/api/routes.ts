import { Hono } from 'hono';
import { toolController } from './tool-controller';

export const apiRoutes = new Hono();

apiRoutes.post('/tools/execute', toolController.executeTool);
