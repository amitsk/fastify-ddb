import {
    DynamoDBDocumentClient,
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { build } from '../../../src/app.js';
import type { FastifyInstance } from 'fastify';
import {
    validDynamicData,
    validDynamicDataResponse,
    validResortData,
    validResortDataResponse,
    validStaticData,
    validStaticDataResponse,
    multipleLifts,
} from '../../helpers/mock-data.js';
import {
    createDeleteResponse,
    createDynamoDBError,
    createPutResponse,
    createQueryResponse,
    createSuccessResponse,
    createUpdateResponse,
} from '../../helpers/test-utils.js';

const mockDynamoDB = mockClient(DynamoDBDocumentClient);

describe('SkiLift Routes Integration Tests', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        mockDynamoDB.reset();
        app = await build();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('POST /api/skilifts/static', () => {
        it('should create static ski lift data', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/static',
                payload: validStaticData,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toEqual(validStaticDataResponse);
        });

        it('should return 400 for invalid data', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/static',
                payload: {
                    Lift: '',
                    ExperiencedRidersOnly: 'invalid',
                    VerticalFeet: -100,
                    LiftTime: 'invalid',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.error).toBeDefined();
        });

        it('should return 500 on database error', async () => {
            mockDynamoDB
                .on(PutCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/static',
                payload: validStaticData,
            });

            expect(response.statusCode).toBe(500);
        });
    });

    describe('POST /api/skilifts/dynamic', () => {
        it('should create dynamic ski lift data', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/dynamic',
                payload: validDynamicData,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toEqual(validDynamicDataResponse);
        });

        it('should return 400 for invalid LiftStatus', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/dynamic',
                payload: {
                    ...validDynamicData,
                    LiftStatus: 'INVALID',
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 for invalid AvalancheDanger', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/dynamic',
                payload: {
                    ...validDynamicData,
                    AvalancheDanger: 'INVALID',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('POST /api/skilifts/resort', () => {
        it('should create resort data', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/resort',
                payload: validResortData,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body).toEqual(validResortDataResponse);
        });

        it('should return 400 for invalid OpenLifts', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/resort',
                payload: {
                    ...validResortData,
                    OpenLifts: 'invalid',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /api/skilifts/:lift/:metadata', () => {
        it('should get specific ski lift data', async () => {
            mockDynamoDB
                .on(GetCommand)
                .resolves(createSuccessResponse(validStaticDataResponse));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/Summit%20Express/Static%20Data',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toEqual(validStaticDataResponse);
        });

        it('should return 404 when ski lift not found', async () => {
            mockDynamoDB.on(GetCommand).resolves({ Item: undefined });

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/NonExistent/Static%20Data',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.body);
            expect(body.error).toBeDefined();
        });
    });

    describe('GET /api/skilifts/:lift', () => {
        it('should query all data for a specific lift', async () => {
            const liftData = multipleLifts.filter((l) => l.Lift === 'Summit Express');
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(liftData));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/Summit%20Express',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.items).toHaveLength(2);
            expect(body.count).toBe(2);
        });

        it('should respect limit query parameter', async () => {
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse([]));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/Summit%20Express?limit=5',
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('GET /api/skilifts', () => {
        it('should list all ski lifts', async () => {
            mockDynamoDB.on(ScanCommand).resolves(createQueryResponse(multipleLifts));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.items).toHaveLength(multipleLifts.length);
        });

        it('should support pagination parameters', async () => {
            mockDynamoDB.on(ScanCommand).resolves(createQueryResponse(multipleLifts));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts?limit=10&lastEvaluatedLift=Test&lastEvaluatedMetadata=Data',
            });

            expect(response.statusCode).toBe(200);
        });

        it('should return 400 for invalid limit', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts?limit=0',
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /api/skilifts/:lift/by-riders', () => {
        it('should query by minimum riders', async () => {
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(multipleLifts));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/Summit%20Express/by-riders?minRiders=1000',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.items).toBeDefined();
        });

        it('should query by riders range', async () => {
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(multipleLifts));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/Summit%20Express/by-riders?minRiders=100&maxRiders=500',
            });

            expect(response.statusCode).toBe(200);
        });

        it('should return 400 for negative riders', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/Summit%20Express/by-riders?minRiders=-10',
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('PUT /api/skilifts/:lift/static', () => {
        it('should update static ski lift data', async () => {
            const updatedData = {
                ...validStaticDataResponse,
                VerticalFeet: 3000,
            };
            mockDynamoDB.on(UpdateCommand).resolves(createUpdateResponse(updatedData));

            const response = await app.inject({
                method: 'PUT',
                url: '/api/skilifts/Summit%20Express/static',
                payload: {
                    VerticalFeet: 3000,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.VerticalFeet).toBe(3000);
        });

        it('should return 400 for invalid data', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/skilifts/Summit%20Express/static',
                payload: {
                    VerticalFeet: -100,
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('PUT /api/skilifts/:lift/:metadata', () => {
        it('should update dynamic ski lift data', async () => {
            const updatedData = {
                ...validDynamicDataResponse,
                LiftStatus: 'Closed',
            };
            mockDynamoDB.on(UpdateCommand).resolves(createUpdateResponse(updatedData));

            const response = await app.inject({
                method: 'PUT',
                url: '/api/skilifts/Summit%20Express/01%2F15%2F24',
                payload: {
                    LiftStatus: 'Closed',
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.LiftStatus).toBe('Closed');
        });

        it('should return 400 for invalid LiftStatus', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/skilifts/Summit%20Express/01%2F15%2F24',
                payload: {
                    LiftStatus: 'INVALID',
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 500 on database error', async () => {
            mockDynamoDB
                .on(UpdateCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            const response = await app.inject({
                method: 'PUT',
                url: '/api/skilifts/Summit%20Express/01%2F15%2F24',
                payload: {
                    LiftStatus: 'Closed',
                },
            });

            expect(response.statusCode).toBe(500);
        });
    });

    describe('DELETE /api/skilifts/:lift/:metadata', () => {
        it('should delete ski lift data', async () => {
            mockDynamoDB.on(DeleteCommand).resolves(createDeleteResponse());

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/skilifts/Summit%20Express/Static%20Data',
            });

            expect(response.statusCode).toBe(204);
            expect(response.body).toBe('');
        });

        it('should return 500 on database error', async () => {
            mockDynamoDB
                .on(DeleteCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/skilifts/Summit%20Express/Static%20Data',
            });

            expect(response.statusCode).toBe(500);
        });
    });

    describe('Middleware Integration', () => {
        it('should have CORS headers', async () => {
            mockDynamoDB.on(ScanCommand).resolves(createQueryResponse([]));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts',
            });

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });

        it('should have security headers from Helmet', async () => {
            mockDynamoDB.on(ScanCommand).resolves(createQueryResponse([]));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts',
            });

            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });

        it('should handle compression', async () => {
            mockDynamoDB.on(ScanCommand).resolves(createQueryResponse(multipleLifts));

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts',
                headers: {
                    'accept-encoding': 'gzip',
                },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/unknown',
            });

            expect(response.statusCode).toBe(404);
        });

        it('should handle malformed JSON', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/skilifts/static',
                payload: 'invalid json',
                headers: {
                    'content-type': 'application/json',
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return proper error format', async () => {
            mockDynamoDB.on(GetCommand).resolves({ Item: undefined });

            const response = await app.inject({
                method: 'GET',
                url: '/api/skilifts/NonExistent/Static%20Data',
            });

            const body = JSON.parse(response.body);
            expect(body.error).toBeDefined();
            expect(body.error.message).toBeDefined();
            expect(body.error.statusCode).toBe(404);
        });
    });
});
