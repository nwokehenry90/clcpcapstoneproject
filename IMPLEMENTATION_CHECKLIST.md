# Certification System Implementation Checklist

## ✅ COMPLETED (Backend & Infrastructure)

### AWS Infrastructure
- [x] S3 bucket created: `oshawa-skills-certifications`
- [x] DynamoDB table: `oshawa-user-profiles` (userId)
- [x] DynamoDB table: `oshawa-certifications` (certificationId, GSI: userId-index, status-index)
- [x] Cognito group: `Admins`

### Backend Code (100% Complete)
- [x] Types defined: `backend/src/types/index.ts`
- [x] SES service: `backend/src/services/ses.ts`
- [x] S3 service updated: `backend/src/services/s3.ts`
- [x] DynamoDB services: ProfileService, CertificationService
- [x] Profile handler: `backend/src/handlers/profile.ts`
- [x] Certifications handler: `backend/src/handlers/certifications.ts`
- [x] Admin handler: `backend/src/handlers/admin.ts`
- [x] Routing updated: `backend/src/index.ts`
- [x] Dependencies installed: @aws-sdk/client-ses, @aws-sdk/s3-request-presigner
- [x] TypeScript compilation: ✅ No errors

### Frontend Components (50% Complete)
- [x] `frontend/src/components/CertifiedBadge.tsx`
- [x] `frontend/src/components/CertificationCard.tsx`
- [x] `frontend/src/components/CertificationUpload.tsx`
- [x] `frontend/src/services/apiService.ts`

---

## 📋 REMAINING TASKS

### 1. Frontend Pages (Required)

#### A. ProfilePage Component
**File**: `frontend/src/pages/ProfilePage.tsx`

**Sections to implement**:
1. **Personal Information Section**
   - Display: email (read-only), name (read-only)
   - Edit fields: phoneNumber, address, dateOfBirth
   - "Edit Profile" / "Save Changes" button
   - Use `profileApi.getProfile()` and `profileApi.updateProfile()`

2. **Change Password Section**
   - Current password input
   - New password input
   - Confirm new password input
   - "Change Password" button
   - Use Cognito changePassword API

3. **My Certifications Section**
   - Toggle between "Upload New" and "My Certifications" view
   - Upload form: Use `<CertificationUpload />` component
   - List view: Map `<CertificationCard />` components
   - Use `certificationApi.getUserCertifications()`, `certificationApi.deleteCertification()`

**Design notes**:
- 3-column layout or stacked sections
- Responsive design (mobile-friendly)
- Loading states for API calls
- Error handling with alerts

---

#### B. AdminDashboard Component
**File**: `frontend/src/pages/AdminDashboard.tsx`

**Features to implement**:
1. **Pending Certifications List**
   - Fetch: `adminApi.getPendingCertifications()`
   - Display table with columns: User Name, Email, Skill Category, Certificate Type, Issue Date, Submitted Date
   - "View PDF" button (opens S3 pre-signed URL in new tab)
   - "Approve" button (green)
   - "Reject" button (red, opens modal for reason)

2. **PDF Preview Modal**
   - Option 1: Open PDF in new browser tab
   - Option 2: Embed iframe with PDF viewer
   - Close button

3. **Rejection Modal**
   - Text area for rejection reason (required)
   - "Submit Rejection" button
   - "Cancel" button

**Authorization**:
- Check if user is admin (Cognito groups)
- Redirect to home if not admin
- Show "Access Denied" message

---

### 2. Frontend Integration (Update Existing Pages)

#### A. Update SkillsMarketplace.tsx
**File**: `frontend/src/pages/SkillsMarketplace.tsx`

**Changes**:
1. Import `CertifiedBadge` component
2. For each skill card, fetch user profile by email
3. Display `<CertifiedBadge size="small" showText={true} />` next to provider name if `isCertified === true`

**Implementation approach**:
```jsx
// Fetch profiles for all unique provider emails
useEffect(() => {
  const uniqueEmails = [...new Set(skills.map(s => s.providerEmail))];
  Promise.all(uniqueEmails.map(email => profileApi.getProfile(email)))
    .then(profiles => setProfilesMap(profiles));
}, [skills]);

// In skill card render:
{profilesMap[skill.providerEmail]?.isCertified && (
  <CertifiedBadge size="small" showText={false} />
)}
```

---

#### B. Update PostSkill.tsx
**File**: `frontend/src/pages/PostSkill.tsx`

**Changes**:
1. Fetch current user's profile on mount
2. Display certification status banner:
   - If certified: Green banner "✓ You are a certified provider"
   - If pending: Yellow banner "⏳ Certification pending review"
   - If not certified: Blue info banner "Upload your certificate to get verified"
3. Add link to `/profile` page for certification upload

---

### 3. Frontend Routing

#### Update App.tsx
**File**: `frontend/src/App.tsx`

**Add routes**:
```jsx
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

// Inside Routes:
<Route path="/profile" element={<ProfilePage />} />
<Route path="/admin" element={<AdminDashboard />} />
```

**Update Navigation**:
Add "Profile" link to navbar for authenticated users
Add "Admin" link to navbar for admin users only

---

### 4. AWS Configuration

#### A. SES Email Verification
```powershell
# Verify sender email (use actual domain or verified email)
aws ses verify-email-identity --email-address noreply@oshawaskills.com

# Or verify your personal email for testing
aws ses verify-email-identity --email-address nwokehenry90@gmail.com

# Check verification status
aws ses get-identity-verification-attributes --identities noreply@oshawaskills.com
```

**Note**: In sandbox mode, you must also verify recipient emails. For production, request SES production access.

---

#### B. Add Admin User to Cognito Group
```powershell
# Add yourself to Admins group
aws cognito-idp admin-add-user-to-group `
  --user-pool-id us-east-1_scg9Zyunx `
  --username nwokehenry90@gmail.com `
  --group-name Admins

# Verify group membership
aws cognito-idp admin-list-groups-for-user `
  --user-pool-id us-east-1_scg9Zyunx `
  --username nwokehenry90@gmail.com
```

---

#### C. Update Lambda IAM Role (Add S3 + SES Permissions)
```powershell
# Get current role name
aws lambda get-function --function-name oshawa-skills-api --query 'Configuration.Role'

# Create inline policy for S3 and SES
aws iam put-role-policy `
  --role-name <ROLE_NAME> `
  --policy-name CertificationPolicy `
  --policy-document '{
    "Version": "2012-12-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::oshawa-skills-certifications/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        "Resource": [
          "arn:aws:dynamodb:us-east-1:*:table/oshawa-user-profiles",
          "arn:aws:dynamodb:us-east-1:*:table/oshawa-certifications",
          "arn:aws:dynamodb:us-east-1:*:table/oshawa-certifications/index/*"
        ]
      }
    ]
  }'
```

---

### 5. Deployment

#### A. Deploy Backend
```powershell
cd backend
npm run build
cd dist
Compress-Archive -Path * -DestinationPath ../lambda.zip -Force
cd ..
aws lambda update-function-code `
  --function-name oshawa-skills-api `
  --zip-file fileb://lambda.zip
```

**Verify**:
```powershell
aws lambda get-function --function-name oshawa-skills-api --query 'Configuration.LastModified'
```

---

#### B. Deploy Frontend
**Option 1: Manual**
```powershell
cd frontend
npm run build
aws s3 sync build/ s3://oshawa-skills-frontend-7712/ --delete
aws s3 website s3://oshawa-skills-frontend-7712/ --index-document index.html --error-document index.html
```

**Option 2: CI/CD (Automatic)**
```powershell
git add .
git commit -m "Implement certification system (Phase 2)"
git push origin main
# GitHub Actions will deploy automatically
```

---

### 6. Testing Workflow

#### Test Plan (Step-by-step)

1. **Profile Creation**
   - [ ] Register new user
   - [ ] Navigate to `/profile`
   - [ ] Update phone, address, DOB
   - [ ] Verify profile saved

2. **Certification Upload**
   - [ ] Click "Upload Certification"
   - [ ] Fill form with valid PDF (<5MB)
   - [ ] Submit form
   - [ ] Verify S3 upload successful
   - [ ] Check status shows "Pending"

3. **Admin Review**
   - [ ] Login as admin user
   - [ ] Navigate to `/admin`
   - [ ] View pending certifications
   - [ ] Click "View PDF" (opens in new tab)
   - [ ] Click "Approve"
   - [ ] Verify email notification sent

4. **Badge Display**
   - [ ] Go to `/marketplace`
   - [ ] Find skill posted by certified user
   - [ ] Verify blue checkmark badge appears
   - [ ] Verify hover shows "Certified Provider"

5. **Rejection Flow**
   - [ ] Upload another certification
   - [ ] Admin rejects with reason "Invalid document"
   - [ ] Verify rejection email received
   - [ ] Check status shows "Rejected"
   - [ ] Verify rejection reason displayed

---

## 🔧 Environment Variables

### Frontend (.env)
```
REACT_APP_API_ENDPOINT=https://tp4jmb4vd3.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_USER_POOL_ID=us-east-1_scg9Zyunx
REACT_APP_USER_POOL_CLIENT_ID=<YOUR_CLIENT_ID>
```

### Backend (Lambda Environment Variables)
Already configured:
- `USER_POOL_ID`: us-east-1_scg9Zyunx
- `SKILLS_TABLE`: oshawa-skills
- `PICTURES_BUCKET`: oshawa-skills-pictures-7712

**Add**:
- `CERTIFICATIONS_BUCKET`: oshawa-skills-certifications
- `PROFILES_TABLE`: oshawa-user-profiles
- `CERTIFICATIONS_TABLE`: oshawa-certifications
- `SES_SENDER_EMAIL`: noreply@oshawaskills.com (or verified email)

```powershell
aws lambda update-function-configuration `
  --function-name oshawa-skills-api `
  --environment "Variables={
    USER_POOL_ID=us-east-1_scg9Zyunx,
    SKILLS_TABLE=oshawa-skills,
    PICTURES_BUCKET=oshawa-skills-pictures-7712,
    CERTIFICATIONS_BUCKET=oshawa-skills-certifications,
    PROFILES_TABLE=oshawa-user-profiles,
    CERTIFICATIONS_TABLE=oshawa-certifications,
    SES_SENDER_EMAIL=nwokehenry90@gmail.com
  }"
```

---

## 📊 Quick Reference

### API Endpoints
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/certifications` - Upload certification
- `GET /api/certifications` - Get user's certifications
- `DELETE /api/certifications/:id` - Delete pending cert
- `GET /api/admin/certifications` - Get pending (admin only)
- `POST /api/admin/certifications/:id/approve` - Approve (admin)
- `POST /api/admin/certifications/:id/reject` - Reject (admin)

### File Validations
- **File Type**: PDF only (.pdf extension)
- **File Size**: Max 5MB (5242880 bytes)
- **Upload Method**: Two-step (get pre-signed URL → upload to S3)

### Certification Statuses
- `PENDING`: Awaiting admin review
- `APPROVED`: Approved, user gets badge
- `REJECTED`: Rejected with reason

---

## 🎯 Priority Order

**Must-Have (for school presentation)**:
1. ProfilePage with certification upload ⚠️ HIGH
2. AdminDashboard with approve/reject ⚠️ HIGH
3. Badge display in marketplace ⚠️ HIGH
4. SES email verification ⚠️ MEDIUM
5. Add admin user to Cognito group ⚠️ MEDIUM
6. Deploy backend + frontend ⚠️ HIGH

**Nice-to-Have**:
- Password change functionality
- PDF preview modal (can use new tab instead)
- Advanced error handling
- Loading skeletons

---

## 🐛 Known Issues

1. **npm vulnerabilities**: 2 vulnerabilities (1 moderate, 1 high) in @aws-sdk packages - safe to ignore for school project
2. **SES Sandbox**: Emails only work for verified recipients until production access granted
3. **CORS**: Ensure API Gateway has CORS enabled for `/api/profile`, `/api/certifications`, `/api/admin/*`

---

## 📚 Documentation

- **README.md**: Already updated with Phase 2 features
- **API Documentation**: See backend/src/handlers/*.ts for request/response schemas
- **Database Schema**: See README.md "Database Schema" section

---

## ✅ Success Criteria

Your implementation is complete when:
- [ ] User can upload PDF certificate from `/profile` page
- [ ] Admin can review and approve/reject from `/admin` page
- [ ] Approved users get blue checkmark badge in marketplace
- [ ] Email notifications sent on approve/reject
- [ ] All TypeScript compiles without errors
- [ ] All pages are responsive (mobile + desktop)
- [ ] End-to-end test passes (register → upload → approve → badge shows)

Good luck! 🚀
