# Oshawa Skills Exchange - Deployment Information

## Live Application URLs

**Frontend (S3):** http://oshawa-skills-frontend-7712.s3-website-us-east-1.amazonaws.com  
**API Gateway:** https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod

## AWS Resources

### Authentication
- **Cognito User Pool ID:** us-east-1_scg9Zyunx
- **Cognito Client ID:** 52dla76gop36fgf27060uu44up
- **Region:** us-east-1

### Database
- **DynamoDB Table:** oshawa-skills
- **Billing Mode:** PAY_PER_REQUEST
- **Partition Key:** skillId (String)
- **Sort Key:** timestamp (Number)

### Compute
- **Lambda Function:** oshawa-skills-api
- **Runtime:** Node.js 18.x
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **ARN:** arn:aws:lambda:us-east-1:603908929131:function:oshawa-skills-api

### API
- **API Gateway ID:** tp4jmb4vd3
- **Stage:** prod
- **Integration:** AWS_PROXY with Lambda
- **Endpoint:** https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod

### Storage
- **S3 Bucket:** oshawa-skills-frontend-7712
- **Website Hosting:** Enabled
- **Public Access:** Enabled via bucket policy
- **Index Document:** index.html
- **Error Document:** index.html (for SPA routing)

## Deployment Date
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Testing the Application

1. **Access the Frontend:** 
   - Open http://oshawa-skills-frontend-7712.s3-website-us-east-1.amazonaws.com in your browser

2. **Register a New User:**
   - Click "Sign Up"
   - Enter email, password, full name
   - Check your email for verification code
   - Complete email verification

3. **Sign In:**
   - Use your verified email and password
   - You'll be redirected to the Skills Marketplace

4. **Post a Skill:**
   - Click "Post a Skill" button
   - Fill out the skill details form
   - Submit to add to the marketplace

5. **Browse Skills:**
   - View all posted skills on the marketplace page
   - Use search and filters to find specific skills

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/skills` - List all skills
- `POST /api/skills` - Create a new skill
- `GET /api/skills/{skillId}` - Get skill by ID
- `PUT /api/skills/{skillId}` - Update a skill
- `DELETE /api/skills/{skillId}` - Delete a skill
- `GET /api/skills/search?q={query}` - Search skills

## Troubleshooting

### Cannot Sign Up/Sign In
- Verify Cognito User Pool is active in AWS Console
- Check that the app client ID matches in frontend `.env.production`
- Ensure email verification is completed before signing in

### Skills Not Loading
- Test API endpoint: `curl https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod/api/health`
- Check Lambda function logs in CloudWatch
- Verify DynamoDB table permissions in IAM role

### Frontend Not Loading
- Verify S3 bucket policy allows public read access
- Check that static website hosting is enabled
- Ensure all files were uploaded correctly

## Updating the Application

### Update Frontend
```powershell
cd frontend
npm run build
aws s3 sync build/ s3://oshawa-skills-frontend-7712 --delete
```

### Update Backend
```powershell
cd backend
npm run build
# Create lambda package with dist/* and node_modules
aws lambda update-function-code --function-name oshawa-skills-api --zip-file fileb://skills-lambda.zip
```

## Cost Estimation

With AWS Free Tier:
- **S3:** First 5GB free, $0.023/GB thereafter
- **Lambda:** 1M requests + 400,000 GB-seconds free per month
- **API Gateway:** 1M requests free for 12 months
- **DynamoDB:** 25GB storage + 25 WCU/RCU free
- **Cognito:** 50,000 MAU free

Estimated monthly cost after free tier: $1-5 for light usage

## Security Notes

- Frontend uses PUBLIC Cognito app client (no client secret)
- All API calls are proxied through API Gateway
- Cognito handles user authentication and session management
- DynamoDB access restricted to Lambda execution role
- S3 bucket has public read access for static website hosting

## Next Steps

- Set up custom domain with Route 53
- Add CloudFront CDN for faster content delivery
- Configure HTTPS for S3 with CloudFront
- Set up CloudWatch alarms for monitoring
- Implement CI/CD pipeline with GitHub Actions
- Add more features: messaging, ratings, user profiles
