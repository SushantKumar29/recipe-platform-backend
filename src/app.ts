import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import requestLogger from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import recipesRoutes from './routes/recipesRoutes.js';
import commentsRoutes from './routes/commentsRoutes.js';

import swagger from './swagger.js';
import rateLimiter from './middleware/rateLimiter.js';
import pool from './config/db.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  }),
);
app.use(requestLogger);
app.use(express.json());
app.use(rateLimiter);

app.get('/', (req, res) => {
  res.send('Welcome to Recipes!');
});

app.get('/pg', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');
    res.json(result.rows[0].current_database);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/recipes', recipesRoutes);
app.use('/api/v1/comments', commentsRoutes);
app.use('/api-docs', swagger);

app.use(cookieParser());
app.use(errorHandler);

export default app;
