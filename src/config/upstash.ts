import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Rate limit is 10000 requests per 1 minute
const rateLimit = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(10000, "60 s"),
});

export default rateLimit;
