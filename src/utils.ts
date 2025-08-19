import { z } from '@hono/zod-openapi';
import { ErrorResponseSchema } from './schema';
import type { Response } from './types';

export const createResponse = <T>(
  data: T,
  options?: {
    success?: boolean;
    code?: number;
    message?: string;
  },
): Response<T> => {
  const { success = true, code = 200, message = 'Success' } = options || {};

  return {
    success,
    code,
    message,
    data,
  };
};

export const createErrorResponse = (message: string, code: number = 400) => {
  return {
    success: false,
    code,
    message,
  };
};

export const createRouteResponses = <T extends z.ZodTypeAny>(
  successSchema: T,
  options?: {
    successDescription?: string;
    includeErrorResponses?: boolean;
  },
) => {
  const { successDescription = 'Success', includeErrorResponses = false } = options || {};

  const responses: Record<
    number,
    {
      content: Record<
        string,
        {
          schema: z.ZodTypeAny;
        }
      >;
      description: string;
    }
  > = {
    200: {
      content: {
        'application/json': {
          schema: successSchema,
        },
      },
      description: successDescription,
    },
  };

  if (includeErrorResponses) {
    responses[400] = {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Bad Request',
    };

    responses[404] = {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Not Found',
    };

    responses[500] = {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Internal Server Error',
    };
  }

  return responses;
};
