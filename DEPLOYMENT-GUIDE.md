# AWS Setup Quickstart - Oshawa Skills Exchange

Follow these steps to deploy your application to AWS.

## Prerequisites

✅ AWS Account created  
✅ AWS CLI installed and configured (`aws configure`)  
✅ Node.js and npm installed  

---

## Step 1: Create Cognito User Pool (5 minutes)

```powershell
# Create the user pool
aws cognito-idp create-user-pool `
  --pool-name oshawa-skills-exchange `
  --auto-verified-attributes email `
  --username-attributes email `
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" `
  --schema "Name=email,Required=true,Mutable=false" "Name=name,Required=false,Mutable=true" `
  --mfa-configuration OFF
```

**📝 Note the `UserPoolId`** from output (e.g., `us-east-1_abc123def`)

```powershell
# Create app client (replace <USER_POOL_ID> with your ID)
aws cognito-idp create-user-pool-client `
  --user-pool-id <USER_POOL_ID> `
  --client-name oshawa-skills-web-app `
  --no-generate-secret `
  --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_SRP_AUTH"
```

**📝 Note the `ClientId`** from output

---

## Step 2: Create DynamoDB Table (2 minutes)

```powershell
aws dynamodb create-table `
  --table-name oshawa-skills `
  --attribute-definitions AttributeName=skillId,AttributeType=S `
  --key-schema AttributeName=skillId,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1
```

Wait for table to be active:
```powershell
aws dynamodb describe-table --table-name oshawa-skills --query "Table.TableStatus"
```

---

## Step 3: Create IAM Role for Lambda (3 minutes)

```powershell
# Create trust policy file
@'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
'@ | Out-File -FilePath lambda-trust-policy.json -Encoding utf8

# Create the role
aws iam create-role `
  --role-name OshawaSkillsLambdaRole `
  --assume-role-policy-document file://lambda-trust-policy.json
```

**📝 Note the `Arn`** from output (Role ARN)

```powershell
# Attach basic Lambda execution policy
aws iam attach-role-policy `
  --role-name OshawaSkillsLambdaRole `
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create DynamoDB access policy
@'
{
  "Version": "2012-10-17",
  "Statement": [{
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
  }]
}
'@ | Out-File -FilePath dynamodb-policy.json -Encoding utf8

# Attach DynamoDB policy
aws iam put-role-policy `
  --role-name OshawaSkillsLambdaRole `
  --policy-name DynamoDBAccess `
  --policy-document file://dynamodb-policy.json
```

---

## Step 4: Build and Deploy Lambda Function (5 minutes)

```powershell
# Navigate to project root
cd "C:\Users\nwoke\OneDrive\Documents\Development Projects\Capstone Project"

# Build Lambda package
.\deploy-lambda.ps1
```

This creates `backend\skills-lambda.zip`

```powershell
# Deploy Lambda (replace <ROLE_ARN> with your role ARN from Step 3)
cd backend
aws lambda create-function `
  --function-name oshawa-skills-api `
  --runtime nodejs18.x `
  --role <ROLE_ARN> `
  --handler index.handler `
  --zip-file fileb://skills-lambda.zip `
  --timeout 30 `
  --memory-size 256 `
  --environment Variables="{SKILLS_TABLE_NAME=oshawa-skills,AWS_REGION=us-east-1}"
```

**📝 Note the `FunctionArn`**

---

## Step 5: Create API Gateway (10 minutes)

```powershell
# Create REST API
$api = aws apigateway create-rest-api `
  --name "Oshawa Skills Exchange API" `
  --description "REST API for Skills Exchange" `
  --endpoint-configuration types=REGIONAL | ConvertFrom-Json

$apiId = $api.id
Write-Host "API ID: $apiId"

# Get root resource
$resources = aws apigateway get-resources --rest-api-id $apiId | ConvertFrom-Json
$rootId = $resources.items[0].id

# Create /api resource
$apiResource = aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $rootId `
  --path-part api | ConvertFrom-Json
$apiResourceId = $apiResource.id

# Create /api/skills resource
$skillsResource = aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $apiResourceId `
  --path-part skills | ConvertFrom-Json
$skillsResourceId = $skillsResource.id

# Create {proxy+} resource
$proxyResource = aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $skillsResourceId `
  --path-part "{proxy+}" | ConvertFrom-Json
$proxyResourceId = $proxyResource.id

# Create ANY method
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method ANY `
  --authorization-type NONE

# Get Lambda ARN
$accountId = (aws sts get-caller-identity --query Account --output text)
$region = "us-east-1"
$lambdaArn = "arn:aws:lambda:${region}:${accountId}:function:oshawa-skills-api"

# Integrate with Lambda
$uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $proxyResourceId `
  --http-method ANY `
  --type AWS_PROXY `
  --integration-http-method POST `
  --uri $uri

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission `
  --function-name oshawa-skills-api `
  --statement-id apigateway-invoke `
  --action lambda:InvokeFunction `
  --principal apigateway.amazonaws.com `
  --source-arn "arn:aws:execute-api:${region}:${accountId}:${apiId}/*"

# Deploy API
aws apigateway create-deployment `
  --rest-api-id $apiId `
  --stage-name prod

$apiEndpoint = "https://${apiId}.execute-api.${region}.amazonaws.com/prod"
Write-Host "`n✅ API Endpoint: $apiEndpoint"
```

---

## Step 6: Create S3 Bucket for Frontend (3 minutes)

```powershell
# Create unique bucket name
$bucketName = "oshawa-skills-$(Get-Random)"

# Create bucket
aws s3 mb s3://$bucketName --region us-east-1

# Configure for static website hosting
aws s3 website s3://$bucketName `
  --index-document index.html `
  --error-document index.html

# Create bucket policy for public read
@"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${bucketName}/*"
  }]
}
"@ | Out-File -FilePath bucket-policy.json -Encoding utf8

# Apply policy
aws s3api put-bucket-policy `
  --bucket $bucketName `
  --policy file://bucket-policy.json

# Disable block public access
aws s3api put-public-access-block `
  --bucket $bucketName `
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

$websiteUrl = "http://${bucketName}.s3-website-us-east-1.amazonaws.com"
Write-Host "`n✅ Website URL: $websiteUrl"
```

---

## Step 7: Configure and Deploy Frontend (5 minutes)

```powershell
# Navigate to frontend directory
cd "C:\Users\nwoke\OneDrive\Documents\Development Projects\Capstone Project\frontend"

# Update .env file with your values
@"
REACT_APP_COGNITO_USER_POOL_ID=<YOUR_USER_POOL_ID>
REACT_APP_COGNITO_CLIENT_ID=<YOUR_CLIENT_ID>
REACT_APP_API_BASE_URL=${apiEndpoint}/api
"@ | Out-File -FilePath .env -Encoding utf8

# Build frontend
npm run build

# Deploy to S3
aws s3 sync build/ s3://$bucketName --delete

Write-Host "`n🎉 Deployment Complete!"
Write-Host "Website URL: $websiteUrl"
Write-Host "API Endpoint: $apiEndpoint"
```

---

## Step 8: Test Your Application

1. **Open the website** at your S3 URL
2. **Register a new account**
3. **Check your email** for verification code
4. **Verify your account** with the code
5. **Sign in** with your credentials
6. **Post a skill** to test the full flow
7. **Browse skills** to see your posting

---

## Quick Reference - Your AWS Resources

After completing setup, save these values:

```
Cognito User Pool ID: ___________________
Cognito Client ID: ___________________
DynamoDB Table: oshawa-skills
Lambda Function: oshawa-skills-api
IAM Role: OshawaSkillsLambdaRole
API Gateway ID: ___________________
API Endpoint: ___________________
S3 Bucket: ___________________
Website URL: ___________________
```

---

## Troubleshooting

### Lambda not responding
```powershell
# Check Lambda logs
aws logs tail /aws/lambda/oshawa-skills-api --follow
```

### API Gateway returns 403
```powershell
# Verify Lambda permission
aws lambda get-policy --function-name oshawa-skills-api
```

### Can't register users
- Verify User Pool ID and Client ID in frontend .env
- Check that email auto-verification is enabled

### Frontend shows demo data only
- Verify API endpoint in .env is correct
- Check browser console for CORS errors
- Test API directly: `Invoke-WebRequest -Uri "$apiEndpoint/api/health"`

---

## Cost Estimate

With AWS Free Tier:
- **Cognito**: First 50,000 MAUs free
- **DynamoDB**: 25GB storage + 25 read/write units free
- **Lambda**: 1M requests + 400,000 GB-seconds free
- **S3**: 5GB storage + 20,000 GET requests free
- **API Gateway**: 1M requests free (first 12 months)

**Expected monthly cost**: $0 - $5 for typical usage

---

## Next Steps (Optional)

1. **Add CloudFront** for HTTPS and better performance
2. **Set up CI/CD** with GitHub Actions
3. **Add monitoring** with CloudWatch alarms
4. **Custom domain** with Route 53
5. **Backup strategy** for DynamoDB

See `docs\AWS-CLI-SETUP.md` for detailed documentation.
