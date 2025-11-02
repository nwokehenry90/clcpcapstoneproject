# Local Skills Exchange Marketplace - Copilot Instructions

This workspace contains a cloud-native web application for peer-to-peer skill sharing in the Oshawa community:

## Architecture
- **Frontend**: React.js SPA hosted on AWS S3
- **Backend**: Node.js Lambda functions
- **Database**: DynamoDB for skills and user data
- **API**: API Gateway for RESTful endpoints
- **Email**: AWS SES for notifications (optional)
- **Auth**: AWS Cognito for user management (optional)

## Development Guidelines
- Use vanilla JavaScript/JSX for React components
- Use Axios for HTTP requests with JSON payloads
- Follow serverless best practices for Lambda functions
- Implement proper error handling and logging
- Use CSS/Tailwind for responsive design
- Manual AWS setup via CLI/Console (no CDK/Amplify)

## Project Structure
- `/frontend` - React application with skill marketplace UI
- `/backend` - Lambda functions for skill CRUD operations
- `/shared` - Common utilities and types
- `/docs` - AWS setup instructions and deployment guides

## Key Features
- Skill posting and browsing
- User profiles and skill exchange
- Community-focused local marketplace
- Real-time skill discovery
- Trust-based peer connections

## Technologies
- React.js with JavaScript/JSX
- Axios for API communication
- AWS Lambda (Node.js)
- DynamoDB for data persistence
- API Gateway for REST endpoints
- S3 for static hosting
- Optional: SES, Cognito, CloudFront