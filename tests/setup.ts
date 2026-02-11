import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, beforeEach, afterAll } from "@jest/globals";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.ACCESS_TOKEN = "test-jwt-secret-key-for-testing-only";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";
process.env.UPSTASH_REDIS_REST_URL = "http://localhost:8080";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

let mongo: MongoMemoryServer;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	const mongoUri = mongo.getUri();

	process.env.MONGODB_URI = mongoUri;

	await mongoose.connect(mongoUri);
});

beforeEach(async () => {
	const collections = mongoose.connection.collections;

	for (const key in collections) {
		await collections[key].deleteMany({});
	}
});

afterAll(async () => {
	await mongoose.connection.close();
	if (mongo) {
		await mongo.stop();
	}
});
