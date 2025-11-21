#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargateStack } from '../lib/fargate-stack.js';
import { prodConfig, testConfig } from '../lib/config.js';

const app = new cdk.App();

// Get AWS account and region from environment or use defaults
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

if (!account) {
    throw new Error('CDK_DEFAULT_ACCOUNT environment variable must be set');
}

// Test Environment Stack
new FargateStack(app, 'FastifyDdbStack-test', {
    config: testConfig,
    env: {
        account,
        region: testConfig.region,
    },
    description: 'Fastify DynamoDB API - Test Environment',
});

// Production Environment Stack
new FargateStack(app, 'FastifyDdbStack-prod', {
    config: prodConfig,
    env: {
        account,
        region: prodConfig.region,
    },
    description: 'Fastify DynamoDB API - Production Environment',
});

app.synth();
