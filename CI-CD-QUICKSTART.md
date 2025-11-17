# CI/CD Pipeline - Quick Start

✅ **CI/CD pipeline has been successfully added to your project!**

## What Was Added

1. **`.github/workflows/deploy.yml`** - GitHub Actions workflow that automatically deploys on push to main
2. **`docs/CI-CD-SETUP.md`** - Comprehensive setup and configuration guide
3. **`docs/ci-cd-policy.json`** - IAM policy for GitHub Actions deployer user
4. **`setup-github-secrets.ps1`** - PowerShell helper script for configuration

## How It Works

Every time you push to the `main` branch:

1. **Backend Deployment** (5-8 minutes):
   - Installs dependencies
   - Compiles TypeScript
   - Creates Lambda deployment package
   - Uploads to S3
   - Updates Lambda function

2. **Frontend Deployment** (3-5 minutes):
   - Installs dependencies
   - Builds React app with production config
   - Syncs to S3 bucket
   - Invalidates CloudFront cache (if configured)

## Before First Deployment

You need to configure 5 GitHub secrets. Run the helper script to see instructions:

```powershell
.\setup-github-secrets.ps1
```

Or manually add secrets at:
https://github.com/nwokehenry90/clcpcapstoneproject/settings/secrets/actions

### Required Secrets

| Secret Name | Value |
|------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key (create dedicated IAM user) |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `REACT_APP_COGNITO_USER_POOL_ID` | `us-east-1_scg9Zyunx` |
| `REACT_APP_COGNITO_CLIENT_ID` | `52dla76gop36fgf27060uu44up` |
| `REACT_APP_API_ENDPOINT` | `https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod` |

## Quick Setup (3 Steps)

### Step 1: Create IAM User

```bash
aws iam create-user --user-name github-actions-deployer
```

### Step 2: Attach Policy

```bash
aws iam create-policy \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://docs/ci-cd-policy.json

aws iam attach-user-policy \
  --user-name github-actions-deployer \
  --policy-arn arn:aws:iam::603908929131:policy/GitHubActionsDeployPolicy
```

### Step 3: Create Access Keys

```bash
aws iam create-access-key --user-name github-actions-deployer
```

**Important**: Save the `AccessKeyId` and `SecretAccessKey` from the output!

## Add Secrets to GitHub

### Option A: GitHub Web Interface

1. Go to: https://github.com/nwokehenry90/clcpcapstoneproject/settings/secrets/actions
2. Click "New repository secret"
3. Add each of the 5 secrets listed above

### Option B: GitHub CLI (if installed)

```bash
gh auth login
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set REACT_APP_COGNITO_USER_POOL_ID -b "us-east-1_scg9Zyunx"
gh secret set REACT_APP_COGNITO_CLIENT_ID -b "52dla76gop36fgf27060uu44up"
gh secret set REACT_APP_API_ENDPOINT -b "https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod"
```

## Test the Pipeline

Once secrets are configured, test the pipeline:

```bash
# Make a small change
echo "# CI/CD Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

Then watch the deployment:
1. Go to: https://github.com/nwokehenry90/clcpcapstoneproject/actions
2. Click on your commit's workflow run
3. Watch the progress in real-time

## What to Expect

### Successful Deployment

```
✅ Backend deployed successfully
✅ Frontend deployed successfully
✅ Site updated at: http://oshawa-skills-frontend-7712.s3-website-us-east-1.amazonaws.com
```

### Deployment Time

- **First run**: ~8-10 minutes (no cache)
- **Subsequent runs**: ~5-8 minutes (with cache)

## Manual Deployment Trigger

You can also manually trigger deployment from GitHub:

1. Go to: https://github.com/nwokehenry90/clcpcapstoneproject/actions
2. Click "Deploy to AWS" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## Monitoring

### View Logs

All deployment logs are available in GitHub Actions:
- Build output
- Test results (when added)
- Deployment confirmations
- Error messages (if any)

### Deployment Status Badge

Add to your README.md:

```markdown
![Deploy Status](https://github.com/nwokehenry90/clcpcapstoneproject/actions/workflows/deploy.yml/badge.svg)
```

## Troubleshooting

### Common Issues

**"Error: Secrets not found"**
- Ensure all 5 secrets are added to GitHub
- Check secret names match exactly (case-sensitive)

**"Error: Access denied"**
- Verify IAM policy is attached to user
- Check AWS credentials are correct

**"Build failed"**
- Check build works locally: `npm run build`
- Review error logs in GitHub Actions

**"Lambda update failed"**
- Ensure Lambda function exists
- Verify IAM permissions include `lambda:UpdateFunctionCode`

## Next Steps

After successful deployment:

1. ✅ Add deployment status badge to README
2. ✅ Set up deployment notifications (Slack/email)
3. ✅ Create staging environment for testing
4. ✅ Add automated tests to pipeline
5. ✅ Configure CloudFront for faster delivery

## Resources

- **Full Documentation**: `docs/CI-CD-SETUP.md`
- **Workflow File**: `.github/workflows/deploy.yml`
- **IAM Policy**: `docs/ci-cd-policy.json`
- **GitHub Actions**: https://github.com/nwokehenry90/clcpcapstoneproject/actions

## Security Best Practices

✅ Use dedicated IAM user (not root account)
✅ Minimal permissions (principle of least privilege)
✅ Secrets stored securely in GitHub (encrypted)
✅ Never commit AWS credentials to code
✅ Rotate access keys periodically

---

**Need Help?** See the comprehensive guide in `docs/CI-CD-SETUP.md`
