# SpeakBetter AI Coach

SpeakBetter AI Coach is an innovative web application that provides real-time AI-powered speech coaching to help users improve their communication skills. This repository contains the code for the Sprint 0 validation phase.

## Project Overview

SpeakBetter AI Coach uses Google Cloud services through Firebase Extensions to provide:
- Real-time speech analysis with professional-quality feedback
- Personalized coaching delivered through a natural-sounding AI voice
- Focus on actionable improvement areas rather than just metrics
- Seamless practice-feedback-improvement cycle

## Firebase Extensions Integration

This project uses two key Firebase Extensions:
1. **Speech-to-Text**: Converts audio recordings to text for analysis
2. **Text-to-Speech**: Generates natural-sounding voice feedback

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account with a configured project
- Firebase Extensions installed and configured

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

3. Install Firebase Tools
   ```bash
   npm install -g firebase-tools
   ```

4. Deploy Firebase configuration
   ```bash
   firebase login
   firebase deploy --only firestore,storage,extensions
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

### Testing the Firebase Extensions

The application includes multiple implementations for testing Speech-to-Text integration:

1. **Mock Implementation**: Uses simulated responses for UI testing
2. **Live Implementation**: Direct integration with the Firebase Extension 
3. **Fixed Version**: Improved implementation with better error handling
4. **Direct Mode**: Alternative approach that creates documents directly
5. **Enhanced Version**: Most robust implementation with:
   - Collection auto-detection
   - Multiple field name support
   - Collection group queries
   - Detailed debug logging
   - Fallback mechanisms

For detailed testing instructions, see the [Testing Guide](./TESTING.md).

### Troubleshooting

If you encounter issues with the Speech-to-Text integration, see [FIXES_APPLIED.md](./FIXES_APPLIED.md) for:
- Common issues and their solutions
- Technical details of fixes implemented
- Debugging strategies

## Technical Architecture

The application is built with:
- React with TypeScript
- Material UI for components
- Firebase services:
  - Authentication
  - Firestore
  - Storage
  - Extensions

## Sprint 0 Validation

The current branch focuses on validating the technical capabilities required for the SpeakBetter AI Coach:
- WebRTC compatibility for audio recording
- Speech-to-Text API accuracy and performance
- Text-to-Speech quality for feedback delivery
- Firebase Extensions integration

## License

[MIT](LICENSE)
