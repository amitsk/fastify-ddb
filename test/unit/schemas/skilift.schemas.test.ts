import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
    createDynamicDataSchema,
    createResortDataSchema,
    createStaticDataSchema,
    listQuerySchema,
    queryByRidersSchema,
    updateDynamicDataSchema,
    updateStaticDataSchema,
} from '../../../src/schemas/skilift.schemas.js';
import {
    invalidDynamicData,
    invalidResortData,
    invalidStaticData,
    validDynamicData,
    validResortData,
    validStaticData,
} from '../../helpers/mock-data.js';

describe('SkiLift Schemas', () => {
    describe('createStaticDataSchema', () => {
        it('should validate valid static data', () => {
            const result = createStaticDataSchema.safeParse(validStaticData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validStaticData);
            }
        });

        it('should reject empty lift name', () => {
            const result = createStaticDataSchema.safeParse({
                ...validStaticData,
                Lift: '',
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid ExperiencedRidersOnly type', () => {
            const result = createStaticDataSchema.safeParse({
                ...validStaticData,
                ExperiencedRidersOnly: 'yes',
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative VerticalFeet', () => {
            const result = createStaticDataSchema.safeParse({
                ...validStaticData,
                VerticalFeet: -100,
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative LiftTime', () => {
            const result = createStaticDataSchema.safeParse({
                ...validStaticData,
                LiftTime: -5,
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing required fields', () => {
            const result = createStaticDataSchema.safeParse({
                Lift: 'Test Lift',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateStaticDataSchema', () => {
        it('should validate partial updates', () => {
            const result = updateStaticDataSchema.safeParse({
                VerticalFeet: 3000,
            });
            expect(result.success).toBe(true);
        });

        it('should validate multiple field updates', () => {
            const result = updateStaticDataSchema.safeParse({
                VerticalFeet: 3000,
                LiftTime: '12:00',
                ExperiencedRidersOnly: true,
            });
            expect(result.success).toBe(true);
        });

        it('should allow empty object', () => {
            const result = updateStaticDataSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should reject negative values', () => {
            const result = updateStaticDataSchema.safeParse({
                VerticalFeet: -100,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('createDynamicDataSchema', () => {
        it('should validate valid dynamic data', () => {
            const result = createDynamicDataSchema.safeParse(validDynamicData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validDynamicData);
            }
        });

        it('should reject empty lift name', () => {
            const result = createDynamicDataSchema.safeParse({
                ...validDynamicData,
                Lift: '',
            });
            expect(result.success).toBe(false);
        });

        it('should reject empty metadata', () => {
            const result = createDynamicDataSchema.safeParse({
                ...validDynamicData,
                Metadata: '',
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative riders', () => {
            const result = createDynamicDataSchema.safeParse({
                ...validDynamicData,
                TotalUniqueLiftRiders: -50,
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative snow coverage', () => {
            const result = createDynamicDataSchema.safeParse({
                ...validDynamicData,
                AverageSnowCoverageInches: -10,
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid LiftStatus', () => {
            const result = createDynamicDataSchema.safeParse({
                ...validDynamicData,
                LiftStatus: 'MAYBE',
            });
            expect(result.success).toBe(false);
        });

        it('should accept valid LiftStatus values', () => {
            const statuses = ['Open', 'Closed', 'Pending'];
            for (const status of statuses) {
                const result = createDynamicDataSchema.safeParse({
                    ...validDynamicData,
                    LiftStatus: status,
                });
                expect(result.success).toBe(true);
            }
        });

        it('should reject invalid AvalancheDanger', () => {
            const result = createDynamicDataSchema.safeParse({
                ...validDynamicData,
                AvalancheDanger: 'INVALID',
            });
            expect(result.success).toBe(false);
        });

        it('should accept valid AvalancheDanger values', () => {
            const dangers = ['Low', 'Moderate', 'Considerable', 'High', 'Extreme'];
            for (const danger of dangers) {
                const result = createDynamicDataSchema.safeParse({
                    ...validDynamicData,
                    AvalancheDanger: danger,
                });
                expect(result.success).toBe(true);
            }
        });
    });

    describe('updateDynamicDataSchema', () => {
        it('should validate partial updates', () => {
            const result = updateDynamicDataSchema.safeParse({
                LiftStatus: 'Closed',
            });
            expect(result.success).toBe(true);
        });

        it('should validate multiple field updates', () => {
            const result = updateDynamicDataSchema.safeParse({
                LiftStatus: 'Closed',
                AvalancheDanger: 'High',
                TotalUniqueLiftRiders: 0,
            });
            expect(result.success).toBe(true);
        });

        it('should allow empty object', () => {
            const result = updateDynamicDataSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should reject invalid enum values', () => {
            const result = updateDynamicDataSchema.safeParse({
                LiftStatus: 'INVALID',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('createResortDataSchema', () => {
        it('should validate valid resort data', () => {
            const result = createResortDataSchema.safeParse(validResortData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validResortData);
            }
        });

        it('should reject empty metadata', () => {
            const result = createResortDataSchema.safeParse({
                ...validResortData,
                Metadata: '',
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative riders', () => {
            const result = createResortDataSchema.safeParse({
                ...validResortData,
                TotalUniqueLiftRiders: -100,
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative open lifts', () => {
            const result = createResortDataSchema.safeParse({
                ...validResortData,
                OpenLifts: -5,
            });
            expect(result.success).toBe(false);
        });

        it('should accept zero open lifts', () => {
            const result = createResortDataSchema.safeParse({
                ...validResortData,
                OpenLifts: [],
            });
            expect(result.success).toBe(true);
        });
    });

    describe('listQuerySchema', () => {
        it('should validate with only limit', () => {
            const result = listQuerySchema.safeParse({ limit: 20 });
            expect(result.success).toBe(true);
        });

        it('should validate with pagination keys', () => {
            const result = listQuerySchema.safeParse({
                limit: 10,
                lastEvaluatedLift: 'Summit Express',
                lastEvaluatedMetadata: 'Static Data',
            });
            expect(result.success).toBe(true);
        });

        it('should use default limit of 20', () => {
            const result = listQuerySchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBe(20);
            }
        });

        it('should reject limit less than 1', () => {
            const result = listQuerySchema.safeParse({ limit: 0 });
            expect(result.success).toBe(false);
        });

        it('should reject limit greater than 100', () => {
            const result = listQuerySchema.safeParse({ limit: 101 });
            expect(result.success).toBe(false);
        });

        it('should allow empty pagination keys', () => {
            const result = listQuerySchema.safeParse({
                limit: 20,
                lastEvaluatedLift: '',
                lastEvaluatedMetadata: '',
            });
            // Empty strings are allowed as optional fields
            expect(result.success).toBe(true);
        });
    });

    describe('queryByRidersSchema', () => {
        it('should validate with minRiders only', () => {
            const result = queryByRidersSchema.safeParse({
                minRiders: 100,
                limit: 20,
            });
            expect(result.success).toBe(true);
        });

        it('should validate with maxRiders only', () => {
            const result = queryByRidersSchema.safeParse({
                maxRiders: 500,
                limit: 20,
            });
            expect(result.success).toBe(true);
        });

        it('should validate with both min and max riders', () => {
            const result = queryByRidersSchema.safeParse({
                minRiders: 100,
                maxRiders: 500,
                limit: 20,
            });
            expect(result.success).toBe(true);
        });

        it('should use default limit of 20', () => {
            const result = queryByRidersSchema.safeParse({
                minRiders: 100,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBe(20);
            }
        });

        it('should reject negative minRiders', () => {
            const result = queryByRidersSchema.safeParse({
                minRiders: -10,
                limit: 20,
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative maxRiders', () => {
            const result = queryByRidersSchema.safeParse({
                maxRiders: -10,
                limit: 20,
            });
            expect(result.success).toBe(false);
        });

        it('should accept zero riders', () => {
            const result = queryByRidersSchema.safeParse({
                minRiders: 0,
                maxRiders: 0,
                limit: 20,
            });
            expect(result.success).toBe(true);
        });
    });
});
