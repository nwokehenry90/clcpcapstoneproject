# AWS Cognito User Pool Setup Guide (Console)

Complete step-by-step instructions for creating a Cognito User Pool through the AWS Management Console for the Oshawa Skills Exchange application.

---

## Prerequisites

- AWS Account created and logged in
- Access to AWS Management Console

---

## Step-by-Step Instructions

### 1. Navigate to Amazon Cognito

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/)
2. In the search bar at the top, type **"Cognito"**
3. Click on **"Amazon Cognito"** from the results
4. Make sure you're in the correct region (e.g., **us-east-1** - N. Virginia)
   - Check the region dropdown in the top-right corner

---

### 2. Create User Pool

1. Click the **"Create user pool"** button (orange button)
2. You'll see a multi-step configuration wizard

---

### 3. Step 1: Configure Sign-in Experience

**Provider types:**
- ✅ Select **"Cognito user pool"** (default)

**Cognito user pool sign-in options:**
- ✅ Check **"Email"** only
- ⬜ Uncheck "Username"
- ⬜ Uncheck "Phone number"

**User name requirements:**
- Leave as default (not applicable since we're using email)

Click **"Next"** at the bottom

---

### 4. Step 2: Configure Security Requirements

**Password policy:**
- Select **"Cognito defaults"** or customize:
  - ✅ Minimum length: **8 characters**
  - ✅ Require uppercase letters
  - ✅ Require lowercase letters
  - ✅ Require numbers
  - ✅ Require special characters

**Multi-factor authentication (MFA):**
- ⚪ Select **"No MFA"** (to keep it simple for now)
- Note: You can enable this later if needed

**User account recovery:**
- ✅ Select **"Enable self-service account recovery"**
- ✅ Check **"Email only"** for delivery method

Click **"Next"**

---

### 5. Step 3: Configure Sign-up Experience

**Self-registration:**
- ✅ Enable **"Enable self-registration"**

**Attribute verification and user account confirmation:**
- ✅ Check **"Allow Cognito to automatically send messages to verify and confirm"**
- ✅ Select **"Send email message, verify email address"**

**Required attributes:**
- ✅ Check **"email"** (should already be required)
- ✅ Check **"name"** (add this for user's full name)

**Custom attributes:**
- Leave empty (we don't need custom attributes for now)

Click **"Next"**

---

### 6. Step 4: Configure Message Delivery

**Email:**
- ⚪ Select **"Send email with Cognito"** (default, easiest option)
  - This gives you 50 emails/day for free
  - Good for development and testing
  
  **OR** (for production):
  
- ⚪ Select **"Send email with Amazon SES"**
  - Requires SES setup first
  - Higher limits but more complex
  - Use this if you expect more than 50 signups/day

**FROM email address:**
- Leave as default: `no-reply@verificationemail.com`

**REPLY-TO email address:**
- Optional: Enter your support email if you want users to be able to reply

**SES Region:**
- Only appears if you selected SES
- Choose your SES region

Click **"Next"**

---

### 7. Step 5: Integrate Your App

**User pool name:**
- Enter: **`oshawa-skills-exchange`**

**Hosted authentication pages:**
- ⬜ Leave **unchecked** (we're using custom React pages)

**Initial app client:**

**App client name:**
- Enter: **`oshawa-skills-web-app`**

**Client secret:**
- ⚪ Select **"Don't generate a client secret"**
  - ⚠️ Important: Public web apps should NOT have client secrets

**Authentication flows:**
- ✅ Check **"ALLOW_USER_PASSWORD_AUTH"**
- ✅ Check **"ALLOW_REFRESH_TOKEN_AUTH"** 
- ✅ Check **"ALLOW_USER_SRP_AUTH"**
- ⬜ Uncheck "ALLOW_CUSTOM_AUTH"

**Prevent User Existence Errors:**
- ✅ Enable (recommended for security)

Click **"Next"**

---

### 8. Step 6: Review and Create

Review all your settings:

**Sign-in options:** Email  
**Password policy:** Cognito defaults (or your custom settings)  
**MFA:** None  
**User account recovery:** Email only  
**Self-registration:** Enabled  
**Required attributes:** email, name  
**Email provider:** Cognito (or SES)  
**User pool name:** oshawa-skills-exchange  
**App client:** oshawa-skills-web-app  

If everything looks correct, click **"Create user pool"** at the bottom

---

### 9. Get Your Configuration Values

After creation, you'll be taken to the User Pool details page.

**Get User Pool ID:**
1. On the User Pool overview page
2. Look for **"User pool ID"** at the top
3. Copy the value (format: `us-east-1_abc123def`)
4. **Save this value** - you'll need it for `.env`

**Get App Client ID:**
1. On the left sidebar, click **"App integration"** tab
2. Scroll down to **"App clients and analytics"** section
3. Click on your app client name: **oshawa-skills-web-app**
4. Copy the **"Client ID"** value (long alphanumeric string)
5. **Save this value** - you'll need it for `.env`

---

### 10. Configure Your Frontend

Update `frontend/.env` with your values:

```env
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_abc123def
REACT_APP_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
REACT_APP_API_BASE_URL=https://your-api-gateway-url/api
```

---

### 11. Test Your Configuration

1. Rebuild your frontend:
   ```powershell
   cd frontend
   npm run build
   ```

2. Test registration:
   - Run the app locally
   - Click "Register"
   - Enter email, name, password
   - Check your email for verification code
   - Enter code to verify
   - Try signing in

---

## Optional: Additional Configuration

### Enable Email Verification Before Sign-in

1. Go to your User Pool
2. Click **"Sign-up experience"** tab
3. Under **"Attribute verification and user account confirmation"**
4. Ensure **"Email"** is selected for verification

### Customize Email Templates

1. In your User Pool, click **"Messaging"** tab
2. Click **"Edit"** next to "Email templates"
3. Customize the verification email:
   - Subject line
   - Message body
   - Add your branding

### Set Up Password Expiration (Optional)

1. Click **"Policies"** tab
2. Adjust password policies as needed
3. Set password expiration if required

### Enable MFA Later (Optional)

1. Click **"Security"** tab
2. Click **"Edit"** next to Multi-factor authentication
3. Select **"Optional MFA"** or **"Required MFA"**
4. Choose SMS or TOTP authenticator app

---

## Troubleshooting

### Can't Send Verification Emails

**Problem:** Verification emails not arriving

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. If using Cognito email (default):
   - You're limited to 50 emails/day
   - Must stay within AWS SES sandbox limits
4. Consider switching to Amazon SES for production

### "User is not confirmed" Error

**Problem:** Can't sign in after registration

**Solution:**
1. Check email for verification code
2. Make sure user enters the code
3. In AWS Console, you can manually confirm users:
   - Go to User Pool → Users
   - Select the user
   - Click "Confirm user"

### Client Secret Error

**Problem:** "Client secret is required" error

**Solution:**
- Make sure you selected **"Don't generate a client secret"** when creating the app client
- If you already created it with a secret, create a new app client without one

### Verification Code Expired

**Problem:** Code expired before user entered it

**Solution:**
- Default expiration is 24 hours
- User needs to request a new code
- In AWS Console:
  - User Pool → Users → Select user → "Resend code"

---

## Summary Checklist

✅ User Pool created: `oshawa-skills-exchange`  
✅ Email-based authentication enabled  
✅ Self-registration enabled  
✅ Required attributes: email, name  
✅ Password policy configured  
✅ Email verification enabled  
✅ App client created: `oshawa-skills-web-app`  
✅ No client secret (for public web app)  
✅ User Pool ID copied  
✅ Client ID copied  
✅ Frontend .env updated  

---

## Next Steps

After setting up Cognito:

1. ✅ **Test authentication locally** with your configuration
2. 📊 **Create DynamoDB table** (see `DEPLOYMENT-GUIDE.md`)
3. ⚡ **Deploy Lambda function** (see `deploy-lambda.ps1`)
4. 🌐 **Set up API Gateway** (see `docs/AWS-CLI-SETUP.md`)
5. 🪣 **Create S3 bucket** for hosting
6. 🚀 **Deploy frontend** to S3

---

## Cost Information

**Cognito User Pool Pricing:**
- First 50,000 Monthly Active Users (MAUs): **FREE**
- After that: $0.0055 per MAU

**Email Sending:**
- **Cognito email**: 50 emails/day FREE
- **SES**: First 62,000 emails/month FREE (if using SES)

**Your expected cost:** $0 for development/testing

---

## Support Resources

- [Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Cognito User Pool Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
- [Cognito Email Settings](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html)

---

**Setup Complete!** Your Cognito User Pool is ready for the Oshawa Skills Exchange application.
