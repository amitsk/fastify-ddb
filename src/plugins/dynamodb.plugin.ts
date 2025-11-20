import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { createDynamoDBClient, getDynamoDBConfig } from "../db/dynamodb.client.js";

/**
 * Extend Fastify instance with DynamoDB client
 */
declare module "fastify" {
    interface FastifyInstance {
        dynamodb: DynamoDBDocumentClient;
    }
}

/**
 * DynamoDB plugin for Fastify
 * Initializes and decorates the Fastify instance with a DynamoDB client
 */
const dynamoDBPlugin: FastifyPluginAsync = async (fastify) => {
    const config = getDynamoDBConfig();

    fastify.log.info(
        `Initializing DynamoDB client in ${config.mode} mode (region: ${config.region})`
    );

    const dynamodbClient = createDynamoDBClient(config);

    // Decorate Fastify instance with DynamoDB client
    fastify.decorate("dynamodb", dynamodbClient);

    // Cleanup on server close
    fastify.addHook("onClose", async (instance) => {
        instance.log.info("Closing DynamoDB client");
        // DynamoDB client doesn't require explicit cleanup, but we log it
    });

    fastify.log.info("DynamoDB client initialized successfully");
};

export default fp(dynamoDBPlugin, {
    name: "dynamodb-plugin",
});
