# CDK Deployment for Fastify DynamoDB API

This directory contains AWS CDK infrastructure code to deploy the Fastify DynamoDB API as an ECS Fargate service.

## Architecture

- **ECS Fargate**: Serverless container orchestration
- **Application Load Balancer**: Public-facing load balancer
- **Auto-scaling**: CPU and memory-based scaling
- **CloudWatch Logs**: Centralized logging
- **VPC**: Uses existing VPC in your AWS account
- **DynamoDB**: IAM permissions for table access

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Configured with credentials (`aws configure`)
3. **Node.js**: Version 18 or higher
4. **Docker**: For building container images
5. **VPC**: Existing VPC in your AWS account
6. **DynamoDB Tables**: 
   - Test: `SkiLifts-test`
   - Prod: `SkiLifts`

## Environment Configuration

The deployment supports two environments:

### Test Environment
- **CPU**: 0.5 vCPU
- **Memory**: 1 GB
- **Scaling**: 1-2 tasks
- **Table**: `SkiLifts-test`
- **Log Level**: debug

### Production Environment
- **CPU**: 1 vCPU
- **Memory**: 2 GB
- **Scaling**: 2-10 tasks
- **Table**: `SkiLifts`
- **Log Level**: info

## Setup

1. **Install CDK dependencies**:
   ```bash
   npm run cdk:install
   ```

2. **Bootstrap CDK** (first time only):
   ```bash
   cd cdk
   npx cdk bootstrap
   ```

3. **Configure AWS credentials**:
   ```bash
   export AWS_PROFILE=your-profile
   # or
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

## VPC Configuration

The stack automatically discovers an existing VPC in your account. By default, it looks for any non-default VPC.

To specify a particular VPC, edit `lib/config.ts` and add VPC lookup tags:

```typescript
vpcLookupTags: {
  Environment: 'test'  // or 'prod'
}
```

## Deployment

### Test Environment

1. **Synthesize CloudFormation template**:
   ```bash
   npm run cdk:synth:test
   ```

2. **Preview changes**:
   ```bash
   npm run cdk:diff:test
   ```

3. **Deploy**:
   ```bash
   npm run cdk:deploy:test
   ```

4. **Access the service**:
   The deployment will output the Load Balancer DNS name. Access your API at:
   ```
   http://<load-balancer-dns>/health
   ```

### Production Environment

1. **Synthesize CloudFormation template**:
   ```bash
   npm run cdk:synth:prod
   ```

2. **Preview changes**:
   ```bash
   npm run cdk:diff:prod
   ```

3. **Deploy**:
   ```bash
   npm run cdk:deploy:prod
   ```

## Stack Outputs

After deployment, the stack outputs:

- **LoadBalancerDNS**: DNS name of the Application Load Balancer
- **ServiceURL**: Full HTTP URL to access the service
- **ClusterName**: ECS cluster name
- **ServiceName**: ECS service name

## Monitoring

### CloudWatch Logs

Logs are available in CloudWatch:
- Test: `/ecs/fastify-ddb-test`
- Prod: `/ecs/fastify-ddb-prod`

### ECS Console

Monitor service health, task count, and scaling in the ECS console.

## Updating the Service

To deploy code changes:

1. Make your code changes in the main project
2. Run the deploy command for your environment:
   ```bash
   npm run cdk:deploy:test
   # or
   npm run cdk:deploy:prod
   ```

The CDK will automatically:
- Build a new Docker image
- Push it to ECR
- Update the ECS service with the new image

## Destroying Resources

To remove all resources:

```bash
# Test environment
npm run cdk:destroy:test

# Production environment
npm run cdk:destroy:prod
```

> **Warning**: This will delete all resources including logs. Make sure to backup any important data first.

## Customization

### Environment Variables

Edit `lib/config.ts` to modify:
- Task sizing (CPU/memory)
- Scaling parameters
- DynamoDB table names
- CORS settings
- Log levels

### VPC Selection

Edit `lib/config.ts` to add VPC lookup tags:

```typescript
vpcLookupTags: {
  Name: 'my-vpc',
  Environment: 'prod'
}
```

### Container Configuration

Edit `lib/fargate-stack.ts` to modify:
- Health check settings
- Container environment variables
- Auto-scaling policies

## Troubleshooting

### VPC Not Found

If you get a "VPC not found" error:
1. Ensure a VPC exists in your account
2. Check the region matches your configuration
3. Add specific VPC lookup tags in `lib/config.ts`

### Docker Build Fails

1. Ensure Docker is running
2. Check that the application builds locally: `npm run build`
3. Verify Dockerfile is in the project root

### Service Unhealthy

1. Check CloudWatch logs for errors
2. Verify DynamoDB table exists and has correct name
3. Check IAM permissions for the task role
4. Verify environment variables in `lib/fargate-stack.ts`

### Deployment Fails

1. Check AWS credentials are configured
2. Verify you have necessary IAM permissions
3. Check CloudFormation console for detailed error messages
4. Ensure CDK is bootstrapped: `npx cdk bootstrap`

## Cost Optimization

- **Test environment**: Uses minimal resources (0.5 vCPU, 1 GB RAM)
- **Auto-scaling**: Scales down during low traffic
- **Log retention**: 7 days for test, 30 days for prod
- **Container Insights**: Disabled for test, enabled for prod

## Security

- Non-root container user
- Minimal IAM permissions (DynamoDB access only)
- Security headers via Helmet middleware
- VPC networking with security groups
- HTTPS support (configure ALB listener for production)

## Next Steps

1. **Custom Domain**: Add Route53 and ACM certificate for custom domain
2. **HTTPS**: Configure ALB HTTPS listener with SSL certificate
3. **CI/CD**: Integrate with GitHub Actions or AWS CodePipeline
4. **Monitoring**: Add CloudWatch alarms and dashboards
5. **Secrets**: Use AWS Secrets Manager for sensitive configuration
