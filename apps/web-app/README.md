# SpeakBetter AI Coach Web App

This is the web application entry point for the SpeakBetter AI Coach platform.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Development

1. Clone the repository (if you haven't already)
2. Install dependencies from the root of the monorepo:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your environment variables
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm run test
```

## Architecture

This web app serves as the entry point for the SpeakBetter AI Coach web platform. It:

1. Initializes environment-specific configurations
2. Loads the main App component from `@speakbetter/web`
3. Mounts the application in the DOM

The actual implementation of components and business logic is kept in the shared packages:

- `@speakbetter/web`: Web-specific components and logic
- `@speakbetter/core`: Shared business logic and models
- `@speakbetter/api`: API client implementations
- `@speakbetter/ui`: Shared UI components
- `@speakbetter/state`: State management

This separation allows for better code organization and sharing between platforms.
