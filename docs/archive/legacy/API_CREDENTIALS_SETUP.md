# Google Cloud API Credentials Setup

## Overview

The direct Google Cloud API integration requires proper authentication to access the Speech-to-Text and Text-to-Speech APIs. This document explains how to set up the necessary credentials for development and production environments.

## Prerequisites

1. A Firebase project with billing enabled
2. Google Cloud APIs (Speech-to-Text and Text-to-Speech) enabled for your project
3. Appropriate IAM permissions to create and manage service accounts

## Setting Up Service Account Credentials

### Option 1: Using Firebase Admin SDK (Recommended for Production)

1. **Create a Service Account**:

   - Go to your [Firebase Console](https://console.firebase.google.com/)
   - Navigate to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

2. **Set up Environment Variables**:
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your service account JSON file:

     ```bash
     # Linux/macOS
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-file.json"

     # Windows (Command Prompt)
     set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-service-account-file.json

     # Windows (PowerShell)
     $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-service-account-file.json"
     ```

### Option 2: Using Client-Side Authentication (Development Only)

For client-side authentication during development, you can use Firebase Authentication with custom claims:

1. **Configure Firebase Authentication**:

   - Ensure Firebase Authentication is enabled in your project
   - Set up authentication methods (e.g., Google, Email/Password)

2. **Add Custom Claims for API Access**:

   - Using Firebase Admin SDK in your server-side code:

     ```javascript
     const admin = require("firebase-admin");

     admin.auth().setCustomUserClaims(uid, {
       "https://www.googleapis.com/auth/cloud-platform": true,
     });
     ```

3. **Update Security Rules**:
   - Configure appropriate security rules to limit access to your resources

## Project Setup for Direct API Integration

1. **Update .env.local File**:
   Add the following variables to your `.env.local` file:

   ```
   VITE_GOOGLE_CLOUD_PROJECT_ID=your-project-id
   VITE_GOOGLE_CLOUD_REGION=us-central1
   ```

2. **Adding Cloud Function for Authentication**:
   For better security in production, consider adding a Cloud Function to handle API calls server-side:

   ```javascript
   // Example Cloud Function for Speech-to-Text
   exports.transcribeSpeech = functions.https.onCall(async (data, context) => {
     // Check authentication
     if (!context.auth) {
       throw new functions.https.HttpsError(
         "unauthenticated",
         "User must be authenticated",
       );
     }

     // Initialize the Speech client
     const speech = new SpeechClient();

     // Process the request
     try {
       const [response] = await speech.recognize({
         audio: {
           content: data.audioContent,
         },
         config: {
           languageCode: data.languageCode || "en-US",
           // other config options
         },
       });

       return response;
     } catch (error) {
       throw new functions.https.HttpsError("internal", error.message);
     }
   });
   ```

## Configuring Billing Alerts

To avoid unexpected costs:

1. Go to the [Google Cloud Console Billing page](https://console.cloud.google.com/billing)
2. Select your project
3. Navigate to "Budgets & Alerts"
4. Create a budget with notification alerts at specific thresholds (e.g., 50%, 90%, 100%)

## Testing Your Authentication

You can test if your credentials are working correctly by using the test components provided in the application:

1. Navigate to "Speech-to-Text" → "Direct API" in the sidebar
2. Record a short audio sample
3. Click "Transcribe Audio (Direct API)"
4. Check the debug logs for any authentication errors

## Troubleshooting

If you encounter authentication issues:

1. **Check Console Errors**: Look for specific error messages in the browser console
2. **Verify API Enablement**: Ensure the APIs are enabled in the Google Cloud Console
3. **Validate Credentials**: Confirm the service account has the required roles (Cloud Speech-to-Text User, Cloud Text-to-Speech User)
4. **Check Token Expiration**: Firebase ID tokens expire after 1 hour, ensure your app refreshes them

## Security Considerations

1. **Never expose service account keys in client-side code**
2. **Implement proper access controls** through Firebase Security Rules
3. **Consider server-side proxying** of API calls for production environments
4. **Monitor API usage** regularly to detect unusual patterns

For more information, refer to the [Google Cloud Authentication documentation](https://cloud.google.com/docs/authentication).
