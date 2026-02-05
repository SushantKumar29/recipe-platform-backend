import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import config from "./config/config.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import requestLogger from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import recipesRoutes from "./routes/recipesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commentsRoutes from "./routes/commentsRoutes.js";
import swagger from "./swagger.js";

dotenv.config({ quiet: true });
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

await connectDB().then(() => {
	app.listen(config.port, () => {
		console.log(`Server running on port ${config.port}`);
	});
});
