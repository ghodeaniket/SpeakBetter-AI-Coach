# SpeakBetter AI Coach

SpeakBetter AI Coach is an innovative web application that provides real-time AI-powered speech coaching to help users improve their communication skills. This application helps users practice and refine their speaking abilities through AI-driven analysis and personalized feedback.

![SpeakBetter AI Coach Screenshot](https://github.com/ghodeaniket/SpeakBetter-AI-Coach/raw/main/public/screenshot.png)

## 🚀 Project Overview

SpeakBetter AI Coach delivers:
- **Real-time speech analysis** with professional-quality feedback
- **Personalized coaching** delivered through a natural-sounding AI voice
- **Actionable improvements** rather than just metrics
- **Seamless practice-feedback-improvement cycle**
- **Progress tracking** to visualize improvement over time

## ✨ Features

### Sprint 1 Implementation
The Sprint 1 implementation includes:

- **Basic Authentication**
  - Google sign-in functionality
  - User profile storage
  - Protected routes

- **Enhanced Audio Recording Interface**
  - Responsive audio visualization
  - Recording time limits
  - Audio quality detection
  - Client-side audio compression

- **Speech Analysis Pipeline**
  - Filler word detection
  - Speaking pace calculation
  - Clarity scoring
  - Robust error handling

- **Session Management**
  - Session creation and storage
  - Session history
  - Session metadata
  - Progress visualization

- **User Experience**
  - Responsive design
  - Intuitive interface
  - Loading states and progress indicators
  - Error handling

## 🔧 Technical Stack

- **Frontend**: React with TypeScript, Material UI
- **Backend**: Google Cloud & Firebase
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Functions
  - Speech-to-Text API
  - Text-to-Speech API

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account with a configured project
- Firebase Extensions installed and configured
- Google Cloud APIs enabled (Speech-to-Text, Text-to-Speech)

### Installation
1. Clone the repository
   ```bash
   git clone git@github.com:ghodeaniket/SpeakBetter-AI-Coach.git
   cd SpeakBetter-AI-Coach
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with your Firebase configuration
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Build for production
   ```bash
   npm run build
   ```

### Firebase Setup

1. Install Firebase Tools
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase in your project
   ```bash
   firebase login
   firebase init
   ```

3. Deploy Firebase configuration
   ```bash
   firebase deploy --only firestore,storage
   ```

## 📂 Project Structure

```
src/
├── components/         # Shared UI components
├── features/           # Feature-based modules
│   ├── auth/           # Authentication related components
│   ├── dashboard/      # Dashboard and analytics
│   ├── session-management/ # Session handling
│   ├── speech-to-text/ # Speech analysis
│   └── text-to-speech/ # Voice feedback
├── firebase/           # Firebase configuration
├── services/           # API services
├── shared/             # Shared utilities and contexts
│   ├── components/     # Common components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── theme/          # Material UI theming
│   └── utils/          # Utility functions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## 🧪 Testing

The application includes extensive testing capabilities:

- **Unit Tests**: Test individual components and utilities
- **Integration Tests**: Test feature interactions
- **End-to-End Tests**: Test complete user flows

Run tests with:
```bash
npm test
```

## 🔍 Troubleshooting

Common issues and solutions:

### Firebase Timestamp Conversion
If you encounter errors related to `createdAt.getTime is not a function`, ensure proper conversion between Firestore Timestamps and JavaScript Date objects:

```typescript
// Convert Firestore Timestamp to Date
const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
```

### Audio Recording Issues
For browser compatibility issues with audio recording:
- Ensure the site is using HTTPS or localhost
- Check browser permissions for microphone access
- Verify WebRTC is supported in the browser

## ���� Development Roadmap

### Completed
- ✅ Sprint 0: Technical Validation
- ✅ Sprint 1: Core Implementation

### Upcoming
- Sprint 2: Enhanced Analysis & Feedback
- Sprint 3: User Profiles & Progress Tracking
- Sprint 4: Advanced Features & Optimizations
- Sprint 5: Launch Preparation

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

[MIT](LICENSE)
