import dotenv from "dotenv";

import config from "./config/config.js";
import app from "./app.js";
import { connectDB } from "./config/db.ts";

dotenv.config({ quiet: true });

if (process.env.NODE_ENV !== "test") {
	await connectDB().then(() => {
		app.listen(config.port, () => {
			console.log(`Server running on port ${config.port}`);
		});
	});
}
