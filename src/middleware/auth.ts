import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import User from "../models/User.ts";

export const requireAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	let token: string | undefined;

	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		token = authHeader.split(" ")[1];
	}

	if (!token && req.headers.cookies) {
		const cookies = req.headers.cookies as string;
		if (cookies && cookies.startsWith("token ")) {
			token = cookies.split("=")[1];
		}
	}

	if (!token) {
		return res.status(401).json({ message: "Unauthorized - No token found" });
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.ACCESS_TOKEN as string,
		) as JwtPayload;

		// const existingUser = await User.findById(decoded.id).select("-password");
		const existingUser = decoded;

		if (!existingUser) {
			return res.status(401).json({ message: "Unauthorized - User not found" });
		}

		res.locals.user = existingUser;
		next();
	} catch (error) {
		console.error("Token verification failed:", error);
		return res.status(401).json({ message: "Invalid token" });
	}
};
