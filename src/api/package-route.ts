/* eslint-disable @typescript-eslint/no-require-imports */
import { Hono } from 'hono';
import { packageController } from './package-controller';

export const packageRoutes = new Hono();

packageRoutes.post('/packages/run', packageController.executeTool);

packageRoutes.get('/config/categories', (c) => {
  const categories = require('../../config/categories.mjs').default;
  return c.json(categories);
});

packageRoutes.get('/config/featured', (c) => {
  const featured = require('../../config/featured.mjs').default;
  return c.json(featured);
});

packageRoutes.get('/indexes/packages-list', (c) => {
  const packagesList = require('../../indexes/packages-list.json');
  return c.json(packagesList);
});
