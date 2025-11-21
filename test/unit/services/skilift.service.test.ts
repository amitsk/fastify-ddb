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
import { beforeEach, describe, expect, it } from 'vitest';
import { SkiLiftService } from '../../../src/services/skilift.service.js';
import { DynamoDBError, NotFoundError } from '../../../src/utils/error-handler.js';
import {
    closedLiftDynamicData,
    experiencedOnlyStaticData,
    highTrafficDynamicData,
    lowTrafficResortData,
    multipleLifts,
    validDynamicData,
    validDynamicDataResponse,
    validResortData,
    validResortDataResponse,
    validStaticData,
    validStaticDataResponse,
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

describe('SkiLiftService', () => {
    let service: SkiLiftService;

    beforeEach(() => {
        mockDynamoDB.reset();
        service = new SkiLiftService(mockDynamoDB as any);
    });

    describe('createStaticData', () => {
        it('should create static ski lift data successfully', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createStaticData(validStaticData);

            expect(result).toEqual(validStaticDataResponse);
            expect(mockDynamoDB.calls()).toHaveLength(1);
            const call = mockDynamoDB.call(0);
            expect(call.args[0].input).toMatchObject({
                TableName: 'SkiLifts',
                Item: validStaticDataResponse,
            });
        });

        it('should create static data for experienced riders only lift', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createStaticData(experiencedOnlyStaticData);

            expect(result.ExperiencedRidersOnly).toBe(true);
            expect(result.Metadata).toBe('Static Data');
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(PutCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            await expect(service.createStaticData(validStaticData)).rejects.toThrow(
                DynamoDBError
            );
        });
    });

    describe('createDynamicData', () => {
        it('should create dynamic ski lift data successfully', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createDynamicData(validDynamicData);

            expect(result).toEqual(validDynamicDataResponse);
            expect(mockDynamoDB.calls()).toHaveLength(1);
        });

        it('should create dynamic data for closed lift', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createDynamicData(closedLiftDynamicData);

            expect(result.LiftStatus).toBe('Closed');
            expect(result.AvalancheDanger).toBe('High');
            expect(result.TotalUniqueLiftRiders).toBe(0);
        });

        it('should create dynamic data with high traffic', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createDynamicData(highTrafficDynamicData);

            expect(result.TotalUniqueLiftRiders).toBe(5000);
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(PutCommand)
                .rejects(createDynamoDBError('ValidationException', 'Invalid data'));

            await expect(service.createDynamicData(validDynamicData)).rejects.toThrow(
                DynamoDBError
            );
        });
    });

    describe('createResortData', () => {
        it('should create resort data successfully', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createResortData(validResortData);

            expect(result).toEqual(validResortDataResponse);
            expect(result.Lift).toBe('Resort Data');
        });

        it('should create resort data with low traffic', async () => {
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            const result = await service.createResortData(lowTrafficResortData);

            expect(result.OpenLifts).toEqual([1, 2, 3]);
            expect(result.AvalancheDanger).toBe('High');
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(PutCommand)
                .rejects(createDynamoDBError('ServiceUnavailable', 'Service down'));

            await expect(service.createResortData(validResortData)).rejects.toThrow(
                DynamoDBError
            );
        });
    });

    describe('getSkiLift', () => {
        it('should get ski lift data successfully', async () => {
            mockDynamoDB
                .on(GetCommand)
                .resolves(createSuccessResponse(validStaticDataResponse));

            const result = await service.getSkiLift('Summit Express', 'Static Data');

            expect(result).toEqual(validStaticDataResponse);
            expect(mockDynamoDB.calls()).toHaveLength(1);
            const call = mockDynamoDB.call(0);
            expect(call.args[0].input).toMatchObject({
                TableName: 'SkiLifts',
                Key: {
                    Lift: 'Summit Express',
                    Metadata: 'Static Data',
                },
            });
        });

        it('should throw NotFoundError when item does not exist', async () => {
            mockDynamoDB.on(GetCommand).resolves({ Item: undefined });

            await expect(
                service.getSkiLift('NonExistent', 'Static Data')
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw DynamoDBError on database error', async () => {
            mockDynamoDB
                .on(GetCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            await expect(
                service.getSkiLift('Summit Express', 'Static Data')
            ).rejects.toThrow(DynamoDBError);
        });
    });

    describe('queryLiftData', () => {
        it('should query all data for a specific lift', async () => {
            const liftData = multipleLifts.filter((l) => l.Lift === 'Summit Express');
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(liftData));

            const result = await service.queryLiftData('Summit Express');

            expect(result.items).toHaveLength(2);
            expect(result.count).toBe(2);
            expect(mockDynamoDB.calls()).toHaveLength(1);
        });

        it('should respect limit parameter', async () => {
            const liftData = multipleLifts.slice(0, 5);
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(liftData));

            const result = await service.queryLiftData('Summit Express', 5);

            const call = mockDynamoDB.call(0);
            expect((call.args[0].input as any).Limit).toBe(5);
        });

        it('should return pagination token', async () => {
            const lastKey = { Lift: 'Summit Express', Metadata: '2024-01-15' };
            mockDynamoDB
                .on(QueryCommand)
                .resolves(createQueryResponse(multipleLifts, lastKey));

            const result = await service.queryLiftData('Summit Express');

            expect(result.lastEvaluatedKey).toEqual(lastKey);
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(QueryCommand)
                .rejects(createDynamoDBError('ProvisionedThroughputExceededException', 'Throttled'));

            await expect(service.queryLiftData('Summit Express')).rejects.toThrow(
                DynamoDBError
            );
        });
    });

    describe('updateStaticData', () => {
        it('should update static data successfully', async () => {
            const updatedData = {
                ...validStaticDataResponse,
                VerticalFeet: 3000,
            };
            mockDynamoDB.on(UpdateCommand).resolves(createUpdateResponse(updatedData));

            const result = await service.updateStaticData('Summit Express', {
                VerticalFeet: 3000,
            });

            expect(result.VerticalFeet).toBe(3000);
            expect(mockDynamoDB.calls()).toHaveLength(1);
        });

        it('should update multiple fields', async () => {
            const updatedData = {
                ...validStaticDataResponse,
                VerticalFeet: 3000,
                LiftTime: '12:00',
                ExperiencedRidersOnly: true,
            };
            mockDynamoDB.on(UpdateCommand).resolves(createUpdateResponse(updatedData));

            const result = await service.updateStaticData('Summit Express', {
                VerticalFeet: 3000,
                LiftTime: '12:00',
                ExperiencedRidersOnly: true,
            });

            expect(result.VerticalFeet).toBe(3000);
            expect(result.LiftTime).toBe('12:00');
            expect(result.ExperiencedRidersOnly).toBe(true);
        });

        it('should throw error when no fields to update', async () => {
            await expect(service.updateStaticData('Summit Express', {})).rejects.toThrow(
                DynamoDBError
            );
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(UpdateCommand)
                .rejects(createDynamoDBError('ConditionalCheckFailedException', 'Condition failed'));

            await expect(
                service.updateStaticData('Summit Express', { VerticalFeet: 3000 })
            ).rejects.toThrow(DynamoDBError);
        });
    });

    describe('updateDynamicData', () => {
        it('should update dynamic data successfully', async () => {
            const updatedData = {
                ...validDynamicDataResponse,
                LiftStatus: 'Closed',
            };
            mockDynamoDB.on(UpdateCommand).resolves(createUpdateResponse(updatedData));

            const result = await service.updateDynamicData(
                'Summit Express',
                '01/15/24',
                {
                    LiftStatus: 'Closed',
                }
            );

            expect(result.LiftStatus).toBe('Closed');
        });

        it('should update multiple fields', async () => {
            const updatedData = {
                ...validDynamicDataResponse,
                LiftStatus: 'Closed',
                AvalancheDanger: 'High',
                TotalUniqueLiftRiders: 0,
            };
            mockDynamoDB.on(UpdateCommand).resolves(createUpdateResponse(updatedData));

            const result = await service.updateDynamicData(
                'Summit Express',
                '01/15/24',
                {
                    LiftStatus: 'Closed',
                    AvalancheDanger: 'High',
                    TotalUniqueLiftRiders: 0,
                }
            );

            expect(result.LiftStatus).toBe('Closed');
            expect(result.AvalancheDanger).toBe('High');
            expect(result.TotalUniqueLiftRiders).toBe(0);
        });

        it('should throw error when no fields to update', async () => {
            await expect(
                service.updateDynamicData('Summit Express', '01/15/24', {})
            ).rejects.toThrow(DynamoDBError);
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(UpdateCommand)
                .rejects(createDynamoDBError('ResourceNotFoundException', 'Item not found'));

            await expect(
                service.updateDynamicData('Summit Express', '01/15/24', {
                    LiftStatus: 'Closed',
                })
            ).rejects.toThrow(DynamoDBError);
        });
    });

    describe('deleteSkiLift', () => {
        it('should delete ski lift data successfully', async () => {
            mockDynamoDB.on(DeleteCommand).resolves(createDeleteResponse());

            await service.deleteSkiLift('Summit Express', 'Static Data');

            expect(mockDynamoDB.calls()).toHaveLength(1);
            const call = mockDynamoDB.call(0);
            expect(call.args[0].input).toMatchObject({
                TableName: 'SkiLifts',
                Key: {
                    Lift: 'Summit Express',
                    Metadata: 'Static Data',
                },
            });
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(DeleteCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            await expect(
                service.deleteSkiLift('Summit Express', 'Static Data')
            ).rejects.toThrow(DynamoDBError);
        });
    });

    describe('listSkiLifts', () => {
        it('should list all ski lifts', async () => {
            mockDynamoDB.on(ScanCommand).resolves(createQueryResponse(multipleLifts));

            const result = await service.listSkiLifts({ limit: 20 });

            expect(result.items).toHaveLength(multipleLifts.length);
            expect(result.count).toBe(multipleLifts.length);
        });

        it('should support pagination', async () => {
            const lastKey = { Lift: 'Summit Express', Metadata: 'Static Data' };
            mockDynamoDB
                .on(ScanCommand)
                .resolves(createQueryResponse(multipleLifts, lastKey));

            const result = await service.listSkiLifts({
                limit: 10,
                lastEvaluatedLift: 'Previous Lift',
                lastEvaluatedMetadata: 'Previous Metadata',
            });

            expect(result.lastEvaluatedKey).toEqual(lastKey);
            const call = mockDynamoDB.call(0);
            expect((call.args[0].input as any).ExclusiveStartKey).toEqual({
                Lift: 'Previous Lift',
                Metadata: 'Previous Metadata',
            });
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(ScanCommand)
                .rejects(createDynamoDBError('InternalServerError', 'Database error'));

            await expect(service.listSkiLifts({ limit: 20 })).rejects.toThrow(
                DynamoDBError
            );
        });
    });

    describe('queryByRiders', () => {
        it('should query by minimum riders', async () => {
            const highTrafficLifts = multipleLifts.filter(
                (l) => (l as any).TotalUniqueLiftRiders >= 1000
            );
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(highTrafficLifts));

            const result = await service.queryByRiders('Summit Express', {
                minRiders: 1000,
                limit: 20,
            });

            expect(result.items.length).toBeGreaterThan(0);
            const call = mockDynamoDB.call(0);
            expect((call.args[0].input as any).IndexName).toBe('SkiLiftsByRiders');
        });

        it('should query by maximum riders', async () => {
            const lowTrafficLifts = multipleLifts.filter(
                (l) => (l as any).TotalUniqueLiftRiders <= 500
            );
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(lowTrafficLifts));

            const result = await service.queryByRiders('Black Diamond Lift', {
                maxRiders: 500,
                limit: 20,
            });

            expect(result.items.length).toBeGreaterThan(0);
        });

        it('should query by riders range', async () => {
            const rangeLifts = multipleLifts.filter((l) => {
                const riders = (l as any).TotalUniqueLiftRiders;
                return riders >= 400 && riders <= 1500;
            });
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(rangeLifts));

            const result = await service.queryByRiders('Summit Express', {
                minRiders: 400,
                maxRiders: 1500,
                limit: 20,
            });

            expect(result.items.length).toBeGreaterThan(0);
        });

        it('should sort descending by riders', async () => {
            mockDynamoDB.on(QueryCommand).resolves(createQueryResponse(multipleLifts));

            await service.queryByRiders('Summit Express', {
                minRiders: 0,
                limit: 20,
            });

            const call = mockDynamoDB.call(0);
            expect((call.args[0].input as any).ScanIndexForward).toBe(false);
        });

        it('should throw DynamoDBError on failure', async () => {
            mockDynamoDB
                .on(QueryCommand)
                .rejects(createDynamoDBError('ValidationException', 'Invalid query'));

            await expect(
                service.queryByRiders('Summit Express', { minRiders: 1000, limit: 20 })
            ).rejects.toThrow(DynamoDBError);
        });
    });
});
