export interface EnvironmentConfig {
    environmentName: string;
    region: string;

    // ECS Configuration
    cpu: number; // in vCPU units (256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)
    memory: number; // in MB
    desiredCount: number;
    minCapacity: number;
    maxCapacity: number;

    // Application Configuration
    port: number;
    logLevel: string;
    nodeEnv: string;

    // DynamoDB Configuration
    dynamoDbTableName: string;
    dynamoDbMode: 'remote';

    // CORS Configuration
    corsOrigin: string;

    // VPC Configuration
    vpcLookupTags?: Record<string, string>;
}

export const testConfig: EnvironmentConfig = {
    environmentName: 'test',
    region: process.env.AWS_REGION || 'us-east-1',

    // Smaller resources for test
    cpu: 512, // 0.5 vCPU
    memory: 1024, // 1 GB
    desiredCount: 1,
    minCapacity: 1,
    maxCapacity: 2,

    port: 3000,
    logLevel: 'debug',
    nodeEnv: 'development',

    dynamoDbTableName: 'SkiLifts-test',
    dynamoDbMode: 'remote',

    corsOrigin: '*',

    // Optional: Add tags to lookup specific VPC
    // vpcLookupTags: {
    //   Environment: 'test'
    // }
};

export const prodConfig: EnvironmentConfig = {
    environmentName: 'prod',
    region: process.env.AWS_REGION || 'us-east-1',

    // Larger resources for production
    cpu: 1024, // 1 vCPU
    memory: 2048, // 2 GB
    desiredCount: 2,
    minCapacity: 2,
    maxCapacity: 10,

    port: 3000,
    logLevel: 'info',
    nodeEnv: 'production',

    dynamoDbTableName: 'SkiLifts',
    dynamoDbMode: 'remote',

    corsOrigin: '*', // Update with specific domain in production

    // Optional: Add tags to lookup specific VPC
    // vpcLookupTags: {
    //   Environment: 'prod'
    // }
};
