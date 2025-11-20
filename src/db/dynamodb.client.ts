import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Configuration for DynamoDB client
 */
export interface DynamoDBConfig {
    mode: "local" | "remote";
    region: string;
    endpoint?: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
}

/**
 * Table name constant
 */
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "SkiLifts";

/**
 * GSI name constant
 */
export const GSI_NAME = "SkiLiftsByRiders";

/**
 * Create DynamoDB client based on configuration
 */
export function createDynamoDBClient(config: DynamoDBConfig): DynamoDBDocumentClient {
    const clientConfig: any = {
        region: config.region,
    };

    // Configure for local DynamoDB
    if (config.mode === "local" && config.endpoint) {
        clientConfig.endpoint = config.endpoint;
        clientConfig.credentials = {
            accessKeyId: "dummy",
            secretAccessKey: "dummy",
        };
    }

    // Configure for remote DynamoDB
    if (config.mode === "remote" && config.credentials) {
        clientConfig.credentials = config.credentials;
    }

    const client = new DynamoDBClient(clientConfig);

    // Create document client for easier data manipulation
    const docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true,
            convertClassInstanceToMap: true,
        },
        unmarshallOptions: {
            wrapNumbers: false,
        },
    });

    return docClient;
}

/**
 * Get DynamoDB configuration from environment variables
 */
export function getDynamoDBConfig(): DynamoDBConfig {
    const mode = (process.env.DYNAMODB_MODE || "local") as "local" | "remote";

    if (mode === "local") {
        return {
            mode: "local",
            region: process.env.DYNAMODB_LOCAL_REGION || "us-east-1",
            endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT || "http://localhost:8000",
        };
    }

    return {
        mode: "remote",
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
    };
}
