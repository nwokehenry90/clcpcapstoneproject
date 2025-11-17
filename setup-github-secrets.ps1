# GitHub Secrets Setup Helper Script
# This script helps you configure GitHub secrets for CI/CD pipeline

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  GitHub Actions CI/CD Setup Helper" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "⚠️  GitHub CLI (gh) is not installed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You have two options:" -ForegroundColor White
    Write-Host "1. Install GitHub CLI: winget install --id GitHub.cli" -ForegroundColor White
    Write-Host "2. Add secrets manually via GitHub web interface" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual setup instructions:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/nwokehenry90/clcpcapstoneproject/settings/secrets/actions" -ForegroundColor White
    Write-Host "2. Click 'New repository secret'" -ForegroundColor White
    Write-Host "3. Add each secret listed below" -ForegroundColor White
    Write-Host ""
}

# Display current AWS configuration
Write-Host "📋 Current AWS Configuration:" -ForegroundColor Green
Write-Host "   Region: us-east-1" -ForegroundColor White
Write-Host "   Lambda: oshawa-skills-api" -ForegroundColor White
Write-Host "   S3 Bucket: oshawa-skills-frontend-7712" -ForegroundColor White
Write-Host "   Cognito Pool: us-east-1_scg9Zyunx" -ForegroundColor White
Write-Host "   Cognito Client: 52dla76gop36fgf27060uu44up" -ForegroundColor White
Write-Host "   API Endpoint: https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod" -ForegroundColor White
Write-Host ""

# Required secrets
$secrets = @{
    "REACT_APP_COGNITO_USER_POOL_ID" = "us-east-1_scg9Zyunx"
    "REACT_APP_COGNITO_CLIENT_ID" = "52dla76gop36fgf27060uu44up"
    "REACT_APP_API_ENDPOINT" = "https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod"
    "AWS_ACCESS_KEY_ID" = "<YOUR_AWS_ACCESS_KEY_ID>"
    "AWS_SECRET_ACCESS_KEY" = "<YOUR_AWS_SECRET_ACCESS_KEY>"
}

Write-Host "🔐 Required GitHub Secrets:" -ForegroundColor Green
Write-Host ""

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "   $($secret.Key)" -ForegroundColor Yellow
    Write-Host "   Value: $($secret.Value)" -ForegroundColor White
    Write-Host ""
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Create AWS IAM User for CI/CD:" -ForegroundColor Green
Write-Host "   aws iam create-user --user-name github-actions-deployer" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Create and attach IAM policy:" -ForegroundColor Green
Write-Host "   aws iam create-policy --policy-name GitHubActionsDeployPolicy --policy-document file://docs/ci-cd-policy.json" -ForegroundColor White
Write-Host "   aws iam attach-user-policy --user-name github-actions-deployer --policy-arn arn:aws:iam::603908929131:policy/GitHubActionsDeployPolicy" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Create access keys:" -ForegroundColor Green
Write-Host "   aws iam create-access-key --user-name github-actions-deployer" -ForegroundColor White
Write-Host "   (Save the AccessKeyId and SecretAccessKey from output!)" -ForegroundColor Yellow
Write-Host ""

if ($ghInstalled) {
    Write-Host "4️⃣  Add secrets using GitHub CLI:" -ForegroundColor Green
    Write-Host "   gh auth login" -ForegroundColor White
    Write-Host "   gh secret set AWS_ACCESS_KEY_ID" -ForegroundColor White
    Write-Host "   gh secret set AWS_SECRET_ACCESS_KEY" -ForegroundColor White
    Write-Host "   gh secret set REACT_APP_COGNITO_USER_POOL_ID -b 'us-east-1_scg9Zyunx'" -ForegroundColor White
    Write-Host "   gh secret set REACT_APP_COGNITO_CLIENT_ID -b '52dla76gop36fgf27060uu44up'" -ForegroundColor White
    Write-Host "   gh secret set REACT_APP_API_ENDPOINT -b 'https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod'" -ForegroundColor White
} else {
    Write-Host "4️⃣  Add secrets via GitHub web interface:" -ForegroundColor Green
    Write-Host "   URL: https://github.com/nwokehenry90/clcpcapstoneproject/settings/secrets/actions" -ForegroundColor White
}
Write-Host ""

Write-Host "5️⃣  Test the pipeline:" -ForegroundColor Green
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Add CI/CD pipeline'" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📚 For detailed instructions, see: docs/CI-CD-SETUP.md" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
