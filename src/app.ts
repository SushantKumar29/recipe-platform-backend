import express from "express";
import cors from "cors";

import requestLogger from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import recipesRoutes from "./routes/recipesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commentsRoutes from "./routes/commentsRoutes.js";
import swagger from "./swagger.js";
import rateLimiter from "./middleware/rateLimiter.ts";

const app = express();

app.use(
	cors({
		origin: ["http://localhost:5173"],
		credentials: true,
	}),
);
app.use(requestLogger);
app.use(express.json());
app.use(rateLimiter);

app.get("/", (req, res) => {
	res.send("Welcome to Recipes!");
});

app.use("/api/v1/recipes", recipesRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/comments", commentsRoutes);
app.use("/api-docs", swagger);

app.use(errorHandler);

export default app;
