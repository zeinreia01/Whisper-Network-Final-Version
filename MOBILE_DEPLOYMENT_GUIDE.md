# Vercel Deployment Issue - API Authentication Problem

## The Issue
Your API endpoints are being intercepted by Vercel's authentication system instead of serving your actual API. This is why you see an authentication page when accessing `/api/recipients` and `/api/messages/public`.

## Root Cause
The issue is likely in the vercel.json configuration where the API routes aren't properly configured or there's a middleware conflict.

## Quick Fix Steps

### 1. Check Vercel Project Settings
- Go to your Vercel project dashboard
- Settings → Functions
- Make sure there are no authentication requirements set

### 2. Verify Environment Variables
- Settings → Environment Variables  
- Add: `DATABASE_URL` with your Supabase connection string
- Make sure it's set for "Production" environment

### 3. Update vercel.json Configuration
The API routes need proper configuration to avoid authentication intercepts.

### 4. Alternative: Use Direct Domain
Your preview URL might have authentication. Try:
- The production domain instead of the preview URL
- Or disable preview authentication in Vercel settings

## Expected Result
Once fixed, `/api/recipients` should return `["Admin"]` and `/api/messages/public` should return your messages array.

Your local API works perfectly, so this is purely a deployment routing issue.