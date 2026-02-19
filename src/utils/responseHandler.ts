import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { logger } from '../lib/logger.js';

export const successResponse = (res: Response, message: string, data: object | null = null) => {
  const response: { success: boolean; message: string; data?: object } = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(HttpStatusCode.Ok).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HttpStatusCode.InternalServerError,
  error: Error | null = null,
) => {
  const response: {
    success: boolean;
    message: string;
    error?: { message: string; stack: string | undefined };
  } = {
    success: false,
    message,
  };

  if (error) {
    response.error = {
      message: error.message || String(error),
      stack: error.stack,
    };
  }

  logger.error(`Error Response: ${JSON.stringify({ message, statusCode, error }, null, 2)}`);

  return res.status(statusCode).json(response);
};
