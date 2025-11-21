import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import type { EnvironmentConfig } from './config.js';

export interface FargateStackProps extends cdk.StackProps {
    config: EnvironmentConfig;
}

export class FargateStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: FargateStackProps) {
        super(scope, id, props);

        const { config } = props;

        // Lookup existing VPC
        const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
            isDefault: false,
            tags: config.vpcLookupTags,
        });

        // Create ECS Cluster
        const cluster = new ecs.Cluster(this, 'Cluster', {
            vpc,
            clusterName: `fastify-ddb-${config.environmentName}`,
            containerInsights: config.environmentName === 'prod',
        });

        // Create CloudWatch Log Group
        const logGroup = new logs.LogGroup(this, 'LogGroup', {
            logGroupName: `/ecs/fastify-ddb-${config.environmentName}`,
            retention:
                config.environmentName === 'prod'
                    ? logs.RetentionDays.ONE_MONTH
                    : logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Create Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
            memoryLimitMiB: config.memory,
            cpu: config.cpu,
            family: `fastify-ddb-${config.environmentName}`,
        });

        // Add DynamoDB permissions to task role
        taskDefinition.taskRole.addToPrincipalPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    'dynamodb:BatchGetItem',
                    'dynamodb:BatchWriteItem',
                ],
                resources: [
                    `arn:aws:dynamodb:${config.region}:${this.account}:table/${config.dynamoDbTableName}`,
                    `arn:aws:dynamodb:${config.region}:${this.account}:table/${config.dynamoDbTableName}/index/*`,
                ],
            })
        );

        // Add container to task definition
        const container = taskDefinition.addContainer('AppContainer', {
            image: ecs.ContainerImage.fromAsset('..', {
                file: 'Dockerfile',
            }),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'fastify-ddb',
                logGroup,
            }),
            environment: {
                NODE_ENV: config.nodeEnv,
                PORT: config.port.toString(),
                HOST: '0.0.0.0',
                LOG_LEVEL: config.logLevel,
                DYNAMODB_MODE: config.dynamoDbMode,
                DYNAMODB_TABLE_NAME: config.dynamoDbTableName,
                AWS_REGION: config.region,
                CORS_ORIGIN: config.corsOrigin,
            },
            healthCheck: {
                command: ['CMD-SHELL', 'node -e "require(\'http\').get(\'http://localhost:3000/health\', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"'],
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                retries: 3,
                startPeriod: cdk.Duration.seconds(60),
            },
        });

        container.addPortMappings({
            containerPort: config.port,
            protocol: ecs.Protocol.TCP,
        });

        // Create Fargate Service with Application Load Balancer
        const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
            this,
            'FargateService',
            {
                cluster,
                taskDefinition,
                serviceName: `fastify-ddb-${config.environmentName}`,
                desiredCount: config.desiredCount,
                publicLoadBalancer: true,
                listenerPort: 80,
                healthCheckGracePeriod: cdk.Duration.seconds(60),
                circuitBreaker: {
                    enable: true,
                    rollback: true,
                },
            }
        );

        // Configure health check on target group
        fargateService.targetGroup.configureHealthCheck({
            path: '/health',
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3,
        });

        // Configure auto-scaling
        const scaling = fargateService.service.autoScaleTaskCount({
            minCapacity: config.minCapacity,
            maxCapacity: config.maxCapacity,
        });

        // Scale based on CPU utilization
        scaling.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 70,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60),
        });

        // Scale based on memory utilization
        scaling.scaleOnMemoryUtilization('MemoryScaling', {
            targetUtilizationPercent: 80,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60),
        });

        // Outputs
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            description: 'Load Balancer DNS Name',
            exportName: `FastifyDdb-${config.environmentName}-LoadBalancerDNS`,
        });

        new cdk.CfnOutput(this, 'ServiceURL', {
            value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
            description: 'Service URL',
            exportName: `FastifyDdb-${config.environmentName}-ServiceURL`,
        });

        new cdk.CfnOutput(this, 'ClusterName', {
            value: cluster.clusterName,
            description: 'ECS Cluster Name',
            exportName: `FastifyDdb-${config.environmentName}-ClusterName`,
        });

        new cdk.CfnOutput(this, 'ServiceName', {
            value: fargateService.service.serviceName,
            description: 'ECS Service Name',
            exportName: `FastifyDdb-${config.environmentName}-ServiceName`,
        });
    }
}
