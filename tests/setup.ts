import { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll } from "@jest/globals";
import dotenv from "dotenv";

dotenv.config();

process.env.PG_DATABASE_URL =
	"postgresql://postgres:postgres@localhost:5432/recipe_platform_test";
process.env.NODE_ENV = "test";

const prisma = new PrismaClient();

beforeAll(async () => {
	await prisma.$connect();
	console.log("✅ Connected to test database");
});

beforeEach(async () => {
	// Clean tables in correct order (respect foreign keys)
	await prisma
		.$executeRawUnsafe(`TRUNCATE TABLE "Comment" CASCADE;`)
		.catch(() => {});
	await prisma
		.$executeRawUnsafe(`TRUNCATE TABLE "Rating" CASCADE;`)
		.catch(() => {});
	await prisma
		.$executeRawUnsafe(`TRUNCATE TABLE "Recipe" CASCADE;`)
		.catch(() => {});
	await prisma
		.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`)
		.catch(() => {});
});

afterAll(async () => {
	await prisma.$disconnect();
});
