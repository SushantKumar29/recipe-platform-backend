import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
	id: string;
}

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}

export const requireAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		let token: string | undefined;
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.split(" ")[1];
		}

		if (!token && req.headers.cookie) {
			const cookies = req.headers.cookie as string;
			if (cookies && cookies.startsWith("token ")) {
				token = cookies.split("=")[1];
			}
		}

		if (!token && req.headers.authorization) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "fallback_secret",
		) as JwtPayload;

		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};
