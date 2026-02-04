import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

dotenv.config({ quiet: true });

export const createSecretToken = (id: Types.ObjectId): string => {
	return jwt.sign({ id }, process.env.ACCESS_TOKEN as string, {
		expiresIn: 3 * 24 * 60 * 60,
	});
};
