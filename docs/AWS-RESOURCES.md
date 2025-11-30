# AWS Resources Inventory

This document tracks all AWS resources and permissions for the Oshawa Skills Exchange Marketplace project.

**Last Updated:** November 30, 2025

---

## 📊 Resource Overview

| Service | Resource Name | Purpose | Status |
|---------|---------------|---------|--------|
| S3 | oshawa-skills-frontend-7712 | Frontend hosting | ✅ Active |
| S3 | oshawa-skills-certifications | Certificate PDFs | ✅ Active |
| DynamoDB | oshawa-skills | Skills data | ✅ Active |
| DynamoDB | oshawa-user-profiles | User profiles | ✅ Active |
| DynamoDB | oshawa-certifications | Certifications | ✅ Active |
| Lambda | oshawa-skills-api | Backend API | ✅ Active |
| API Gateway | tp4jmb4vd3 | REST API | ✅ Active |
| Cognito | us-east-1_scg9Zyunx | User authentication | ✅ Active |
| IAM Role | OshawaSkillsLambdaRole | Lambda execution | ✅ Active |
| SES | Email verification | Notifications | ⚠️ Sandbox |

---

## 🗄️ DynamoDB Tables

### 1. oshawa-skills
**Purpose:** Store skill listings posted by users

| Attribute | Type | Key Type | Description |
|-----------|------|----------|-------------|
| skillId | String | HASH (PK) | Unique skill identifier |
| title | String | - | Skill title |
| description | String | - | Skill description |
| userName | String | - | Poster's name |
| userEmail | String | - | Poster's email |
| category | String | - | Skill category |
| location | String | - | Geographic location |
| isAvailable | Boolean | - | Availability status |
| isCertified | Boolean | - | **NEW:** Certified provider status |
| createdAt | String | - | Creation timestamp (ISO) |
| updatedAt | String | - | Last update timestamp |

**Billing:** PAY_PER_REQUEST  
**Indexes:** None  
**Estimated Size:** ~10 items

---

### 2. oshawa-user-profiles
**Purpose:** Store user profile information and certification status

| Attribute | Type | Key Type | Description |
|-----------|------|----------|-------------|
| userId | String | HASH (PK) | Cognito user sub (UUID) |
| email | String | - | User email (immutable) |
| name | String | - | Full name (immutable) |
| phoneNumber | String | - | Phone number (optional) |
| address | String | - | Residential address (optional) |
| dateOfBirth | String | - | Date of birth (optional) |
| isCertified | Boolean | - | Certification status |
| certifiedSkills | Array | - | List of certified categories |
| createdAt | String | - | Profile creation timestamp |
| updatedAt | String | - | Last update timestamp |

**Billing:** PAY_PER_REQUEST  
**Indexes:** None  
**Estimated Size:** ~5 items

---

### 3. oshawa-certifications
**Purpose:** Store certification requests and approvals

| Attribute | Type | Key Type | Description |
|-----------|------|----------|-------------|
| certificationId | String | HASH (PK) | Unique cert identifier |
| userId | String | GSI HASH | User who uploaded |
| userEmail | String | - | User email |
| userName | String | - | User name |
| skillCategory | String | - | Related skill category |
| certificateType | String | - | degree/training/professional |
| certificateTitle | String | - | Certificate title |
| issuingOrganization | String | - | Issuing organization |
| issueDate | String | - | Issue date (YYYY-MM-DD) |
| documentUrl | String | - | S3 presigned URL (temp) |
| documentKey | String | - | S3 object key |
| fileSize | Number | - | File size in bytes |
| status | String | GSI HASH | pending/approved/rejected |
| reviewedBy | String | - | Admin email (if reviewed) |
| reviewedAt | String | - | Review timestamp |
| rejectionReason | String | - | Reason if rejected |
| uploadedAt | String | GSI RANGE | Upload timestamp |
| createdAt | String | - | Creation timestamp |

**Billing:** PAY_PER_REQUEST  
**Global Secondary Indexes:**
- **userId-index:** HASH=userId, RANGE=uploadedAt, Projection=ALL
- **status-index:** HASH=status, RANGE=uploadedAt, Projection=ALL

**Estimated Size:** ~3 items

---

## 🪣 S3 Buckets

### 1. oshawa-skills-frontend-7712
**Purpose:** Static website hosting for React frontend

**Configuration:**
- **Region:** us-east-1
- **Public Access:** Enabled (static website)
- **Versioning:** Disabled
- **Encryption:** SSE-S3 (default)
- **Website Endpoint:** http://oshawa-skills-frontend-7712.s3-website-us-east-1.amazonaws.com

**CORS:** Not required (frontend-only)

**Contents:**
- index.html
- static/js/*.js
- static/css/*.css
- asset-manifest.json

**Deployment:** Automated via GitHub Actions (`aws s3 sync build/`)

---

### 2. oshawa-skills-certifications
**Purpose:** Secure storage for user-uploaded PDF certificates

**Configuration:**
- **Region:** us-east-1
- **Public Access:** BLOCKED (private bucket)
- **Versioning:** Disabled
- **Encryption:** SSE-S3
- **Access:** Presigned URLs only (15-min expiry for viewing, 5-min for upload)

**CORS Configuration:**
```json
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedOrigins": ["*"],
  "ExposeHeaders": ["ETag"]
}
```

**File Structure:**
```
certs/
  └── {userId}/
      └── {timestamp}-{filename}.pdf
```

**Lifecycle Policy:** Not configured (consider adding 90-day deletion for rejected certs)

---

## ⚡ Lambda Function

### oshawa-skills-api
**Purpose:** Serverless backend API for all operations

**Configuration:**
- **Runtime:** Node.js 18.x
- **Handler:** index.handler
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **Architecture:** x86_64
- **Package Size:** ~23.6 MB (includes node_modules)

**Environment Variables:**
```
AWS_REGION=us-east-1
SKILLS_TABLE=oshawa-skills
PROFILES_TABLE=oshawa-user-profiles
CERTIFICATIONS_TABLE=oshawa-certifications
CERTIFICATIONS_BUCKET=oshawa-skills-certifications
USER_POOL_ID=us-east-1_scg9Zyunx
SES_SENDER_EMAIL=noreply@oshawaskills.com
```

**Execution Role:** OshawaSkillsLambdaRole

**Deployment:** GitHub Actions via `aws lambda update-function-code`

---

## 🌐 API Gateway

### Skills Exchange API
**API ID:** tp4jmb4vd3  
**Type:** REST API  
**Region:** us-east-1

**Endpoint:** https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod

**Routes:**

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | /health | healthCheck | Public |
| OPTIONS | /* | corsHandler | Public |
| GET | /api/skills | getSkills | Public |
| GET | /api/skills/{id} | getSkill | Public |
| POST | /api/skills | createSkill | JWT |
| PUT | /api/skills/{id} | updateSkill | JWT |
| DELETE | /api/skills/{id} | deleteSkill | JWT |
| GET | /api/skills/search | searchSkills | Public |
| GET | /api/profile | getProfile | JWT |
| PUT | /api/profile | updateProfile | JWT |
| POST | /api/certifications | uploadCertification | JWT |
| GET | /api/certifications | getUserCertifications | JWT |
| DELETE | /api/certifications/{id} | deleteCertification | JWT |
| GET | /api/admin/certifications | getPendingCertifications | Admin |
| GET | /api/admin/certifications/approved | getApprovedCertifications | Admin |
| POST | /api/admin/certifications/{id}/approve | approveCertification | Admin |
| POST | /api/admin/certifications/{id}/reject | rejectCertification | Admin |
| DELETE | /api/admin/certifications/{id} | deleteApprovedCertification | Admin |
| DELETE | /api/admin/skills/{id} | deleteSkillByAdmin | Admin |

**CORS:** Enabled for all origins  
**Integration:** Lambda Proxy  
**Stage:** prod  
**Logging:** CloudWatch Logs enabled

---

## 🔐 IAM Roles & Policies

### OshawaSkillsLambdaRole
**ARN:** arn:aws:iam::603908929131:role/OshawaSkillsLambdaRole  
**Type:** Lambda execution role

**Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

**Attached Policies:**

#### 1. AWSLambdaBasicExecutionRole (AWS Managed)
- CloudWatch Logs write permissions
- Log group creation

#### 2. DynamoDBAccess (Inline Policy)
**Purpose:** Full CRUD access to all DynamoDB tables and indexes

**Permissions Granted:**
- `dynamodb:GetItem` - Read single items by primary key
- `dynamodb:PutItem` - Create new items or replace existing ones
- `dynamodb:UpdateItem` - Modify specific attributes of existing items
- `dynamodb:DeleteItem` - Remove items from tables
- `dynamodb:Scan` - Read all items in table (used for admin views, skill listings)
- `dynamodb:Query` - Efficient reads using primary key or GSI (pending certs, approved certs)

**Resources Protected:**
- `arn:aws:dynamodb:us-east-1:*:table/oshawa-skills` - All marketplace skills
- `arn:aws:dynamodb:us-east-1:*:table/oshawa-skills/index/*` - Skills table indexes (if added)
- `arn:aws:dynamodb:us-east-1:*:table/oshawa-user-profiles` - User profile data
- `arn:aws:dynamodb:us-east-1:*:table/oshawa-user-profiles/index/*` - Profile indexes (if added)
- `arn:aws:dynamodb:us-east-1:*:table/oshawa-certifications` - Certification requests
- `arn:aws:dynamodb:us-east-1:*:table/oshawa-certifications/index/*` - userId-index, status-index GSIs

**Policy JSON:**
```json
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
    "Resource": [
      "arn:aws:dynamodb:us-east-1:*:table/oshawa-skills",
      "arn:aws:dynamodb:us-east-1:*:table/oshawa-skills/index/*",
      "arn:aws:dynamodb:us-east-1:*:table/oshawa-user-profiles",
      "arn:aws:dynamodb:us-east-1:*:table/oshawa-user-profiles/index/*",
      "arn:aws:dynamodb:us-east-1:*:table/oshawa-certifications",
      "arn:aws:dynamodb:us-east-1:*:table/oshawa-certifications/index/*"
    ]
  }]
}
```

**Use Cases:**
- Skills: Create, read, update, delete marketplace listings; scan all skills for admin
- Profiles: Create/update user profiles; read for certification approval
- Certifications: Upload requests; query pending/approved via GSI; admin CRUD operations

#### 3. AmazonSESFullAccess (AWS Managed Policy)
**Purpose:** Send email notifications to users

**Permissions Granted:**
- `ses:SendEmail` - Send formatted emails
- `ses:SendRawEmail` - Send emails with attachments (not used)
- `ses:VerifyEmailIdentity` - Verify sender email addresses
- `ses:GetSendQuota` - Check daily sending limits
- `ses:GetSendStatistics` - View email delivery metrics
- Full SES access (all actions on all SES resources)

**Current Usage:**
- Certification approval emails to users
- Certification rejection emails with reason
- Sender: noreply@oshawaskills.com

**Least Privilege Alternative (Recommended for Production):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ],
    "Resource": "arn:aws:ses:us-east-1:603908929131:identity/noreply@oshawaskills.com"
  }]
}
```

#### 4. AmazonS3FullAccess (AWS Managed Policy)
**Purpose:** Store and retrieve PDF certificates

**Permissions Granted:**
- `s3:ListBucket` - List objects in buckets
- `s3:GetObject` - Download/read certificate PDFs
- `s3:PutObject` - Upload certificate PDFs
- `s3:DeleteObject` - Remove certificates (rejection, admin delete)
- `s3:GetBucketCORS` - Read CORS configuration
- `s3:PutBucketCORS` - Modify CORS rules (not used in Lambda)
- Full S3 access (all actions on all buckets)

**Current Usage:**
- Generate presigned URLs for certificate upload (5-min expiry)
- Generate presigned URLs for certificate viewing (15-min expiry)
- Delete certificates on rejection or admin deletion
- Bucket: oshawa-skills-certifications

**Least Privilege Alternative (Recommended for Production):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ],
    "Resource": "arn:aws:s3:::oshawa-skills-certifications/*"
  }]
}
```

**⚠️ Security Note:** Currently using AWS managed policy for simplicity. For production, replace with least privilege policy above to restrict access to only the certifications bucket.

---

## 👤 Cognito User Pool

### oshawa-skills-user-pool
**Pool ID:** us-east-1_scg9Zyunx  
**Region:** us-east-1  
**ARN:** arn:aws:cognito-idp:us-east-1:603908929131:userpool/us-east-1_scg9Zyunx

**Configuration:**
- **Sign-in:** Email only
- **MFA:** Disabled
- **Password Policy:** 
  - Minimum length: 8
  - Require uppercase, lowercase, numbers, symbols
- **Email Verification:** Required on signup
- **Email Delivery:** Cognito (default)

**App Client:**
- **Client ID:** 20hgcdbh0mkddk44uuh9e3c0sj
- **Client Secret:** None (public client)
- **Auth Flows:** USER_PASSWORD_AUTH enabled

**User Groups:**

| Group Name | Description | Members |
|------------|-------------|---------||
| Admins | Certification reviewers & content managers | nwokehenry90@gmail.com, fadiloderinu@gmail.com* |

**Custom Attributes:** None (using standard attributes)

**Triggers:** None configured

**Adding Admin Users:**
After a user registers, add them to the Admins group:
```powershell
aws cognito-idp admin-add-user-to-group `
  --user-pool-id us-east-1_scg9Zyunx `
  --username <email@example.com> `
  --group-name Admins
```

*\*fadiloderinu@gmail.com must register first before being added to Admins group.*

---

## 📧 Amazon SES

### Email Identities

| Email Address | Status | Purpose |
|---------------|--------|---------|
| noreply@oshawaskills.com | ⚠️ Pending Verification | Sender for notifications |
| nwokehenry90@gmail.com | ⚠️ Pending Verification | Admin notifications |

**Account Status:** SANDBOX  
**Sending Limit:** 200 emails/day, 1 email/second

**Template Types:**
- Certification Approval
- Certification Rejection

**⚠️ Action Required:** 
1. Verify email identities in AWS Console
2. Request production access for unlimited sending

---

## 🔄 GitHub Actions Secrets

**Required for CI/CD:**

| Secret Name | Description | Used In |
|-------------|-------------|---------|
| AWS_ACCESS_KEY_ID | AWS access key | Backend + Frontend deploy |
| AWS_SECRET_ACCESS_KEY | AWS secret key | Backend + Frontend deploy |
| REACT_APP_COGNITO_USER_POOL_ID | Cognito pool ID | Frontend build |
| REACT_APP_COGNITO_CLIENT_ID | Cognito client ID | Frontend build |
| REACT_APP_API_ENDPOINT | API Gateway URL | Frontend build |

**Workflow:** `.github/workflows/deploy.yml`

---

## 💰 Cost Estimates

**Monthly Costs (Low Usage):**

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| S3 (Frontend) | 1 GB storage + 1000 requests | $0.05 |
| S3 (Certs) | 100 MB storage + 100 requests | $0.01 |
| DynamoDB | PAY_PER_REQUEST, <1M reads/writes | $0.50 |
| Lambda | 100K invocations, 256MB, 1s avg | $0.20 |
| API Gateway | 100K requests | $0.35 |
| Cognito | <50 MAU | FREE |
| SES | <100 emails | FREE (sandbox) |
| **Total** | | **~$1.11/month** |

**Free Tier Coverage:**
- Lambda: 1M free requests/month
- DynamoDB: 25 GB storage + 25 RCU/WCU
- S3: 5 GB storage + 20K GET, 2K PUT
- API Gateway: 1M free requests (first 12 months)

---

## 📋 Resource Cleanup Checklist

**To delete all resources:**

```powershell
# 1. Empty and delete S3 buckets
aws s3 rm s3://oshawa-skills-frontend-7712 --recursive
aws s3api delete-bucket --bucket oshawa-skills-frontend-7712

aws s3 rm s3://oshawa-skills-certifications --recursive
aws s3api delete-bucket --bucket oshawa-skills-certifications

# 2. Delete Lambda function
aws lambda delete-function --function-name oshawa-skills-api

# 3. Delete API Gateway
aws apigateway delete-rest-api --rest-api-id tp4jmb4vd3

# 4. Delete DynamoDB tables
aws dynamodb delete-table --table-name oshawa-skills
aws dynamodb delete-table --table-name oshawa-user-profiles
aws dynamodb delete-table --table-name oshawa-certifications

# 5. Delete Cognito User Pool
aws cognito-idp delete-user-pool --user-pool-id us-east-1_scg9Zyunx

# 6. Delete IAM role (detach policies first)
aws iam delete-role-policy --role-name OshawaSkillsLambdaRole --policy-name DynamoDBAccess
aws iam detach-role-policy --role-name OshawaSkillsLambdaRole --policy-arn arn:aws:iam::aws:policy/AWSLambdaBasicExecutionRole
aws iam detach-role-policy --role-name OshawaSkillsLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
aws iam detach-role-policy --role-name OshawaSkillsLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam delete-role --role-name OshawaSkillsLambdaRole

# 7. Delete SES email identities (optional)
aws ses delete-identity --identity noreply@oshawaskills.com
```

---

## 🔍 Monitoring & Logs

**CloudWatch Log Groups:**
- `/aws/lambda/oshawa-skills-api` - Lambda execution logs
- Retention: 7 days (default)

**Metrics to Monitor:**
- Lambda invocations, errors, duration
- API Gateway 4xx/5xx errors
- DynamoDB read/write throttling
- S3 bucket size

**Alarms:** Not configured (consider adding for production)

---

## 🛡️ Security Checklist

- [x] S3 certifications bucket is private
- [x] DynamoDB tables have encryption at rest (default)
- [x] Lambda uses least privilege IAM role
- [x] API Gateway has CORS configured
- [x] Cognito enforces strong passwords
- [x] JWT tokens used for authentication
- [x] Admin routes require group membership
- [ ] CloudFront for HTTPS (optional)
- [ ] WAF for API protection (optional)
- [ ] VPC for Lambda (optional)

---

**Document Maintained By:** Development Team  
**Review Frequency:** After each deployment  
**Last Audit:** November 30, 2025
