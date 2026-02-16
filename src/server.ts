import dotenv from "dotenv";

import config from "./config/config.js";
import app from "./app.js";
import { dbInitializer } from "./config/dbInit.ts";

dotenv.config({ quiet: true });

async function startServer() {
	try {
		// Initialize all database tables at once
		await dbInitializer.initializeAllTables();

		// Start server
		app.listen(config.port, () => {
			console.log(`🚀 Server is running on port ${config.port}`);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
