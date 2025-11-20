import dotenv from "dotenv";
import { startServer } from "./server.js";

// Load environment variables
dotenv.config();

// Start the server
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
