import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
    createDynamicDataSchema,
    createResortDataSchema,
    createStaticDataSchema,
    liftMetadataParamsSchema,
    liftParamsSchema,
    listQuerySchema,
    queryByRidersSchema,
    updateDynamicDataSchema,
    updateStaticDataSchema,
} from "../schemas/skilift.schemas.js";
import { SkiLiftService } from "../services/skilift.service.js";
import { AppError, formatErrorResponse } from "../utils/error-handler.js";

/**
 * Register SkiLift routes
 */
export async function skiLiftRoutes(fastify: FastifyInstance) {
    const service = new SkiLiftService(fastify.dynamodb);

    /**
     * POST /api/skilifts/static
     * Create static ski lift data
     */
    fastify.post(
        "/api/skilifts/static",
        {
            schema: {
                description: "Create static ski lift data",
                tags: ["skilifts"],
                body: createStaticDataSchema,
                response: {
                    201: {
                        description: "Static data created successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const data = createStaticDataSchema.parse(request.body);
                const result = await service.createStaticData(data);
                return reply.code(201).send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * POST /api/skilifts/dynamic
     * Create dynamic ski lift data
     */
    fastify.post(
        "/api/skilifts/dynamic",
        {
            schema: {
                description: "Create dynamic ski lift data",
                tags: ["skilifts"],
                body: createDynamicDataSchema,
                response: {
                    201: {
                        description: "Dynamic data created successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const data = createDynamicDataSchema.parse(request.body);
                const result = await service.createDynamicData(data);
                return reply.code(201).send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * POST /api/skilifts/resort
     * Create resort data
     */
    fastify.post(
        "/api/skilifts/resort",
        {
            schema: {
                description: "Create resort-level data",
                tags: ["skilifts"],
                body: createResortDataSchema,
                response: {
                    201: {
                        description: "Resort data created successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const data = createResortDataSchema.parse(request.body);
                const result = await service.createResortData(data);
                return reply.code(201).send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * GET /api/skilifts/:lift/:metadata
     * Get specific ski lift data
     */
    fastify.get<{
        Params: { lift: string; metadata: string };
    }>(
        "/api/skilifts/:lift/:metadata",
        {
            schema: {
                description: "Get specific ski lift data by lift name and metadata",
                tags: ["skilifts"],
                params: liftMetadataParamsSchema,
                response: {
                    200: {
                        description: "Ski lift data retrieved successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { lift, metadata } = liftMetadataParamsSchema.parse(request.params);
                const result = await service.getSkiLift(lift, metadata);
                return reply.send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * GET /api/skilifts/:lift
     * Query all data for a specific lift
     */
    fastify.get<{
        Params: { lift: string };
        Querystring: { limit?: number };
    }>(
        "/api/skilifts/:lift",
        {
            schema: {
                description: "Get all data for a specific ski lift",
                tags: ["skilifts"],
                params: liftParamsSchema,
                querystring: {
                    type: "object",
                    properties: {
                        limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
                    },
                },
                response: {
                    200: {
                        description: "Ski lift data retrieved successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { lift } = liftParamsSchema.parse(request.params);
                const limit = request.query.limit || 20;
                const result = await service.queryLiftData(lift, limit);
                return reply.send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * GET /api/skilifts
     * List all ski lifts with pagination
     */
    fastify.get<{
        Querystring: { limit?: number; lastEvaluatedLift?: string; lastEvaluatedMetadata?: string };
    }>(
        "/api/skilifts",
        {
            schema: {
                description: "List all ski lifts with pagination",
                tags: ["skilifts"],
                querystring: listQuerySchema,
                response: {
                    200: {
                        description: "Ski lifts retrieved successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const query = listQuerySchema.parse(request.query);
                const result = await service.listSkiLifts(query);
                return reply.send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * GET /api/skilifts/:lift/by-riders
     * Query ski lift data sorted by riders using GSI
     */
    fastify.get<{
        Params: { lift: string };
        Querystring: { minRiders?: number; maxRiders?: number; limit?: number };
    }>(
        "/api/skilifts/:lift/by-riders",
        {
            schema: {
                description: "Query ski lift data sorted by total unique riders",
                tags: ["skilifts"],
                params: liftParamsSchema,
                querystring: queryByRidersSchema,
                response: {
                    200: {
                        description: "Ski lift data retrieved successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { lift } = liftParamsSchema.parse(request.params);
                const query = queryByRidersSchema.parse(request.query);
                const result = await service.queryByRiders(lift, query);
                return reply.send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * PUT /api/skilifts/:lift/static
     * Update static ski lift data
     */
    fastify.put<{
        Params: { lift: string };
    }>(
        "/api/skilifts/:lift/static",
        {
            schema: {
                description: "Update static ski lift data",
                tags: ["skilifts"],
                params: liftParamsSchema,
                body: updateStaticDataSchema,
                response: {
                    200: {
                        description: "Static data updated successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { lift } = liftParamsSchema.parse(request.params);
                const data = updateStaticDataSchema.parse(request.body);
                const result = await service.updateStaticData(lift, data);
                return reply.send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * PUT /api/skilifts/:lift/:metadata
     * Update dynamic ski lift data
     */
    fastify.put<{
        Params: { lift: string; metadata: string };
    }>(
        "/api/skilifts/:lift/:metadata",
        {
            schema: {
                description: "Update dynamic ski lift data",
                tags: ["skilifts"],
                params: liftMetadataParamsSchema,
                body: updateDynamicDataSchema,
                response: {
                    200: {
                        description: "Dynamic data updated successfully",
                        type: "object",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { lift, metadata } = liftMetadataParamsSchema.parse(request.params);
                const data = updateDynamicDataSchema.parse(request.body);
                const result = await service.updateDynamicData(lift, metadata, data);
                return reply.send(result);
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );

    /**
     * DELETE /api/skilifts/:lift/:metadata
     * Delete ski lift data
     */
    fastify.delete<{
        Params: { lift: string; metadata: string };
    }>(
        "/api/skilifts/:lift/:metadata",
        {
            schema: {
                description: "Delete ski lift data",
                tags: ["skilifts"],
                params: liftMetadataParamsSchema,
                response: {
                    204: {
                        description: "Ski lift data deleted successfully",
                        type: "null",
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { lift, metadata } = liftMetadataParamsSchema.parse(request.params);
                await service.deleteSkiLift(lift, metadata);
                return reply.code(204).send();
            } catch (error) {
                const errorResponse = formatErrorResponse(error as Error);
                const statusCode =
                    error instanceof AppError ? error.statusCode : errorResponse.error.statusCode;
                return reply.code(statusCode).send(errorResponse);
            }
        }
    );
}
