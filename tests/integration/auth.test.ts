import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth API', () => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: userData.email },
      });
    } catch (error) {
      console.error(error);
    }
  });

  it('registers a new user', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(userData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(userData.email);
  });

  it('prevents duplicate registration', async () => {
    const firstRes = await request(app).post('/api/v1/auth/signup').send(userData);

    expect(firstRes.status).toBe(201);

    const secondRes = await request(app).post('/api/v1/auth/signup').send(userData);

    expect(secondRes.status).toBe(400);
    expect(secondRes.body.message).toMatch(/already exists/i);
  });

  it('logs in an existing user', async () => {
    await request(app).post('/api/v1/auth/signup').send(userData).expect(201);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(userData.email);
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/v1/auth/signup').send(userData).expect(201);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });
});
