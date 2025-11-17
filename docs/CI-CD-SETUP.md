# CI/CD Pipeline Setup Guide

This document explains how to configure the GitHub Actions CI/CD pipeline for automatic deployment to AWS.

## Overview

The CI/CD pipeline automatically deploys your application to AWS whenever you push to the `main` branch:

1. **Backend Deployment**: Builds TypeScript, creates Lambda package, uploads to S3, updates Lambda function
2. **Frontend Deployment**: Builds React app with production config, syncs to S3 bucket
3. **Verification**: Validates deployment and displays URLs

## Pipeline File

The workflow is defined in `.github/workflows/deploy.yml` and runs on every push to `main`.

## Required GitHub Secrets

You must configure the following secrets in your GitHub repository before the pipeline can run:

### How to Add Secrets

1. Go to your GitHub repository: https://github.com/nwokehenry90/clcpcapstoneproject
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

### Required Secrets

#### AWS Credentials

**AWS_ACCESS_KEY_ID**
- Your AWS IAM access key ID
- Used to authenticate with AWS services
- **Security**: Create a dedicated IAM user with minimal permissions (see below)

**AWS_SECRET_ACCESS_KEY**
- Your AWS IAM secret access key
- Paired with the access key ID above

#### React Environment Variables

**REACT_APP_COGNITO_USER_POOL_ID**
- Value: `us-east-1_scg9Zyunx`
- Your Cognito User Pool ID

**REACT_APP_COGNITO_CLIENT_ID**
- Value: `52dla76gop36fgf27060uu44up`
- Your Cognito App Client ID

**REACT_APP_API_ENDPOINT**
- Value: `https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod`
- Your API Gateway endpoint URL

## Creating AWS IAM User for CI/CD

For security best practices, create a dedicated IAM user with limited permissions:

### 1. Create IAM User

```bash
aws iam create-user --user-name github-actions-deployer
```

### 2. Create IAM Policy

Save this policy to `ci-cd-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Deployment",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::oshawa-skills-frontend-7712",
        "arn:aws:s3:::oshawa-skills-frontend-7712/*"
      ]
    },
    {
      "Sid": "LambdaDeployment",
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:us-east-1:603908929131:function:oshawa-skills-api"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListDistributions",
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Attach Policy to User

```bash
# Create the policy
aws iam create-policy \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://ci-cd-policy.json

# Attach to user
aws iam attach-user-policy \
  --user-name github-actions-deployer \
  --policy-arn arn:aws:iam::603908929131:policy/GitHubActionsDeployPolicy
```

### 4. Create Access Keys

```bash
aws iam create-access-key --user-name github-actions-deployer
```

**Save the output!** You'll need:
- `AccessKeyId` → Add as `AWS_ACCESS_KEY_ID` secret
- `SecretAccessKey` → Add as `AWS_SECRET_ACCESS_KEY` secret

## Testing the Pipeline

### Manual Trigger

You can manually trigger the workflow from GitHub:
1. Go to **Actions** tab
2. Select "Deploy to AWS" workflow
3. Click **Run workflow** → **Run workflow**

### Automatic Trigger

Simply push to main branch:

```bash
git add .
git commit -m "Test CI/CD pipeline"
git push origin main
```

## Monitoring Deployments

### View Workflow Runs

1. Go to your repository's **Actions** tab
2. Click on a specific workflow run to see details
3. Expand job steps to view logs

### Deployment Status

The workflow provides:
- ✅ Success indicators for each step
- Build output and file sizes
- Deployment verification
- Final URLs for frontend and API

### Common Issues

**Authentication Failed**
- Verify AWS credentials are correctly added as secrets
- Ensure IAM user has required permissions

**Build Fails**
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (18.x)

**Lambda Update Fails**
- Ensure Lambda function exists: `oshawa-skills-api`
- Check IAM permissions for Lambda operations

**S3 Sync Fails**
- Verify S3 bucket exists: `oshawa-skills-frontend-7712`
- Check IAM permissions for S3 operations

## Workflow Features

### Smart Caching
- Node modules are cached to speed up builds
- Only reinstalls when `package-lock.json` changes

### Parallel Jobs
- Backend and frontend deploy in sequence
- Frontend waits for backend to complete

### Error Handling
- CloudFront invalidation continues on error (optional feature)
- Each step has clear error messages

### Security
- Secrets are never logged
- AWS credentials use official GitHub Actions
- Minimal IAM permissions required

## Customization

### Change Deployment Branch

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - production  # Change from 'main'
```

### Add Deployment Environments

Add staging environment:

```yaml
env:
  AWS_REGION: us-east-1
  LAMBDA_FUNCTION_NAME: ${{ github.ref == 'refs/heads/main' && 'oshawa-skills-api' || 'oshawa-skills-api-staging' }}
  S3_BUCKET: ${{ github.ref == 'refs/heads/main' && 'oshawa-skills-frontend-7712' || 'oshawa-skills-frontend-staging' }}
```

### Add Slack Notifications

Add step at end:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Cost Considerations

### GitHub Actions
- 2,000 free minutes/month for public repositories
- 500 MB artifact storage
- This pipeline typically uses ~5-8 minutes per run

### AWS Data Transfer
- S3 uploads: Free (within same region)
- Lambda updates: Free
- Typical deployment: <1 MB transfer

## Next Steps

1. ✅ Set up all required GitHub secrets
2. ✅ Create dedicated IAM user with minimal permissions
3. ✅ Test manual workflow trigger
4. ✅ Make a test commit to verify automatic deployment
5. 🔄 Monitor first deployment in Actions tab
6. 🔄 Add deployment notifications (optional)
7. 🔄 Set up staging environment (optional)

## Rollback Process

If a deployment fails or introduces bugs:

### Quick Rollback

```bash
# Find previous successful deployment commit
git log --oneline

# Revert to previous version
git revert <commit-hash>
git push origin main
```

### Manual Rollback

```bash
# Backend
aws lambda update-function-code \
  --function-name oshawa-skills-api \
  --s3-bucket oshawa-skills-frontend-7712 \
  --s3-key lambda/lambda-deployment-backup.zip

# Frontend
aws s3 sync s3://oshawa-skills-frontend-7712-backup/ s3://oshawa-skills-frontend-7712/
```

## Support

For issues with:
- **GitHub Actions**: Check Actions tab logs
- **AWS Permissions**: Review IAM policy and user permissions
- **Build Errors**: Verify local build works first (`npm run build`)
- **Deployment Failures**: Check AWS CloudWatch logs

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/)
- [AWS Lambda Deployment](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-package.html)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
