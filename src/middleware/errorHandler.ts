import type { Request, Response } from 'express';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
}

export const errorHandler = (error: ErrorWithStatus, req: Request, res: Response) => {
  console.error('Error:', error);

  if (
    process.env.NODE_ENV !== 'test' ||
    (error.name !== 'ValidationError' && error.name !== 'CastError')
  ) {
    console.error(error);
  }

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors || {})
      .map((err) => err.message)
      .join(', ');
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  } else if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
