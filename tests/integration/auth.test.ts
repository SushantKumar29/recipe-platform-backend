import request from "supertest";
import { describe, it, expect } from "@jest/globals";
import app from "../../src/app";

describe("Auth API", () => {
	const userData = {
		name: "Test User",
		email: "test@example.com",
		password: "password123",
	};

	it("registers a new user", async () => {
		const res = await request(app)
			.post("/api/v1/auth/signup")
			.send(userData)
			.expect(201);

		expect(res.body).toHaveProperty("token");
		expect(res.body.user.email).toBe(userData.email);
	});

	it("prevents duplicate registration", async () => {
		await request(app).post("/api/v1/auth/signup").send(userData).expect(201);

		const res = await request(app)
			.post("/api/v1/auth/signup")
			.send(userData)
			.expect(400);

		expect(res.body.message).toMatch(/already/i);
	});

	it("logs in an existing user", async () => {
		await request(app).post("/api/v1/auth/signup").send(userData);

		const res = await request(app)
			.post("/api/v1/auth/login")
			.send({
				email: userData.email,
				password: userData.password,
			})
			.expect(200);

		expect(res.body).toHaveProperty("token");
	});

	it("rejects login with wrong password", async () => {
		await request(app).post("/api/v1/auth/signup").send(userData);

		await request(app)
			.post("/api/v1/auth/login")
			.send({
				email: userData.email,
				password: "wrongpassword",
			})
			.expect(401);
	});
});
