import type {
    CreateDynamicDataInput,
    CreateResortDataInput,
    CreateStaticDataInput,
} from '../../src/schemas/skilift.schemas.js';
import type {
    ResortData,
    SkiLiftDynamicData,
    SkiLiftStaticData,
} from '../../src/types/skilift.types.js';

/**
 * Mock data for testing SkiLift operations
 */

// Static Data Examples
export const validStaticData: CreateStaticDataInput = {
    Lift: 'Summit Express',
    ExperiencedRidersOnly: false,
    VerticalFeet: 2500,
    LiftTime: '8:00',
};

export const validStaticDataResponse: SkiLiftStaticData = {
    Lift: 'Summit Express',
    Metadata: 'Static Data',
    ExperiencedRidersOnly: false,
    VerticalFeet: 2500,
    LiftTime: '8:00',
};

export const experiencedOnlyStaticData: CreateStaticDataInput = {
    Lift: 'Black Diamond Lift',
    ExperiencedRidersOnly: true,
    VerticalFeet: 3200,
    LiftTime: '10:30',
};

// Dynamic Data Examples
export const validDynamicData: CreateDynamicDataInput = {
    Lift: 'Summit Express',
    Metadata: '01/15/24',
    TotalUniqueLiftRiders: 1250,
    AverageSnowCoverageInches: 48,
    LiftStatus: 'Open',
    AvalancheDanger: 'Low',
};

export const validDynamicDataResponse: SkiLiftDynamicData = {
    Lift: 'Summit Express',
    Metadata: '01/15/24',
    TotalUniqueLiftRiders: 1250,
    AverageSnowCoverageInches: 48,
    LiftStatus: 'Open',
    AvalancheDanger: 'Low',
};

export const closedLiftDynamicData: CreateDynamicDataInput = {
    Lift: 'Summit Express',
    Metadata: '01/16/24',
    TotalUniqueLiftRiders: 0,
    AverageSnowCoverageInches: 12,
    LiftStatus: 'Closed',
    AvalancheDanger: 'High',
};

export const highTrafficDynamicData: CreateDynamicDataInput = {
    Lift: 'Beginner Slope',
    Metadata: '01/15/24',
    TotalUniqueLiftRiders: 5000,
    AverageSnowCoverageInches: 36,
    LiftStatus: 'Open',
    AvalancheDanger: 'Low',
};

// Resort Data Examples
export const validResortData: CreateResortDataInput = {
    Metadata: '01/15/24',
    TotalUniqueLiftRiders: 8500,
    AverageSnowCoverageInches: 42,
    AvalancheDanger: 'Moderate',
    OpenLifts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const validResortDataResponse: ResortData = {
    Lift: 'Resort Data',
    Metadata: '01/15/24',
    TotalUniqueLiftRiders: 8500,
    AverageSnowCoverageInches: 42,
    AvalancheDanger: 'Moderate',
    OpenLifts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const lowTrafficResortData: CreateResortDataInput = {
    Metadata: '01/16/24',
    TotalUniqueLiftRiders: 1200,
    AverageSnowCoverageInches: 15,
    AvalancheDanger: 'High',
    OpenLifts: [1, 2, 3],
};

// Invalid Data Examples for Validation Tests
export const invalidStaticData = {
    Lift: '', // Empty lift name
    ExperiencedRidersOnly: 'yes', // Should be boolean
    VerticalFeet: -100, // Negative value
    LiftTime: 'fast', // Should be HH:MM format
};

export const invalidDynamicData = {
    Lift: 'Test Lift',
    Metadata: '', // Empty metadata
    TotalUniqueLiftRiders: -50, // Negative riders
    AverageSnowCoverageInches: 'lots', // Should be number
    LiftStatus: 'MAYBE', // Invalid status
    AvalancheDanger: 'EXTREME', // Invalid danger level (should be 'Extreme')
};

export const invalidResortData = {
    Metadata: '', // Empty metadata
    TotalUniqueLiftRiders: 'many', // Should be number
    AverageSnowCoverageInches: -10, // Negative value
    AvalancheDanger: 'SAFE', // Invalid danger level
    OpenLifts: -5, // Should be array
};

// Multiple records for list/query tests
export const multipleLifts = [
    {
        Lift: 'Summit Express',
        Metadata: 'Static Data',
        ExperiencedRidersOnly: false,
        VerticalFeet: 2500,
        LiftTime: '8:00',
    },
    {
        Lift: 'Summit Express',
        Metadata: '01/15/24',
        TotalUniqueLiftRiders: 1250,
        AverageSnowCoverageInches: 48,
        LiftStatus: 'Open',
        AvalancheDanger: 'Low',
    },
    {
        Lift: 'Black Diamond Lift',
        Metadata: 'Static Data',
        ExperiencedRidersOnly: true,
        VerticalFeet: 3200,
        LiftTime: '10:30',
    },
    {
        Lift: 'Black Diamond Lift',
        Metadata: '01/15/24',
        TotalUniqueLiftRiders: 450,
        AverageSnowCoverageInches: 52,
        LiftStatus: 'Open',
        AvalancheDanger: 'Moderate',
    },
];

// Pagination test data
export const paginatedLifts = Array.from({ length: 25 }, (_, i) => ({
    Lift: `Lift ${i + 1}`,
    Metadata: 'Static Data',
    ExperiencedRidersOnly: i % 2 === 0,
    VerticalFeet: 1000 + i * 100,
    LiftTime: `${5 + (i % 5)}:00`,
}));
