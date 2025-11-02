# Local Skills Exchange Marketplace - Oshawa

A cloud-native peer-to-peer skill sharing web application for the Oshawa community.

## 🏗️ Architecture

- **Frontend**: React 18 (TypeScript) - Static hosting on AWS S3
- **Backend**: Node.js Lambda functions - Serverless API
- **Database**: DynamoDB - NoSQL storage for skills
- **API**: API Gateway - RESTful endpoints
- **Auth**: AWS Cognito User Pool - Email-based authentication

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

- Browse skills marketplace with search and category filters
- Post new skills with validation (authenticated users only)
- User registration with email verification
- Sign in/Sign out with AWS Cognito
- Protected routes for authenticated features
- Responsive UI with Tailwind CSS
- Skills CRUD operations (backend handlers)
- DynamoDB integration for data persistence

### 🔄 In Progress

- Backend JWT token validation
- Email contact system integration
- User profile management

### 📝 Pending

- Manual AWS deployment documentation
- Lambda function deployment scripts
- API Gateway configuration guide
- DynamoDB table setup instructions
- S3 static hosting configuration
- CloudFront distribution (optional)

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
│   │   ├── components/     # Reusable components (Layout, ProtectedRoute)
│   │   ├── pages/          # Page components (Login, Register, SkillsMarketplace, PostSkill)
│   │   ├── services/       # API services (authService)
│   │   ├── contexts/       # React contexts (AuthContext)
│   │   └── App.tsx         # Main app with routing
│   └── package.json
│
├── backend/                # Lambda functions
│   ├── src/
│   │   ├── handlers/       # Lambda handlers (skills.ts)
│   │   ├── services/       # Business logic (dynamodb.ts)
│   │   └── index.ts        # Main Lambda entry point
│   └── package.json
│
├── shared/                 # Shared TypeScript types
│   └── src/
│       └── types.ts        # Common interfaces (Skill, AuthUser, etc.)
│
└── docs/                   # Documentation (to be added)
    ├── aws-setup.md
    └── deployment.md
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
- **Cognito User Pool**: User authentication and management
- **Lambda**: Serverless compute for API
- **API Gateway**: REST API endpoints
- **DynamoDB**: NoSQL database for skills
- **S3**: Static website hosting
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

### Test with Demo Data

The frontend includes demo skills data that displays when the API is unavailable. This allows you to test the UI without deploying the backend.

## 📦 Deployment to AWS

### Option 1: Automated Deployment (Recommended)

Deploy everything with one command:

```powershell
.\deploy-aws.ps1
```

This script will:
- ✅ Create Cognito User Pool
- ✅ Create DynamoDB table
- ✅ Create IAM role and policies
- ✅ Build and deploy Lambda function
- ✅ Create API Gateway
- ✅ Create S3 bucket for hosting
- ✅ Build and deploy frontend
- ✅ Configure all connections

**Time**: ~10-15 minutes

### Option 2: Manual Step-by-Step

Follow the detailed guide: `DEPLOYMENT-GUIDE.md`

### Option 3: Individual Components

Deploy specific components:

```powershell
# Just build Lambda package
.\deploy-lambda.ps1

# Deploy without creating Cognito
.\deploy-aws.ps1 -SkipCognito

# Deploy only frontend
.\deploy-aws.ps1 -SkipCognito -SkipDynamoDB -SkipLambda -SkipAPI -SkipS3
```

## 🤝 Contributing

This is a capstone project for the Oshawa community. Contributions are welcome!

## 📄 License

MIT License - see LICENSE file for details

## 📧 Contact

For questions about this project, please contact the development team.

---

**Built with ❤️ for the Oshawa Community**
