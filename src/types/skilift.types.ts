/**
 * Type definitions for SkiLifts DynamoDB table
 */

/**
 * Base attributes for all ski lift records
 */
export interface SkiLiftBase {
    Lift: string; // Partition Key: e.g., "Lift 3", "Resort Data"
    Metadata: string; // Sort Key: e.g., "Static Data", "01/01/20"
}

/**
 * Static data for a ski lift (permanent characteristics)
 */
export interface SkiLiftStaticData extends SkiLiftBase {
    Metadata: "Static Data";
    ExperiencedRidersOnly: boolean;
    VerticalFeet: number;
    LiftTime: string; // Format: "HH:MM"
}

/**
 * Dynamic data for a ski lift (daily operational data)
 */
export interface SkiLiftDynamicData extends SkiLiftBase {
    Metadata: string; // Date in format "MM/DD/YY"
    TotalUniqueLiftRiders: number;
    AverageSnowCoverageInches: number;
    LiftStatus: "Open" | "Closed" | "Pending";
    AvalancheDanger: "Low" | "Moderate" | "Considerable" | "High" | "Extreme";
}

/**
 * Resort-level data (aggregated data for all lifts)
 */
export interface ResortData extends SkiLiftBase {
    Lift: "Resort Data";
    Metadata: string; // Date in format "MM/DD/YY"
    TotalUniqueLiftRiders: number;
    AverageSnowCoverageInches: number;
    AvalancheDanger: "Low" | "Moderate" | "Considerable" | "High" | "Extreme";
    OpenLifts: number[]; // Array of lift numbers that are open
}

/**
 * Union type for all possible ski lift records
 */
export type SkiLiftRecord = SkiLiftStaticData | SkiLiftDynamicData | ResortData;

/**
 * DynamoDB attribute value types
 */
export interface DynamoDBAttributeValue {
    S?: string;
    N?: string;
    BOOL?: boolean;
    NS?: string[];
}

/**
 * DynamoDB item representation
 */
export type DynamoDBItem = Record<string, DynamoDBAttributeValue>;

/**
 * Query parameters for listing ski lifts
 */
export interface ListSkiLiftsParams {
    limit?: number;
    lastEvaluatedKey?: {
        Lift: string;
        Metadata: string;
    };
}

/**
 * Query parameters for querying by riders (using GSI)
 */
export interface QueryByRidersParams {
    lift: string;
    minRiders?: number;
    maxRiders?: number;
    limit?: number;
}

/**
 * Response for paginated queries
 */
export interface PaginatedResponse<T> {
    items: T[];
    lastEvaluatedKey?: {
        Lift: string;
        Metadata: string;
    };
    count: number;
}
