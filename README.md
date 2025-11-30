# Local Skills Exchange Marketplace - Oshawa

A cloud-native peer-to-peer skill sharing web application for the Oshawa community.

## 🏗️ Architecture

- **Frontend**: React 18 (TypeScript) - Static hosting on AWS S3
- **Backend**: Node.js Lambda functions - Serverless API
- **Database**: DynamoDB - NoSQL storage (skills, profiles, certifications)
- **Storage**: AWS S3 - Certificate document storage (PDF)
- **API**: API Gateway - RESTful endpoints
- **Auth**: AWS Cognito User Pool - Email-based authentication with role groups
- **Email**: AWS SES - Certification approval/rejection notifications
- **CI/CD**: GitHub Actions - Automated deployment pipeline

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS Account with CLI configured
- Git

### Frontend Setup

```powershell
cd frontend
npm install
npm start
```

The app runs at http://localhost:3000

### Environment Variables

Create `frontend/.env`:

```env
REACT_APP_COGNITO_USER_POOL_ID=your-user-pool-id
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_API_BASE_URL=https://your-api-gateway-url.com/api
```

### Backend Setup

```powershell
cd backend
npm install
npm run build
```

## 📋 Features

### ✅ Completed

**Marketplace & Skills:**
- Browse skills marketplace with search and category filters
- Post new skills with validation (authenticated users only)
- Skills CRUD operations with DynamoDB backend
- Real-time skill discovery
- **Certified provider badges** - Green "Certified" badge next to verified skill providers

**Authentication & Authorization:**
- User registration with email verification (AWS Cognito)
- Sign in/Sign out with secure session management
- Protected routes for authenticated features
- **Role-based access control** - Admin group for certification management
- JWT token authentication throughout the application

**User Profile Management:**
- Complete profile page with personal information
- Edit phone number, address, and date of birth
- Change password functionality via Cognito
- View and manage submitted certifications
- **Real-time certification status tracking** (pending/approved/rejected counts)

**Skill Provider Certification System:**
- Upload professional certificates (PDF only, max 5MB)
- Support for degree, training, and professional certificates
- Certificate metadata: title, organization, issue date, skill category
- Secure S3 storage with pre-signed URLs for viewing
- Automatic user profile updates upon approval
- **Certified badge automatically applied to all user's skills**

**Admin Dashboard (Full Content Management):**
- **Pending Certifications Review:**
  - View all pending certification requests
  - Preview uploaded PDF certificates
  - Approve certifications (updates user profile, all skills, sends email)
  - Reject certifications with minimum 10-character reason (deletes cert, sends email)
- **Approved Certifications Management:**
  - View all approved certifications in dedicated section
  - Delete approved certifications (removes certified status from profile and all skills)
  - Track approval dates and reviewing admin
- **Marketplace Skills Management:**
  - View all skills posted in the marketplace
  - See skill details: title, description, poster info, category, location, status
  - Identify certified providers with badge indicators
  - Delete any skill from the marketplace with confirmation
  - Full CRUD operations on marketplace content
- Admin-only access via backend API validation
- Real-time status updates

**Email Notifications:**
- Certification approval emails to users
- Certification rejection emails with detailed reason
- AWS SES integration (requires email verification)

**Infrastructure & DevOps:**
- Responsive UI with Tailwind CSS
- Complete DynamoDB integration (3 tables with GSIs)
- **GitHub Actions CI/CD pipeline** - Automated build and deployment
- S3 static hosting with automated sync
- Lambda function deployment automation
- Secure CORS configuration for S3 certificate uploads

## 🏃 Development Workflow

### Run Frontend Dev Server

```powershell
cd frontend
npm start
```

### Build Frontend for Production

```powershell
cd frontend
npm run build
```

Output: `frontend/build/`

### Test Backend Locally

```powershell
cd backend
npm run build
npm test
```

## 📁 Project Structure

```
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components (Layout, ProtectedRoute, CertifiedBadge)
│   │   ├── pages/          # Page components
│   │   │   ├── Login.tsx                # Sign in page
│   │   │   ├── Register.tsx             # Registration with email verification
│   │   │   ├── SkillsMarketplace.tsx    # Browse all skills
│   │   │   ├── PostSkill.tsx            # Create new skill (protected)
│   │   │   ├── Profile.tsx              # User profile management (Phase 2)
│   │   │   └── AdminDashboard.tsx       # Certification review (Phase 2)
│   │   ├── services/       # API services (authService, apiService)
│   │   ├── contexts/       # React contexts (AuthContext)
│   │   └── App.tsx         # Main app with routing
│   └── package.json
│
├── backend/                # Lambda functions
│   ├── src/
│   │   ├── handlers/       # Lambda handlers
│   │   │   ├── skills.ts              # Skills CRUD operations
│   │   │   ├── profile.ts             # User profile management (Phase 2)
│   │   │   ├── certifications.ts      # Certification upload/retrieval (Phase 2)
│   │   │   └── admin.ts               # Admin certification review (Phase 2)
│   │   ├── services/       # Business logic
│   │   │   ├── dynamodb.ts            # DynamoDB operations
│   │   │   ├── s3.ts                  # S3 file operations (Phase 2)
│   │   │   └── ses.ts                 # Email notifications (Phase 2)
│   │   └── index.ts        # Main Lambda entry point
│   └── package.json
│
├── shared/                 # Shared TypeScript types
│   └── src/
│       └── types.ts        # Common interfaces (Skill, Profile, Certification)
│
├── docs/                   # Documentation
│   ├── AWS-CLI-SETUP.md
│   ├── CI-CD-SETUP.md
│   └── DEPLOYMENT-GUIDE.md
│
└── .github/
    └── workflows/
        └── deploy.yml      # CI/CD pipeline configuration
```

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- React Router v6 for routing
- Tailwind CSS for styling
- Axios for HTTP requests
- amazon-cognito-identity-js for auth
- Heroicons for UI icons

### Backend
- Node.js 18+ (AWS Lambda)
- TypeScript
- AWS SDK v3 (@aws-sdk/lib-dynamodb)
- Serverless architecture

### AWS Services
- **Cognito User Pool**: User authentication and management with admin groups
- **Lambda**: Serverless compute for API
- **API Gateway**: REST API endpoints
- **DynamoDB**: NoSQL database for skills, profiles, and certifications
- **S3**: Static website hosting + certificate document storage
- **SES**: Email notifications for certification decisions
- **CloudFront** (optional): CDN for performance

## 🧪 Testing the App

### Test Authentication Flow

1. Start the frontend: `npm start` in `frontend/`
2. Navigate to http://localhost:3000
3. Click "Register" and create an account
4. Check email for verification code
5. Enter code to verify account
6. Sign in with email/password
7. Browse skills marketplace
8. Click "Post a Skill" (requires authentication)

### Test Profile & Certification Flow (Phase 2)

1. Sign in to your account
2. Click "Profile" in navigation
3. Update personal information:
   - Add phone number
   - Add residential address
   - Set date of birth
4. Change password (via Cognito)
5. Upload certification:
   - Select certificate type (Degree/Training/Professional)
   - Enter certificate title and organization
   - Select issue date and skill category
   - Upload PDF file (max 5MB)
6. View certification status (Pending/Approved/Rejected)

### Test Admin Dashboard

1. Sign in with admin account (nwokehenry90@gmail.com or fadiloderinu@gmail.com)
2. Navigate to `/admin`
3. **Pending Certifications Section:**
   - View all pending certification requests
   - Click "View PDF" to preview certificate
   - Click "Approve" to approve certification
     - User receives approval email
     - User profile updated with certified badge
     - All user's skills automatically get certified badge
   - Click "Reject" to reject certification
     - Enter rejection reason (minimum 10 characters)
     - User receives rejection email with reason
     - Certification deleted from system
4. **Approved Certifications Section:**
   - View all approved certifications
   - See approval date and reviewing admin
   - Delete approved certifications if needed
     - Removes certified status from user profile
     - Removes certified badge from all user's skills
5. **Marketplace Skills Management Section:**
   - View all skills posted in marketplace
   - See poster info, category, location, and status
   - Identify certified providers with badge indicators
   - Delete any skill from marketplace with confirmation

### Test with Demo Data

The frontend includes demo skills data that displays when the API is unavailable. This allows you to test the UI without deploying the backend.

## 📦 Deployment to AWS

### Automated CI/CD Deployment (Recommended)

Every push to `main` branch automatically deploys via GitHub Actions:

1. **Configure GitHub Secrets** (one-time setup):
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   REACT_APP_COGNITO_USER_POOL_ID
   REACT_APP_COGNITO_CLIENT_ID
   REACT_APP_API_ENDPOINT
   ```

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy changes"
   git push origin main
   ```

3. **Monitor deployment**:
   - GitHub Actions automatically builds and deploys both backend and frontend
   - View progress at: https://github.com/nwokehenry90/clcpcapstoneproject/actions

**See:** `CI-CD-QUICKSTART.md` for detailed setup instructions

### Manual Deployment

Follow step-by-step guides:
- **Full Setup**: `docs/AWS-CLI-SETUP.md` - Complete AWS infrastructure setup
- **Quick Deploy**: `DEPLOYMENT-GUIDE.md` - Fast deployment guide
- **CI/CD Setup**: `docs/CI-CD-SETUP.md` - Configure GitHub Actions

### Phase 2 Infrastructure Setup

**Additional AWS resources for certification system:**

1. **Create S3 Bucket for Certificates**:
   ```bash
   aws s3api create-bucket \
     --bucket oshawa-skills-certifications \
     --region us-east-1
   ```

2. **Create DynamoDB Tables**:
   ```bash
   # User profiles table
   aws dynamodb create-table \
     --table-name oshawa-user-profiles \
     --attribute-definitions AttributeName=userId,AttributeType=S \
     --key-schema AttributeName=userId,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST

   # Certifications table
   aws dynamodb create-table \
     --table-name oshawa-certifications \
     --attribute-definitions \
       AttributeName=certificationId,AttributeType=S \
       AttributeName=userId,AttributeType=S \
       AttributeName=status,AttributeType=S \
       AttributeName=uploadedAt,AttributeType=S \
     --key-schema AttributeName=certificationId,KeyType=HASH \
     --global-secondary-indexes \
       IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=uploadedAt,KeyType=RANGE}],Projection={ProjectionType=ALL} \
       IndexName=status-index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=uploadedAt,KeyType=RANGE}],Projection={ProjectionType=ALL} \
     --billing-mode PAY_PER_REQUEST
   ```

3. **Create Cognito Admin Group**:
   ```bash
   aws cognito-idp create-group \
     --user-pool-id us-east-1_scg9Zyunx \
     --group-name Admins \
     --description "Administrators who can approve certifications"

   # Add yourself to admin group
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_scg9Zyunx \
     --username your-email@example.com \
     --group-name Admins
   ```

4. **Configure AWS SES for Emails**:
   ```bash
   # Verify sender email
   aws ses verify-email-identity --email-address noreply@oshawaskills.com

   # Move out of sandbox (production)
   # Submit request via AWS Console: SES > Account Dashboard > Request Production Access
   ```

## 🤝 Contributing

This is a capstone project for the Oshawa community. Contributions are welcome!

### Development Roadmap

**Phase 1: Core Marketplace ✅**
- User authentication and registration
- Skills posting and browsing
- Search and filter functionality
- CI/CD pipeline

**Phase 2: Certification System ✅**
- User profile management
- Certificate upload (PDF only)
- Admin review dashboard
- Email notifications
- Certified provider badges
- Approved certifications management
- Admin marketplace skills management

**Phase 3: Future Enhancements 📝**
- User ratings and reviews
- Skill exchange tracking and messaging
- Analytics dashboard
- Advanced search filters
- CloudFront CDN integration

## 📊 Database Schema

### Current Tables

**oshawa-skills**
- Primary Key: `skillId` (String)
- Attributes: title, description, userName, userEmail, category, location, isAvailable, isCertified, createdAt, updatedAt

**oshawa-user-profiles**
- Primary Key: `userId` (String - Cognito sub)
- Attributes: email, name, phoneNumber, address, dateOfBirth, isCertified, certifiedSkills, createdAt, updatedAt

**oshawa-certifications**
- Primary Key: `certificationId` (String)
- GSI: `userId-index` (userId-uploadedAt), `status-index` (status-uploadedAt)
- Attributes: userId, userEmail, userName, skillCategory, certificateType, certificateTitle, issuingOrganization, issueDate, documentUrl, documentKey, fileSize, status, reviewedBy, reviewedAt, rejectionReason, uploadedAt, createdAt

## 🔒 Security Considerations

- **JWT token authentication** - Bearer tokens validated on all protected endpoints
- Email and full name are immutable (from Cognito)
- Certificate files stored in private S3 bucket
- Pre-signed URLs for secure PDF viewing (15-minute expiry) and upload (5-minute expiry)
- **Admin access controlled via Cognito user groups** - Backend validates group membership
- PDF file type validation (client and server-side)
- Maximum file size: 5 MB
- CORS enabled for API Gateway and S3 certificate bucket
- Protected routes require authentication
- Admin routes require Admins group membership
- IAM least privilege policies documented for production deployment

## 📚 Documentation

- **AWS-RESOURCES.md** - Complete AWS infrastructure inventory with detailed IAM permissions
- **AWS-CLI-SETUP.md** - Step-by-step AWS setup instructions
- **CI-CD-SETUP.md** - GitHub Actions pipeline configuration
- **DEPLOYMENT-GUIDE.md** - Deployment procedures

## 📄 License

MIT License - see LICENSE file for details

## 📧 Contact

For questions about this project, please contact the development team.

---

**Built with ❤️ for the Oshawa Community**
