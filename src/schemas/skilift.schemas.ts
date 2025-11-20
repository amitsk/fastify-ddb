import { z } from "zod";

/**
 * Validation schemas for SkiLifts API
 */

// Enums
export const LiftStatusEnum = z.enum(["Open", "Closed", "Pending"]);
export const AvalancheDangerEnum = z.enum(["Low", "Moderate", "Considerable", "High", "Extreme"]);

/**
 * Schema for creating static ski lift data
 */
export const createStaticDataSchema = z.object({
    Lift: z.string().min(1, "Lift name is required"),
    ExperiencedRidersOnly: z.boolean(),
    VerticalFeet: z.number().positive("Vertical feet must be positive"),
    LiftTime: z.string().regex(/^\d{1,2}:\d{2}$/, "LiftTime must be in format HH:MM"),
});

export type CreateStaticDataInput = z.infer<typeof createStaticDataSchema>;

/**
 * Schema for creating dynamic ski lift data
 */
export const createDynamicDataSchema = z.object({
    Lift: z.string().min(1, "Lift name is required"),
    Metadata: z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/, "Metadata must be in format MM/DD/YY"),
    TotalUniqueLiftRiders: z.number().nonnegative("Total riders must be non-negative"),
    AverageSnowCoverageInches: z.number().nonnegative("Snow coverage must be non-negative"),
    LiftStatus: LiftStatusEnum,
    AvalancheDanger: AvalancheDangerEnum,
});

export type CreateDynamicDataInput = z.infer<typeof createDynamicDataSchema>;

/**
 * Schema for creating resort data
 */
export const createResortDataSchema = z.object({
    Metadata: z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/, "Metadata must be in format MM/DD/YY"),
    TotalUniqueLiftRiders: z.number().nonnegative("Total riders must be non-negative"),
    AverageSnowCoverageInches: z.number().nonnegative("Snow coverage must be non-negative"),
    AvalancheDanger: AvalancheDangerEnum,
    OpenLifts: z.array(z.number()).min(0, "OpenLifts must be an array of numbers"),
});

export type CreateResortDataInput = z.infer<typeof createResortDataSchema>;

/**
 * Schema for updating static ski lift data
 */
export const updateStaticDataSchema = z.object({
    ExperiencedRidersOnly: z.boolean().optional(),
    VerticalFeet: z.number().positive("Vertical feet must be positive").optional(),
    LiftTime: z.string().regex(/^\d{1,2}:\d{2}$/, "LiftTime must be in format HH:MM").optional(),
});

export type UpdateStaticDataInput = z.infer<typeof updateStaticDataSchema>;

/**
 * Schema for updating dynamic ski lift data
 */
export const updateDynamicDataSchema = z.object({
    TotalUniqueLiftRiders: z.number().nonnegative("Total riders must be non-negative").optional(),
    AverageSnowCoverageInches: z
        .number()
        .nonnegative("Snow coverage must be non-negative")
        .optional(),
    LiftStatus: LiftStatusEnum.optional(),
    AvalancheDanger: AvalancheDangerEnum.optional(),
});

export type UpdateDynamicDataInput = z.infer<typeof updateDynamicDataSchema>;

/**
 * Schema for path parameters
 */
export const liftParamsSchema = z.object({
    lift: z.string().min(1, "Lift name is required"),
});

export const liftMetadataParamsSchema = z.object({
    lift: z.string().min(1, "Lift name is required"),
    metadata: z.string().min(1, "Metadata is required"),
});

/**
 * Schema for query parameters
 */
export const listQuerySchema = z.object({
    limit: z.coerce.number().positive().max(100).optional().default(20),
    lastEvaluatedLift: z.string().optional(),
    lastEvaluatedMetadata: z.string().optional(),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const queryByRidersSchema = z.object({
    minRiders: z.coerce.number().nonnegative().optional(),
    maxRiders: z.coerce.number().nonnegative().optional(),
    limit: z.coerce.number().positive().max(100).optional().default(20),
});

export type QueryByRidersInput = z.infer<typeof queryByRidersSchema>;
