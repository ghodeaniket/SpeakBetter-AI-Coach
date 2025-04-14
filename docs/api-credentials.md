# API Credentials Setup

This document provides guidance on setting up API credentials for the SpeakBetter AI Coach application.

## Google Cloud API Credentials

The SpeakBetter AI Coach uses Google Cloud APIs for speech processing. For detailed setup instructions, refer to the archived [API_CREDENTIALS_SETUP.md](./archive/legacy/API_CREDENTIALS_SETUP.md).

Key points:

1. **Required APIs**:

   - Speech-to-Text API
   - Text-to-Speech API

2. **Credential Options**:

   - For development: API keys with appropriate restrictions
   - For production: Service accounts with minimal permissions

3. **Environment Configuration**:
   - Web: Configure in `.env.local` files
   - Mobile: Configure in appropriate environment files

See the [Development Guide](./development-guide.md) for more detailed setup instructions.
