import compress from "@fastify/compress";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";
import dynamoDBPlugin from "./plugins/dynamodb.plugin.js";
import { skiLiftRoutes } from "./routes/skilift.routes.js";

/**
 * Build Fastify server
 */
export async function buildServer() {
    const fastify = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || "info",
            transport:
                process.env.NODE_ENV === "development"
                    ? {
                        target: "pino-pretty",
                        options: {
                            translateTime: "HH:MM:ss Z",
                            ignore: "pid,hostname",
                        },
                    }
                    : undefined,
        },
    });

    // Register Helmet for security headers
    await fastify.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    });

    // Register Compress for response compression
    await fastify.register(compress, {
        global: true,
        threshold: 1024, // Only compress responses larger than 1KB
    });

    // Register CORS
    await fastify.register(cors, {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    });

    // Register DynamoDB plugin
    await fastify.register(dynamoDBPlugin);

    // Register routes
    await fastify.register(skiLiftRoutes);

    // Health check endpoint
    fastify.get("/health", async () => {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    });

    // Root endpoint
    fastify.get("/", async () => {
        return {
            name: "Fastify DynamoDB API",
            version: "1.0.0",
            description: "Ski Lift CRUD API with DynamoDB",
            endpoints: {
                health: "/health",
                api: "/api/skilifts",
            },
        };
    });

    return fastify;
}

/**
 * Start the server
 */
export async function startServer() {
    const fastify = await buildServer();

    const host = process.env.HOST || "0.0.0.0";
    const port = Number.parseInt(process.env.PORT || "3000", 10);

    try {
        await fastify.listen({ host, port });
        fastify.log.info(`Server listening on http://${host}:${port}`);
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }

    // Graceful shutdown
    const signals = ["SIGINT", "SIGTERM"];
    for (const signal of signals) {
        process.on(signal, async () => {
            fastify.log.info(`Received ${signal}, closing server gracefully`);
            await fastify.close();
            process.exit(0);
        });
    }

    return fastify;
}
