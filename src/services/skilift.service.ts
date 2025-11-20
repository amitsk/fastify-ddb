import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GSI_NAME, TABLE_NAME } from "../db/dynamodb.client.js";
import type {
    CreateDynamicDataInput,
    CreateResortDataInput,
    CreateStaticDataInput,
    ListQueryInput,
    QueryByRidersInput,
    UpdateDynamicDataInput,
    UpdateStaticDataInput,
} from "../schemas/skilift.schemas.js";
import type {
    PaginatedResponse,
    SkiLiftDynamicData,
    SkiLiftRecord,
    SkiLiftStaticData,
} from "../types/skilift.types.js";
import { DynamoDBError, NotFoundError } from "../utils/error-handler.js";

/**
 * Service class for SkiLift CRUD operations
 */
export class SkiLiftService {
    constructor(private dynamodb: DynamoDBDocumentClient) { }

    /**
     * Create static ski lift data
     */
    async createStaticData(data: CreateStaticDataInput): Promise<SkiLiftStaticData> {
        const item: SkiLiftStaticData = {
            Lift: data.Lift,
            Metadata: "Static Data",
            ExperiencedRidersOnly: data.ExperiencedRidersOnly,
            VerticalFeet: data.VerticalFeet,
            LiftTime: data.LiftTime,
        };

        try {
            await this.dynamodb.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: item,
                })
            );

            return item;
        } catch (error) {
            throw new DynamoDBError("Failed to create static data", error);
        }
    }

    /**
     * Create dynamic ski lift data
     */
    async createDynamicData(data: CreateDynamicDataInput): Promise<SkiLiftDynamicData> {
        const item: SkiLiftDynamicData = {
            Lift: data.Lift,
            Metadata: data.Metadata,
            TotalUniqueLiftRiders: data.TotalUniqueLiftRiders,
            AverageSnowCoverageInches: data.AverageSnowCoverageInches,
            LiftStatus: data.LiftStatus,
            AvalancheDanger: data.AvalancheDanger,
        };

        try {
            await this.dynamodb.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: item,
                })
            );

            return item;
        } catch (error) {
            throw new DynamoDBError("Failed to create dynamic data", error);
        }
    }

    /**
     * Create resort data
     */
    async createResortData(data: CreateResortDataInput): Promise<SkiLiftRecord> {
        const item = {
            Lift: "Resort Data",
            Metadata: data.Metadata,
            TotalUniqueLiftRiders: data.TotalUniqueLiftRiders,
            AverageSnowCoverageInches: data.AverageSnowCoverageInches,
            AvalancheDanger: data.AvalancheDanger,
            OpenLifts: data.OpenLifts,
        };

        try {
            await this.dynamodb.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: item,
                })
            );

            return item;
        } catch (error) {
            throw new DynamoDBError("Failed to create resort data", error);
        }
    }

    /**
     * Get ski lift data by Lift and Metadata
     */
    async getSkiLift(lift: string, metadata: string): Promise<SkiLiftRecord> {
        try {
            const result = await this.dynamodb.send(
                new GetCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        Lift: lift,
                        Metadata: metadata,
                    },
                })
            );

            if (!result.Item) {
                throw new NotFoundError(`Ski lift data not found for ${lift} - ${metadata}`);
            }

            return result.Item as SkiLiftRecord;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DynamoDBError("Failed to get ski lift data", error);
        }
    }

    /**
     * Query all data for a specific lift
     */
    async queryLiftData(lift: string, limit = 20): Promise<PaginatedResponse<SkiLiftRecord>> {
        try {
            const result = await this.dynamodb.send(
                new QueryCommand({
                    TableName: TABLE_NAME,
                    KeyConditionExpression: "Lift = :lift",
                    ExpressionAttributeValues: {
                        ":lift": lift,
                    },
                    Limit: limit,
                })
            );

            return {
                items: (result.Items as SkiLiftRecord[]) || [],
                lastEvaluatedKey: result.LastEvaluatedKey as any,
                count: result.Count || 0,
            };
        } catch (error) {
            throw new DynamoDBError("Failed to query lift data", error);
        }
    }

    /**
     * Update static ski lift data
     */
    async updateStaticData(
        lift: string,
        data: UpdateStaticDataInput
    ): Promise<SkiLiftStaticData> {
        const updateExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};
        const expressionAttributeNames: Record<string, string> = {};

        if (data.ExperiencedRidersOnly !== undefined) {
            updateExpressions.push("#experiencedRidersOnly = :experiencedRidersOnly");
            expressionAttributeNames["#experiencedRidersOnly"] = "ExperiencedRidersOnly";
            expressionAttributeValues[":experiencedRidersOnly"] = data.ExperiencedRidersOnly;
        }

        if (data.VerticalFeet !== undefined) {
            updateExpressions.push("#verticalFeet = :verticalFeet");
            expressionAttributeNames["#verticalFeet"] = "VerticalFeet";
            expressionAttributeValues[":verticalFeet"] = data.VerticalFeet;
        }

        if (data.LiftTime !== undefined) {
            updateExpressions.push("#liftTime = :liftTime");
            expressionAttributeNames["#liftTime"] = "LiftTime";
            expressionAttributeValues[":liftTime"] = data.LiftTime;
        }

        if (updateExpressions.length === 0) {
            throw new DynamoDBError("No fields to update");
        }

        try {
            const result = await this.dynamodb.send(
                new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        Lift: lift,
                        Metadata: "Static Data",
                    },
                    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
                    ExpressionAttributeNames: expressionAttributeNames,
                    ExpressionAttributeValues: expressionAttributeValues,
                    ReturnValues: "ALL_NEW",
                })
            );

            return result.Attributes as SkiLiftStaticData;
        } catch (error) {
            throw new DynamoDBError("Failed to update static data", error);
        }
    }

    /**
     * Update dynamic ski lift data
     */
    async updateDynamicData(
        lift: string,
        metadata: string,
        data: UpdateDynamicDataInput
    ): Promise<SkiLiftDynamicData> {
        const updateExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};
        const expressionAttributeNames: Record<string, string> = {};

        if (data.TotalUniqueLiftRiders !== undefined) {
            updateExpressions.push("#totalUniqueLiftRiders = :totalUniqueLiftRiders");
            expressionAttributeNames["#totalUniqueLiftRiders"] = "TotalUniqueLiftRiders";
            expressionAttributeValues[":totalUniqueLiftRiders"] = data.TotalUniqueLiftRiders;
        }

        if (data.AverageSnowCoverageInches !== undefined) {
            updateExpressions.push("#averageSnowCoverageInches = :averageSnowCoverageInches");
            expressionAttributeNames["#averageSnowCoverageInches"] = "AverageSnowCoverageInches";
            expressionAttributeValues[":averageSnowCoverageInches"] = data.AverageSnowCoverageInches;
        }

        if (data.LiftStatus !== undefined) {
            updateExpressions.push("#liftStatus = :liftStatus");
            expressionAttributeNames["#liftStatus"] = "LiftStatus";
            expressionAttributeValues[":liftStatus"] = data.LiftStatus;
        }

        if (data.AvalancheDanger !== undefined) {
            updateExpressions.push("#avalancheDanger = :avalancheDanger");
            expressionAttributeNames["#avalancheDanger"] = "AvalancheDanger";
            expressionAttributeValues[":avalancheDanger"] = data.AvalancheDanger;
        }

        if (updateExpressions.length === 0) {
            throw new DynamoDBError("No fields to update");
        }

        try {
            const result = await this.dynamodb.send(
                new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        Lift: lift,
                        Metadata: metadata,
                    },
                    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
                    ExpressionAttributeNames: expressionAttributeNames,
                    ExpressionAttributeValues: expressionAttributeValues,
                    ReturnValues: "ALL_NEW",
                })
            );

            return result.Attributes as SkiLiftDynamicData;
        } catch (error) {
            throw new DynamoDBError("Failed to update dynamic data", error);
        }
    }

    /**
     * Delete ski lift data
     */
    async deleteSkiLift(lift: string, metadata: string): Promise<void> {
        try {
            await this.dynamodb.send(
                new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        Lift: lift,
                        Metadata: metadata,
                    },
                })
            );
        } catch (error) {
            throw new DynamoDBError("Failed to delete ski lift data", error);
        }
    }

    /**
     * List all ski lifts with pagination
     */
    async listSkiLifts(query: ListQueryInput): Promise<PaginatedResponse<SkiLiftRecord>> {
        try {
            const params: any = {
                TableName: TABLE_NAME,
                Limit: query.limit,
            };

            if (query.lastEvaluatedLift && query.lastEvaluatedMetadata) {
                params.ExclusiveStartKey = {
                    Lift: query.lastEvaluatedLift,
                    Metadata: query.lastEvaluatedMetadata,
                };
            }

            const result = await this.dynamodb.send(new ScanCommand(params));

            return {
                items: (result.Items as SkiLiftRecord[]) || [],
                lastEvaluatedKey: result.LastEvaluatedKey as any,
                count: result.Count || 0,
            };
        } catch (error) {
            throw new DynamoDBError("Failed to list ski lifts", error);
        }
    }

    /**
     * Query ski lift data by riders using GSI
     */
    async queryByRiders(
        lift: string,
        query: QueryByRidersInput
    ): Promise<PaginatedResponse<SkiLiftRecord>> {
        try {
            let keyConditionExpression = "Lift = :lift";
            const expressionAttributeValues: Record<string, any> = {
                ":lift": lift,
            };

            // Add range condition for riders if specified
            if (query.minRiders !== undefined && query.maxRiders !== undefined) {
                keyConditionExpression +=
                    " AND TotalUniqueLiftRiders BETWEEN :minRiders AND :maxRiders";
                expressionAttributeValues[":minRiders"] = query.minRiders;
                expressionAttributeValues[":maxRiders"] = query.maxRiders;
            } else if (query.minRiders !== undefined) {
                keyConditionExpression += " AND TotalUniqueLiftRiders >= :minRiders";
                expressionAttributeValues[":minRiders"] = query.minRiders;
            } else if (query.maxRiders !== undefined) {
                keyConditionExpression += " AND TotalUniqueLiftRiders <= :maxRiders";
                expressionAttributeValues[":maxRiders"] = query.maxRiders;
            }

            const result = await this.dynamodb.send(
                new QueryCommand({
                    TableName: TABLE_NAME,
                    IndexName: GSI_NAME,
                    KeyConditionExpression: keyConditionExpression,
                    ExpressionAttributeValues: expressionAttributeValues,
                    Limit: query.limit,
                    ScanIndexForward: false, // Sort descending by riders
                })
            );

            return {
                items: (result.Items as SkiLiftRecord[]) || [],
                lastEvaluatedKey: result.LastEvaluatedKey as any,
                count: result.Count || 0,
            };
        } catch (error) {
            throw new DynamoDBError("Failed to query by riders", error);
        }
    }
}
