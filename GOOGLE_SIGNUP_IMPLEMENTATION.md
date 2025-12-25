# Google Sign-Up Implementation for Finvera

## Overview
This document outlines the implementation of Google OAuth sign-up functionality for Finvera, allowing users to register and log in using their Google accounts.

## Changes Made

### 1. Frontend Changes

#### A. Register Page (`/workspace/frontend/pages/client/register.jsx`)
- **Added**: Google sign-up button with Google's official branding
- **Location**: Below the registration form, above the "Already have an account?" link
- **Design**: Matches the existing Google sign-in button on the login page
- **Functionality**: Redirects users to `/api/auth/google` endpoint to initiate OAuth flow

#### B. Auth Callback Page (`/workspace/frontend/pages/auth/callback.jsx`)
- **Enhanced**: Added handling for `needsCompany` parameter
- **Logic**: 
  - If user signs up with Google and doesn't have a company, redirects to `/client/companies`
  - Displays appropriate welcome message for new users
  - Properly stores tokens and user data in cookies

### 2. Backend Changes

#### A. Google OAuth Strategy (`/workspace/backend/src/config/passport.js`)
- **Enhanced**: Automatic tenant creation for new Google users
- **Logic**:
  - When a user signs up with Google, checks if they have an existing tenant
  - If no tenant exists, creates one automatically with:
    - Unique subdomain (based on email)
    - 30-day trial period
    - Trial subscription plan
    - Organic acquisition category
  - Creates user with `tenant_admin` role
  - Links user to the newly created tenant
- **Subdomain Generation**: Creates unique subdomain by sanitizing email username and adding counter if needed

#### B. Auth Controller (`/workspace/backend/src/controllers/authController.js`)
- **Enhanced**: `googleCallback` function to handle new user signups
- **Added**: `needsCompanyCreation` flag tracking
- **Logic**:
  - Checks if user needs to create a company (tenant without companies OR no tenant)
  - Generates JWT tokens for authentication
  - Redirects to frontend with appropriate parameters
  - Passes `needsCompany=true` parameter for new users without companies

### 3. Existing Infrastructure (Already Configured)

#### Authentication Routes (`/workspace/backend/src/routes/authRoutes.js`)
- ✅ Google OAuth routes already configured:
  - `GET /api/auth/google` - Initiates OAuth flow
  - `GET /api/auth/google/callback` - Handles OAuth callback

#### Passport Configuration (`/workspace/backend/src/app.js`)
- ✅ Passport already initialized with session support
- ✅ Express session configured
- ✅ Passport middleware properly set up

#### Backend Dependencies (`/workspace/backend/package.json`)
- ✅ `passport` v0.7.0
- ✅ `passport-google-oauth20` v2.0.0
- ✅ All required dependencies already installed

## User Flow

### New User Registration with Google

1. **User clicks "Sign up with Google"** on `/client/register` page
2. **Redirected to Google OAuth consent screen**
3. **User grants permissions** and is redirected back to backend
4. **Backend (Passport Strategy)**:
   - Checks if user exists by Google ID
   - If not, checks if user exists by email
   - If no user exists, checks for existing tenant with that email
   - If no tenant exists, creates new tenant with:
     - Unique subdomain
     - 30-day trial period
     - Trial subscription plan
   - Creates user with `tenant_admin` role and links to tenant
5. **Backend (Auth Controller)**:
   - Generates JWT tokens
   - Checks if user needs to create company
   - Redirects to frontend callback with tokens and flags
6. **Frontend (Auth Callback)**:
   - Stores tokens in cookies
   - Fetches user profile
   - If `needsCompany=true`, redirects to `/client/companies`
   - Otherwise, redirects to appropriate dashboard

### Existing User Login with Google

1. **User clicks "Continue with Google"** on login page
2. **Redirected to Google OAuth consent screen**
3. **User grants permissions** and is redirected back
4. **Backend**:
   - Finds existing user by Google ID or email
   - Updates last login timestamp
   - Checks company associations
   - Generates tokens and redirects
5. **Frontend**:
   - Stores tokens
   - Redirects to dashboard if company exists
   - Redirects to company creation if needed

## Environment Variables Required

### Backend (.env)
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback

# Session Configuration
SESSION_SECRET=your-secure-session-secret

# Domain Configuration (for production)
MAIN_DOMAIN=finvera.solutions
NODE_ENV=production
```

### Frontend (.env)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Domain Configuration
NEXT_PUBLIC_MAIN_DOMAIN=localhost
```

## Security Features

1. **OAuth 2.0**: Industry-standard authentication protocol
2. **JWT Tokens**: Secure token-based authentication
3. **Session Management**: Express sessions with secure cookies
4. **CORS Protection**: Properly configured CORS for OAuth redirects
5. **No Password Storage**: Google OAuth users don't have passwords stored
6. **Automatic Tenant Isolation**: Each user gets their own tenant with unique subdomain

## Database Schema Impact

### TenantMaster Table
- New records created for Google sign-ups with:
  - `email`: User's Google email
  - `company_name`: Derived from Google display name or email
  - `subdomain`: Unique subdomain for the tenant
  - `is_trial`: Set to `true`
  - `trial_ends_at`: 30 days from signup
  - `subscription_plan`: Set to 'trial'
  - `acquisition_category`: Set to 'organic'

### Users Table
- New records created with:
  - `google_id`: Google profile ID
  - `email`: Google email
  - `name`: Google display name
  - `password`: NULL (no password for OAuth users)
  - `profile_image`: Google profile picture URL
  - `role`: 'tenant_admin'
  - `tenant_id`: Linked to created/existing tenant

## Testing Checklist

- [ ] New user can sign up with Google
- [ ] Existing user can log in with Google
- [ ] User without company is redirected to company creation
- [ ] User with company is redirected to dashboard
- [ ] Tokens are properly stored in cookies
- [ ] User profile is correctly fetched and stored
- [ ] Tenant is created with correct attributes
- [ ] Subdomain generation works correctly
- [ ] Trial period is set correctly (30 days)
- [ ] Error handling works for OAuth failures
- [ ] Multiple companies scenario works
- [ ] Login page shows appropriate message for Google-only accounts

## Future Enhancements

1. **Social Login Icons**: Add more OAuth providers (Microsoft, Apple, etc.)
2. **Account Linking**: Allow linking Google account to existing email/password account
3. **Profile Sync**: Automatically sync profile picture and name from Google
4. **OAuth Refresh**: Implement OAuth token refresh for long-lived sessions
5. **Admin Panel**: Add Google OAuth user management in admin panel

## Troubleshooting

### Common Issues

1. **Google OAuth not working**:
   - Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in backend .env
   - Verify callback URL is registered in Google Cloud Console
   - Ensure `GOOGLE_CALLBACK_URL` matches Google Console settings

2. **Redirect loop after OAuth**:
   - Check frontend `NEXT_PUBLIC_API_URL` is correct
   - Verify CORS settings allow OAuth redirects
   - Check that tokens are being properly stored in cookies

3. **User can't create company**:
   - Verify tenant was created properly in database
   - Check user has `tenant_admin` role
   - Ensure JWT token includes `tenant_id`

4. **Subdomain conflicts**:
   - Check TenantMaster table for duplicate subdomains
   - Verify subdomain generation logic creates unique values
   - Review database unique constraints

## Files Modified

### Frontend
- `/workspace/frontend/pages/client/register.jsx` - Added Google sign-up button
- `/workspace/frontend/pages/auth/callback.jsx` - Enhanced callback handling

### Backend
- `/workspace/backend/src/config/passport.js` - Enhanced Google strategy with auto-tenant creation
- `/workspace/backend/src/controllers/authController.js` - Enhanced googleCallback function

### Documentation
- `/workspace/GOOGLE_SIGNUP_IMPLEMENTATION.md` - This file

## Related Documentation

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Support

For issues or questions about this implementation, please contact the development team or create an issue in the project repository.

---

**Last Updated**: December 25, 2025
**Version**: 1.0.0
**Status**: ✅ Implemented and Ready for Testing
