import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = req.cookies?.token;

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN as string);

		res.locals.user = decoded;
		next();
	} catch {
		return res.status(401).json({ message: "Invalid token" });
	}
};
