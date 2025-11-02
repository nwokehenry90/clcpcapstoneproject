# AWS CLI Setup Guide - Oshawa Skills Exchange

Complete guide for manually setting up AWS resources using AWS CLI (no CDK required).

## Prerequisites

1. **AWS Account** - [Sign up](https://aws.amazon.com/)
2. **AWS CLI v2** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. **Configure AWS CLI**:
   ```powershell
   aws configure
   ```
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format: `json`

## Step 1: Create Cognito User Pool

### 1.1 Create User Pool

```powershell
aws cognito-idp create-user-pool `
  --pool-name oshawa-skills-exchange `
  --auto-verified-attributes email `
  --username-attributes email `
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" `
  --schema "Name=email,Required=true,Mutable=false" "Name=name,Required=false,Mutable=true" `
  --mfa-configuration OFF `
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT
```

**Save the output** - you'll need the `UserPoolId` (looks like `us-east-1_xxxxxxxxx`)

### 1.2 Create User Pool Client

Replace `<USER_POOL_ID>` with the ID from previous step:

```powershell
aws cognito-idp create-user-pool-client `
  --user-pool-id <USER_POOL_ID> `
  --client-name oshawa-skills-web-app `
  --no-generate-secret `
  --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_SRP_AUTH" `
  --prevent-user-existence-errors ENABLED
```

**Save the output** - you'll need the `ClientId`

### 1.3 Verify User Pool

```powershell
aws cognito-idp describe-user-pool --user-pool-id <USER_POOL_ID>
```

## Step 2: Create DynamoDB Table

### 2.1 Create Skills Table

```powershell
aws dynamodb create-table `
  --table-name oshawa-skills `
  --attribute-definitions `
    AttributeName=skillId,AttributeType=S `
  --key-schema `
    AttributeName=skillId,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --tags Key=Application,Value=OshawaSkillsExchange Key=Environment,Value=production
```

### 2.2 Enable Point-in-Time Recovery (Recommended)

```powershell
aws dynamodb update-continuous-backups `
  --table-name oshawa-skills `
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### 2.3 Verify Table

```powershell
aws dynamodb describe-table --table-name oshawa-skills
```

Wait until TableStatus shows `ACTIVE`.

## Step 3: Create IAM Role for Lambda

### 3.1 Create Trust Policy

Create a file `lambda-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 3.2 Create IAM Role

```powershell
aws iam create-role `
  --role-name OshawaSkillsLambdaRole `
  --assume-role-policy-document file://lambda-trust-policy.json `
  --description "Execution role for Oshawa Skills Exchange Lambda functions"
```

**Save the output** - you'll need the `Arn` (Role ARN)

### 3.3 Attach Basic Lambda Execution Policy

```powershell
aws iam attach-role-policy `
  --role-name OshawaSkillsLambdaRole `
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### 3.4 Create DynamoDB Access Policy

Create a file `dynamodb-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/oshawa-skills"
    }
  ]
}
```

### 3.5 Attach DynamoDB Policy

```powershell
aws iam put-role-policy `
  --role-name OshawaSkillsLambdaRole `
  --policy-name DynamoDBAccess `
  --policy-document file://dynamodb-policy.json
```

## Step 4: Create Lambda Function

### 4.1 Build Backend Code

From the project root:

```powershell
cd backend
npm install
npm run build
```

### 4.2 Create Deployment Package

```powershell
# Create a deployment directory
New-Item -ItemType Directory -Force -Path deploy

# Copy built code
Copy-Item -Path dist/* -Destination deploy/ -Recurse

# Copy node_modules (production only)
npm install --production
Copy-Item -Path node_modules -Destination deploy/ -Recurse

# Create ZIP file
Compress-Archive -Path deploy/* -DestinationPath skills-lambda.zip -Force

# Clean up
Remove-Item -Path deploy -Recurse -Force
```

### 4.3 Create Lambda Function

Replace `<ROLE_ARN>` with the ARN from Step 3.2:

```powershell
aws lambda create-function `
  --function-name oshawa-skills-api `
  --runtime nodejs18.x `
  --role <ROLE_ARN> `
  --handler index.handler `
  --zip-file fileb://skills-lambda.zip `
  --timeout 30 `
  --memory-size 256 `
  --environment Variables="{SKILLS_TABLE_NAME=oshawa-skills,AWS_REGION=us-east-1}" `
  --description "API handler for Oshawa Skills Exchange"
```

**Save the output** - you'll need the `FunctionArn`

### 4.4 Verify Lambda

```powershell
aws lambda get-function --function-name oshawa-skills-api
```

### 4.5 Test Lambda (Optional)

Create a file `test-event.json`:

```json
{
  "httpMethod": "GET",
  "path": "/health",
  "headers": {},
  "body": null
}
```

Test it:

```powershell
aws lambda invoke `
  --function-name oshawa-skills-api `
  --payload file://test-event.json `
  response.json

Get-Content response.json
```

## Step 5: Create API Gateway

### 5.1 Create REST API

```powershell
aws apigateway create-rest-api `
  --name "Oshawa Skills Exchange API" `
  --description "REST API for Oshawa Skills Exchange" `
  --endpoint-configuration types=REGIONAL
```

**Save the output** - you'll need the `id` (API ID)

### 5.2 Get Root Resource ID

Replace `<API_ID>` with the ID from previous step:

```powershell
$apiId = "<API_ID>"
aws apigateway get-resources --rest-api-id $apiId
```

**Save the root resource `id`**

### 5.3 Create /api Resource

```powershell
$rootId = "<ROOT_RESOURCE_ID>"

aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $rootId `
  --path-part api
```

**Save the new resource `id`**

### 5.4 Create /api/skills Resource

```powershell
$apiResourceId = "<API_RESOURCE_ID>"

aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $apiResourceId `
  --path-part skills
```

**Save the skills resource `id`**

### 5.5 Create /{proxy+} Resource for Skills

```powershell
$skillsResourceId = "<SKILLS_RESOURCE_ID>"

aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $skillsResourceId `
  --path-part "{proxy+}"
```

**Save the proxy resource `id`**

### 5.6 Create ANY Method

```powershell
$proxyResourceId = "<PROXY_RESOURCE_ID>"

aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method ANY `
  --authorization-type NONE
```

### 5.7 Integrate with Lambda

Replace `<REGION>`, `<ACCOUNT_ID>`, and `<LAMBDA_ARN>`:

```powershell
$region = "us-east-1"
$accountId = (aws sts get-caller-identity --query Account --output text)
$lambdaArn = "arn:aws:lambda:${region}:${accountId}:function:oshawa-skills-api"

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method ANY `
  --type AWS_PROXY `
  --integration-http-method POST `
  --uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
```

### 5.8 Grant API Gateway Permission to Invoke Lambda

```powershell
aws lambda add-permission `
  --function-name oshawa-skills-api `
  --statement-id apigateway-invoke `
  --action lambda:InvokeFunction `
  --principal apigateway.amazonaws.com `
  --source-arn "arn:aws:execute-api:${region}:${accountId}:${apiId}/*"
```

### 5.9 Enable CORS

```powershell
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method OPTIONS `
  --authorization-type NONE

aws apigateway put-method-response `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters "method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true"

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method OPTIONS `
  --type MOCK `
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'

aws apigateway put-integration-response `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' `
  --response-templates '{"application/json": ""}'
```

### 5.10 Deploy API

```powershell
aws apigateway create-deployment `
  --rest-api-id $apiId `
  --stage-name prod `
  --description "Production deployment"
```

### 5.11 Get API Endpoint

```powershell
$apiEndpoint = "https://${apiId}.execute-api.${region}.amazonaws.com/prod"
Write-Host "API Endpoint: $apiEndpoint"
```

## Step 6: Create S3 Bucket for Frontend

### 6.1 Create Bucket

Choose a unique bucket name (must be globally unique):

```powershell
$bucketName = "oshawa-skills-exchange-$(Get-Random)"

aws s3 mb s3://$bucketName --region us-east-1
```

### 6.2 Configure for Static Website Hosting

```powershell
aws s3 website s3://$bucketName --index-document index.html --error-document index.html
```

### 6.3 Create Bucket Policy

Create a file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

Replace `BUCKET_NAME` with your actual bucket name in the file, then:

```powershell
aws s3api put-bucket-policy --bucket $bucketName --policy file://bucket-policy.json
```

### 6.4 Disable Block Public Access

```powershell
aws s3api put-public-access-block `
  --bucket $bucketName `
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

## Step 7: Configure Frontend Environment

### 7.1 Create .env File

In `frontend/` directory, create `.env`:

```env
REACT_APP_COGNITO_USER_POOL_ID=<YOUR_USER_POOL_ID>
REACT_APP_COGNITO_CLIENT_ID=<YOUR_CLIENT_ID>
REACT_APP_API_BASE_URL=<YOUR_API_ENDPOINT>/api
```

Example:
```env
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_abc123def
REACT_APP_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
REACT_APP_API_BASE_URL=https://xyz123.execute-api.us-east-1.amazonaws.com/prod/api
```

### 7.2 Build Frontend

```powershell
cd frontend
npm run build
```

### 7.3 Deploy to S3

```powershell
aws s3 sync build/ s3://$bucketName --delete
```

### 7.4 Get Website URL

```powershell
$websiteUrl = "http://${bucketName}.s3-website-us-east-1.amazonaws.com"
Write-Host "Website URL: $websiteUrl"
```

## Step 8: Testing

### 8.1 Test API

```powershell
# Health check
Invoke-WebRequest -Uri "${apiEndpoint}/api/health" -Method GET

# Get skills
Invoke-WebRequest -Uri "${apiEndpoint}/api/skills" -Method GET
```

### 8.2 Test Frontend

Open the website URL in your browser and test:
1. Browse skills marketplace (should work without auth)
2. Register a new account
3. Check email for verification code
4. Sign in with credentials
5. Post a new skill (requires authentication)

## Step 9: Cleanup (When Done)

To delete all resources and stop charges:

```powershell
# Delete Lambda function
aws lambda delete-function --function-name oshawa-skills-api

# Delete API Gateway
aws apigateway delete-rest-api --rest-api-id $apiId

# Empty and delete S3 bucket
aws s3 rm s3://$bucketName --recursive
aws s3 rb s3://$bucketName

# Delete DynamoDB table
aws dynamodb delete-table --table-name oshawa-skills

# Delete IAM role policies and role
aws iam delete-role-policy --role-name OshawaSkillsLambdaRole --policy-name DynamoDBAccess
aws iam detach-role-policy --role-name OshawaSkillsLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name OshawaSkillsLambdaRole

# Delete Cognito User Pool
aws cognito-idp delete-user-pool --user-pool-id <USER_POOL_ID>
```

## Troubleshooting

### Lambda Not Responding
- Check CloudWatch logs: `aws logs tail /aws/lambda/oshawa-skills-api --follow`
- Verify environment variables are set correctly

### CORS Errors
- Ensure OPTIONS method is configured
- Check CORS headers in Lambda response

### Authentication Errors
- Verify Cognito User Pool ID and Client ID in frontend .env
- Check that email is verified before signing in

### API Gateway 403 Errors
- Verify Lambda permission for API Gateway
- Check that deployment was created

## Next Steps

1. **Add CloudFront** (Optional): For better performance and HTTPS
2. **Set up CI/CD**: Automate deployments
3. **Add monitoring**: CloudWatch alarms and dashboards
4. **Implement caching**: API Gateway caching for better performance

---

**Setup complete!** You now have a fully functional skills exchange marketplace running on AWS.
