# Oshawa Skills Exchange - Complete AWS Deployment Script
# This script automates the entire AWS setup process

param(
    [switch]$SkipCognito,
    [switch]$SkipDynamoDB,
    [switch]$SkipLambda,
    [switch]$SkipAPI,
    [switch]$SkipS3,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Oshawa Skills Exchange - AWS Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$projectRoot = $PSScriptRoot
$config = @{}

# ============================================
# Step 1: Cognito User Pool
# ============================================
if (-not $SkipCognito) {
    Write-Host "📧 Step 1: Creating Cognito User Pool..." -ForegroundColor Yellow
    
    $userPool = aws cognito-idp create-user-pool `
        --pool-name oshawa-skills-exchange `
        --auto-verified-attributes email `
        --username-attributes email `
        --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" `
        --schema "Name=email,Required=true,Mutable=false" "Name=name,Required=false,Mutable=true" `
        --mfa-configuration OFF `
        --region $region | ConvertFrom-Json
    
    $config.UserPoolId = $userPool.UserPool.Id
    Write-Host "   ✅ User Pool created: $($config.UserPoolId)" -ForegroundColor Green
    
    $userPoolClient = aws cognito-idp create-user-pool-client `
        --user-pool-id $config.UserPoolId `
        --client-name oshawa-skills-web-app `
        --no-generate-secret `
        --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_SRP_AUTH" `
        --region $region | ConvertFrom-Json
    
    $config.ClientId = $userPoolClient.UserPoolClient.ClientId
    Write-Host "   ✅ App Client created: $($config.ClientId)" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Step 2: DynamoDB Table
# ============================================
if (-not $SkipDynamoDB) {
    Write-Host "🗄️  Step 2: Creating DynamoDB Table..." -ForegroundColor Yellow
    
    aws dynamodb create-table `
        --table-name oshawa-skills `
        --attribute-definitions AttributeName=skillId,AttributeType=S `
        --key-schema AttributeName=skillId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $region | Out-Null
    
    Write-Host "   ⏳ Waiting for table to be active..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    $tableStatus = aws dynamodb describe-table --table-name oshawa-skills --region $region --query "Table.TableStatus" --output text
    Write-Host "   ✅ DynamoDB table created: oshawa-skills (Status: $tableStatus)" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Step 3: IAM Role for Lambda
# ============================================
if (-not $SkipLambda) {
    Write-Host "🔐 Step 3: Creating IAM Role..." -ForegroundColor Yellow
    
    # Create trust policy
    $trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
'@
    $trustPolicy | Out-File -FilePath "$projectRoot\lambda-trust-policy.json" -Encoding utf8
    
    $role = aws iam create-role `
        --role-name OshawaSkillsLambdaRole `
        --assume-role-policy-document file://$projectRoot/lambda-trust-policy.json | ConvertFrom-Json
    
    $config.RoleArn = $role.Role.Arn
    Write-Host "   ✅ IAM Role created: $($config.RoleArn)" -ForegroundColor Green
    
    # Attach policies
    aws iam attach-role-policy `
        --role-name OshawaSkillsLambdaRole `
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole | Out-Null
    
    # Create DynamoDB policy
    $dynamoPolicy = @'
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
'@
    $dynamoPolicy | Out-File -FilePath "$projectRoot\dynamodb-policy.json" -Encoding utf8
    
    aws iam put-role-policy `
        --role-name OshawaSkillsLambdaRole `
        --policy-name DynamoDBAccess `
        --policy-document file://$projectRoot/dynamodb-policy.json | Out-Null
    
    Write-Host "   ✅ Policies attached" -ForegroundColor Green
    Write-Host "   ⏳ Waiting for IAM role propagation..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    Write-Host ""
    
    # Build Lambda package
    Write-Host "📦 Step 4: Building Lambda Package..." -ForegroundColor Yellow
    & "$projectRoot\deploy-lambda.ps1" -BuildOnly
    Write-Host ""
    
    # Deploy Lambda
    Write-Host "☁️  Step 5: Deploying Lambda Function..." -ForegroundColor Yellow
    
    $lambda = aws lambda create-function `
        --function-name oshawa-skills-api `
        --runtime nodejs18.x `
        --role $config.RoleArn `
        --handler index.handler `
        --zip-file fileb://$projectRoot/backend/skills-lambda.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment Variables="{SKILLS_TABLE_NAME=oshawa-skills,AWS_REGION=$region}" `
        --region $region | ConvertFrom-Json
    
    $config.LambdaArn = $lambda.FunctionArn
    Write-Host "   ✅ Lambda deployed: $($config.LambdaArn)" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Step 6: API Gateway
# ============================================
if (-not $SkipAPI) {
    Write-Host "🌐 Step 6: Creating API Gateway..." -ForegroundColor Yellow
    
    $api = aws apigateway create-rest-api `
        --name "Oshawa Skills Exchange API" `
        --description "REST API for Skills Exchange" `
        --endpoint-configuration types=REGIONAL `
        --region $region | ConvertFrom-Json
    
    $config.ApiId = $api.id
    Write-Host "   ✅ API created: $($config.ApiId)" -ForegroundColor Green
    
    # Get resources
    $resources = aws apigateway get-resources --rest-api-id $config.ApiId --region $region | ConvertFrom-Json
    $rootId = $resources.items[0].id
    
    # Create resource structure
    $apiResource = aws apigateway create-resource `
        --rest-api-id $config.ApiId `
        --parent-id $rootId `
        --path-part api `
        --region $region | ConvertFrom-Json
    
    $skillsResource = aws apigateway create-resource `
        --rest-api-id $config.ApiId `
        --parent-id $apiResource.id `
        --path-part skills `
        --region $region | ConvertFrom-Json
    
    $proxyResource = aws apigateway create-resource `
        --rest-api-id $config.ApiId `
        --parent-id $skillsResource.id `
        --path-part "{proxy+}" `
        --region $region | ConvertFrom-Json
    
    # Create ANY method
    aws apigateway put-method `
        --rest-api-id $config.ApiId `
        --resource-id $proxyResource.id `
        --http-method ANY `
        --authorization-type NONE `
        --region $region | Out-Null
    
    # Integrate with Lambda
    $accountId = aws sts get-caller-identity --query Account --output text
    $lambdaArn = "arn:aws:lambda:${region}:${accountId}:function:oshawa-skills-api"
    $uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    
    aws apigateway put-integration `
        --rest-api-id $config.ApiId `
        --resource-id $proxyResource.id `
        --http-method ANY `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri $uri `
        --region $region | Out-Null
    
    # Grant permission
    aws lambda add-permission `
        --function-name oshawa-skills-api `
        --statement-id apigateway-invoke `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${region}:${accountId}:$($config.ApiId)/*" `
        --region $region | Out-Null
    
    # Deploy API
    aws apigateway create-deployment `
        --rest-api-id $config.ApiId `
        --stage-name prod `
        --region $region | Out-Null
    
    $config.ApiEndpoint = "https://$($config.ApiId).execute-api.${region}.amazonaws.com/prod"
    Write-Host "   ✅ API deployed: $($config.ApiEndpoint)" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Step 7: S3 Bucket
# ============================================
if (-not $SkipS3) {
    Write-Host "🪣 Step 7: Creating S3 Bucket..." -ForegroundColor Yellow
    
    $config.BucketName = "oshawa-skills-$(Get-Random)"
    
    aws s3 mb s3://$($config.BucketName) --region $region | Out-Null
    
    aws s3 website s3://$($config.BucketName) `
        --index-document index.html `
        --error-document index.html | Out-Null
    
    # Bucket policy
    $bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$($config.BucketName)/*"
  }]
}
"@
    $bucketPolicy | Out-File -FilePath "$projectRoot\bucket-policy.json" -Encoding utf8
    
    aws s3api put-bucket-policy `
        --bucket $config.BucketName `
        --policy file://$projectRoot/bucket-policy.json | Out-Null
    
    aws s3api put-public-access-block `
        --bucket $config.BucketName `
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" | Out-Null
    
    $config.WebsiteUrl = "http://$($config.BucketName).s3-website-${region}.amazonaws.com"
    Write-Host "   ✅ S3 bucket created: $($config.BucketName)" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Step 8: Deploy Frontend
# ============================================
if (-not $SkipFrontend) {
    Write-Host "⚛️  Step 8: Building and Deploying Frontend..." -ForegroundColor Yellow
    
    # Update .env
    $envContent = @"
REACT_APP_COGNITO_USER_POOL_ID=$($config.UserPoolId)
REACT_APP_COGNITO_CLIENT_ID=$($config.ClientId)
REACT_APP_API_BASE_URL=$($config.ApiEndpoint)/api
"@
    $envContent | Out-File -FilePath "$projectRoot\frontend\.env" -Encoding utf8
    
    # Build
    Set-Location "$projectRoot\frontend"
    npm run build | Out-Null
    
    # Deploy
    aws s3 sync build/ s3://$($config.BucketName) --delete --region $region | Out-Null
    
    Write-Host "   ✅ Frontend deployed!" -ForegroundColor Green
    Set-Location $projectRoot
    Write-Host ""
}

# ============================================
# Summary
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Your AWS Resources:" -ForegroundColor White
Write-Host ""
Write-Host "Cognito User Pool ID:  " -NoNewline -ForegroundColor Gray
Write-Host $config.UserPoolId -ForegroundColor Cyan
Write-Host "Cognito Client ID:     " -NoNewline -ForegroundColor Gray
Write-Host $config.ClientId -ForegroundColor Cyan
Write-Host "DynamoDB Table:        " -NoNewline -ForegroundColor Gray
Write-Host "oshawa-skills" -ForegroundColor Cyan
Write-Host "Lambda Function:       " -NoNewline -ForegroundColor Gray
Write-Host "oshawa-skills-api" -ForegroundColor Cyan
Write-Host "API Endpoint:          " -NoNewline -ForegroundColor Gray
Write-Host $config.ApiEndpoint -ForegroundColor Cyan
Write-Host "S3 Bucket:             " -NoNewline -ForegroundColor Gray
Write-Host $config.BucketName -ForegroundColor Cyan
Write-Host "Website URL:           " -NoNewline -ForegroundColor Gray
Write-Host $config.WebsiteUrl -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Open your application: " -NoNewline -ForegroundColor White
Write-Host $config.WebsiteUrl -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit the website URL above" -ForegroundColor White
Write-Host "2. Register a new account" -ForegroundColor White
Write-Host "3. Check your email for verification code" -ForegroundColor White
Write-Host "4. Sign in and start posting skills!" -ForegroundColor White
Write-Host ""

# Save config
$config | ConvertTo-Json | Out-File -FilePath "$projectRoot\aws-config.json" -Encoding utf8
Write-Host "💾 Configuration saved to: aws-config.json" -ForegroundColor Gray
Write-Host ""
