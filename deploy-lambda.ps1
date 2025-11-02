# Oshawa Skills Exchange - Quick Deploy Script
# This script builds and packages the Lambda function for AWS deployment

param(
    [switch]$Clean,
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Oshawa Skills Exchange - Lambda Deployment Package Creator" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

if ($Clean) {
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path "dist") { Remove-Item -Path "dist" -Recurse -Force }
    if (Test-Path "deploy") { Remove-Item -Path "deploy" -Recurse -Force }
    if (Test-Path "skills-lambda.zip") { Remove-Item -Path "skills-lambda.zip" -Force }
    Write-Host "✅ Cleaned!" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 2: Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

if ($BuildOnly) {
    Write-Host "✅ Build complete (package creation skipped)" -ForegroundColor Green
    exit 0
}

# Step 3: Create deployment directory
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "deploy") { Remove-Item -Path "deploy" -Recurse -Force }
New-Item -ItemType Directory -Path "deploy" -Force | Out-Null

# Copy built JavaScript files
Copy-Item -Path "dist\*" -Destination "deploy\" -Recurse -Force

# Step 4: Install production dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
$tempNodeModules = "node_modules.backup"
if (Test-Path "node_modules") {
    Move-Item -Path "node_modules" -Destination $tempNodeModules -Force
}

npm install --production --no-optional
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install production dependencies" -ForegroundColor Red
    if (Test-Path $tempNodeModules) {
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Move-Item -Path $tempNodeModules -Destination "node_modules" -Force
    }
    exit 1
}

# Copy production node_modules to deploy folder
Copy-Item -Path "node_modules" -Destination "deploy\node_modules" -Recurse -Force

# Restore original node_modules
Remove-Item -Path "node_modules" -Recurse -Force
if (Test-Path $tempNodeModules) {
    Move-Item -Path $tempNodeModules -Destination "node_modules" -Force
}

Write-Host "✅ Dependencies packaged!" -ForegroundColor Green
Write-Host ""

# Step 5: Create ZIP file
Write-Host "🗜️  Creating ZIP archive..." -ForegroundColor Yellow
if (Test-Path "skills-lambda.zip") { Remove-Item -Path "skills-lambda.zip" -Force }

# Change to deploy directory to zip contents without the folder
Set-Location "deploy"
Compress-Archive -Path "*" -DestinationPath "..\skills-lambda.zip" -CompressionLevel Optimal -Force
Set-Location ".."

$zipSize = (Get-Item "skills-lambda.zip").Length / 1MB
Write-Host "✅ ZIP created: skills-lambda.zip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Step 6: Cleanup
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path "deploy" -Recurse -Force
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Final output
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "✨ Deployment package ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Package: " -NoNewline -ForegroundColor White
Write-Host "backend\skills-lambda.zip" -ForegroundColor Cyan
Write-Host "📊 Size: " -NoNewline -ForegroundColor White
Write-Host "$([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Yellow
Write-Host "1. Follow the AWS CLI setup guide in docs\AWS-CLI-SETUP.md" -ForegroundColor White
Write-Host "2. Create Lambda function or update existing one:" -ForegroundColor White
Write-Host ""
Write-Host "   # Create new function:" -ForegroundColor Gray
Write-Host '   aws lambda create-function \' -ForegroundColor Gray
Write-Host '     --function-name oshawa-skills-api \' -ForegroundColor Gray
Write-Host '     --runtime nodejs18.x \' -ForegroundColor Gray
Write-Host '     --role <YOUR_ROLE_ARN> \' -ForegroundColor Gray
Write-Host '     --handler index.handler \' -ForegroundColor Gray
Write-Host '     --zip-file fileb://skills-lambda.zip \' -ForegroundColor Gray
Write-Host '     --timeout 30 \' -ForegroundColor Gray
Write-Host '     --memory-size 256 \' -ForegroundColor Gray
Write-Host '     --environment Variables="{SKILLS_TABLE_NAME=oshawa-skills}"' -ForegroundColor Gray
Write-Host ""
Write-Host "   # Update existing function:" -ForegroundColor Gray
Write-Host '   aws lambda update-function-code \' -ForegroundColor Gray
Write-Host '     --function-name oshawa-skills-api \' -ForegroundColor Gray
Write-Host '     --zip-file fileb://skills-lambda.zip' -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
