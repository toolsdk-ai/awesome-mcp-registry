/* eslint-disable @typescript-eslint/no-require-imports */
import { Hono } from 'hono';
import { packageController } from './package-controller';
import type { CategoryConfig, PackagesList } from '../types';

export const packageRoutes = new Hono();

packageRoutes.post('/packages/run', packageController.executeTool);

packageRoutes.get('/config/categories', (c) => {
  const categories: CategoryConfig[] = require('../../config/categories.mjs').default;
  return c.json(categories);
});

packageRoutes.get('/config/featured', (c) => {
  const featured: string[] = require('../../config/featured.mjs').default;
  return c.json(featured);
});

packageRoutes.get('/indexes/packages-list', async (c) => {
  const packagesList: PackagesList = (await import('../../indexes/packages-list.json')).default;
  return c.json(packagesList);
});
