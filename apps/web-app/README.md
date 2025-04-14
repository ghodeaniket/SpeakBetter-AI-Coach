# @speakbetter/web-app

Web application entry point for SpeakBetter AI Coach.

## Overview

This package serves as the entry point for the web version of SpeakBetter AI Coach:

- Application entry point
- Build configuration
- Environment-specific settings
- Web-specific assets

## Directory Structure

```
web-app/
├── public/          # Static assets
├── src/
│   ├── main.tsx     # Application entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── vite.config.ts   # Build configuration
└── README.md        # This file
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint
```

## Environment Variables

Create a `.env` file in the root of this package with the following variables:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

## Build Configuration

This package uses Vite for building and bundling. The configuration can be found in `vite.config.ts`.

## Deployment

To deploy the web application:

1. Build the application: `npm run build`
2. Deploy the `dist` directory to your hosting provider of choice (Firebase Hosting, Vercel, Netlify, etc.)

## Dependencies

- `@speakbetter/web`: Web implementation
- `@speakbetter/core`: Core models and interfaces
- `@speakbetter/api`: API implementations
- `@speakbetter/ui`: UI component interfaces
- `@speakbetter/state`: State management
