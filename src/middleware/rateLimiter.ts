import type { Request, Response, NextFunction } from "express";
import rateLimit from "../config/upstash.js";

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { success } = await rateLimit.limit(req.ip || "unknown"); // Should be done per user OR IP Address
		if (!success) {
			return res
				.status(429)
				.json({ message: "Too many requests, Please try again later" });
		}
		next();
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
		next(error);
	}
};

export default rateLimiter;
