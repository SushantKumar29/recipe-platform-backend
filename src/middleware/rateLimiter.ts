import type { Request, Response, NextFunction } from "express";

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
	if (process.env.NODE_ENV === "test") {
		return next();
	}

	try {
		const { default: rateLimit } = await import("../config/upstash.js");
		const { success } = await rateLimit.limit(req.ip || "unknown");

		if (!success) {
			return res
				.status(429)
				.json({ message: "Too many requests, Please try again later" });
		}

		next();
	} catch (error) {
		console.error("Rate limit error:", error);
		next();
	}
};

export default rateLimiter;
