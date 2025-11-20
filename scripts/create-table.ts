import {
    CreateTableCommand,
    DynamoDBClient,
    ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const client = new DynamoDBClient({
    region: process.env.DYNAMODB_LOCAL_REGION || "us-east-1",
    endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT || "http://localhost:9900",
    credentials: {
        accessKeyId: "dummy",
        secretAccessKey: "dummy",
    },
});

const tableName = process.env.DYNAMODB_TABLE_NAME || "SkiLifts";

async function createTable() {
    const command = new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
            {
                AttributeName: "Lift",
                AttributeType: "S",
            },
            {
                AttributeName: "Metadata",
                AttributeType: "S",
            },
            {
                AttributeName: "TotalUniqueLiftRiders",
                AttributeType: "N",
            },
        ],
        KeySchema: [
            {
                AttributeName: "Lift",
                KeyType: "HASH",
            },
            {
                AttributeName: "Metadata",
                KeyType: "RANGE",
            },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "SkiLiftsByRiders",
                KeySchema: [
                    {
                        AttributeName: "Lift",
                        KeyType: "HASH",
                    },
                    {
                        AttributeName: "TotalUniqueLiftRiders",
                        KeyType: "RANGE",
                    },
                ],
                Projection: {
                    ProjectionType: "INCLUDE",
                    NonKeyAttributes: ["Metadata"],
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    });

    try {
        const response = await client.send(command);
        console.log("✅ Table created successfully!");
        console.log(`Table Name: ${tableName}`);
        console.log(`Table Status: ${response.TableDescription?.TableStatus}`);
        console.log(`Table ARN: ${response.TableDescription?.TableArn}`);
    } catch (error) {
        if (error instanceof ResourceInUseException) {
            console.log(`ℹ️  Table "${tableName}" already exists`);
        } else {
            console.error("❌ Error creating table:", error);
            throw error;
        }
    }
}

createTable()
    .then(() => {
        console.log("\n🎉 Setup complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Setup failed:", error);
        process.exit(1);
    });
