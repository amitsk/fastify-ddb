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
    fastify.post("/api/skilifts/static", async (request: FastifyRequest, reply: FastifyReply) => {
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
    });

    /**
     * POST /api/skilifts/dynamic
     * Create dynamic ski lift data
     */
    fastify.post("/api/skilifts/dynamic", async (request: FastifyRequest, reply: FastifyReply) => {
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
    });

    /**
     * POST /api/skilifts/resort
     * Create resort data
     */
    fastify.post("/api/skilifts/resort", async (request: FastifyRequest, reply: FastifyReply) => {
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
    });

    /**
     * GET /api/skilifts/:lift/:metadata
     * Get specific ski lift data
     */
    fastify.get<{
        Params: { lift: string; metadata: string };
    }>("/api/skilifts/:lift/:metadata", async (request, reply) => {
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
    });

    /**
     * GET /api/skilifts/:lift
     * Query all data for a specific lift
     */
    fastify.get<{
        Params: { lift: string };
        Querystring: { limit?: number };
    }>("/api/skilifts/:lift", async (request, reply) => {
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
    });

    /**
     * GET /api/skilifts
     * List all ski lifts with pagination
     */
    fastify.get<{
        Querystring: { limit?: number; lastEvaluatedLift?: string; lastEvaluatedMetadata?: string };
    }>("/api/skilifts", async (request, reply) => {
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
    });

    /**
     * GET /api/skilifts/:lift/by-riders
     * Query ski lift data sorted by riders using GSI
     */
    fastify.get<{
        Params: { lift: string };
        Querystring: { minRiders?: number; maxRiders?: number; limit?: number };
    }>("/api/skilifts/:lift/by-riders", async (request, reply) => {
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
    });

    /**
     * PUT /api/skilifts/:lift/static
     * Update static ski lift data
     */
    fastify.put<{
        Params: { lift: string };
    }>("/api/skilifts/:lift/static", async (request, reply) => {
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
    });

    /**
     * PUT /api/skilifts/:lift/:metadata
     * Update dynamic ski lift data
     */
    fastify.put<{
        Params: { lift: string; metadata: string };
    }>("/api/skilifts/:lift/:metadata", async (request, reply) => {
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
    });

    /**
     * DELETE /api/skilifts/:lift/:metadata
     * Delete ski lift data
     */
    fastify.delete<{
        Params: { lift: string; metadata: string };
    }>("/api/skilifts/:lift/:metadata", async (request, reply) => {
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
    });
}
