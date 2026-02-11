import jwt from "jsonwebtoken";
import type { Types } from "mongoose";

export const createSecretToken = (id: Types.ObjectId) => {
	const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN;

	if (!secret) {
		console.warn("No JWT secret found in environment variables");
		return jwt.sign({ id }, "test-jwt-secret-for-testing-only", {
			expiresIn: "7d",
		});
	}

	return jwt.sign({ id }, secret, {
		expiresIn: "7d",
	});
};
