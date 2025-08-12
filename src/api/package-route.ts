/* eslint-disable @typescript-eslint/no-require-imports */
import { Hono } from 'hono';
import { packageHandler } from './package-handler';
import type { CategoryConfig, PackagesList, Response } from '../types';

export const packageRoutes = new Hono();

packageRoutes.post('/packages/run', packageHandler.executeTool);

packageRoutes.get('/packages/detail', packageHandler.getPackageDetail);

packageRoutes.get('/config/categories', (c) => {
  const categories: CategoryConfig[] = require('../../config/categories.mjs').default;
  const response: Response<CategoryConfig[]> = {
    success: true,
    code: 200,
    message: 'Categories retrieved successfully',
    data: categories,
  };
  return c.json(response);
});

packageRoutes.get('/config/featured', (c) => {
  const featured: string[] = require('../../config/featured.mjs').default;
  const response: Response<string[]> = {
    success: true,
    code: 200,
    message: 'Featured list retrieved successfully',
    data: featured,
  };
  return c.json(response);
});

packageRoutes.get('/indexes/packages-list', async (c) => {
  const packagesList: PackagesList = (await import('../../indexes/packages-list.json')).default;
  const response: Response<PackagesList> = {
    success: true,
    code: 200,
    message: 'Packages list retrieved successfully',
    data: packagesList,
  };
  return c.json(response);
});
