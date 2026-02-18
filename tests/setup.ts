import { PrismaClient } from '@prisma/client';
import { beforeAll, beforeEach, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

process.env.PG_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/recipe_platform_test';
process.env.NODE_ENV = 'test';

let prisma = new PrismaClient();

beforeAll(async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    console.log('⚠️ Test database not found, creating it...');

    let dbCreated = false;

    try {
      execSync(
        'docker exec -i recipe_postgres psql -U postgres -c "CREATE DATABASE recipe_platform_test;"',
        { stdio: 'ignore' },
      );
      console.log('✅ Created test database using Docker');
      dbCreated = true;
    } catch (dockerError) {
      console.error('❌ Failed to create test database:', dockerError);
      console.log('⚠️ Could not create test database, using local PostgreSQL');
      try {
        execSync('psql -U postgres -h localhost -c "CREATE DATABASE recipe_platform_test;"', {
          stdio: 'ignore',
        });
        console.log('✅ Created test database using local PostgreSQL');
        dbCreated = true;
      } catch (localError) {
        console.error('❌ Failed to create test database:', localError);
        console.log('⚠️ Could not create test database, using default database instead');

        process.env.PG_DATABASE_URL =
          'postgresql://postgres:postgres@localhost:5432/recipe_platform_db';
        prisma = new PrismaClient();
      }
    }

    if (dbCreated) {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: process.env.PG_DATABASE_URL },
        stdio: 'inherit',
      });
    }

    await prisma.$connect();
    console.log('✅ Connected to database');
  }
});

beforeEach(async () => {
  if (process.env.PG_DATABASE_URL?.includes('recipe_platform_test')) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Comment" CASCADE;`).catch(() => {});
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Rating" CASCADE;`).catch(() => {});
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Recipe" CASCADE;`).catch(() => {});
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`).catch(() => {});
  } else {
    console.log('⚠️ Using default database, skipping truncation to preserve data');
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
