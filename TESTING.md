# Testing the Firebase Extensions Integration

This document provides instructions for testing the fix for the Firebase Extensions connection issue in the SpeakBetter AI Coach application.

## Prerequisites

1. Ensure you have the Firebase project properly set up
2. Make sure you have the Speech-to-Text and Text-to-Speech extensions installed in your Firebase project

## Steps to Test

1. Deploy the Firebase configuration (if not already done):
   ```bash
   cd "/Users/aniketghode/development/Planned Projects/Speak Better/speakbetter-ai-coach"
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore,storage,extensions
   ```

2. Start the application locally:
   ```bash
   cd "/Users/aniketghode/development/Planned Projects/Speak Better/speakbetter-ai-coach"
   npm run dev
   ```

3. Open the application in your browser:
   - Navigate to http://localhost:5177 (or whatever port is shown in the terminal)

4. Test Speech-to-Text Extension:
   - Go to the "Speech-to-Text" section with the "Fixed Version" (from the left navigation menu)
   - Record a short audio sample
   - Click "Transcribe Audio (Live API)"
   - Verify that the transcription appears correctly
   - Check the Debug Information to see which collection was used

5. Test Text-to-Speech Extension:
   - Go to the "Text-to-Speech" section with the "Live API" (from the left navigation menu)
   - Enter some text or use one of the sample texts
   - Configure voice settings
   - Click "Generate Speech (Live API)"
   - Verify that the audio is generated and can be played back

## Troubleshooting

If you encounter issues:

1. Check Firebase Console to ensure extensions are properly installed
2. Verify that the collections in Firestore match what's configured in the application
3. Check the browser console for any errors
4. Review the Debug Information in the Speech-to-Text Fixed component

## What Was Fixed

1. Created proper Firebase configuration files:
   - `.firebaserc`
   - `firebase.json`
   - `extension.yaml`
   - `firestore.rules`
   - `storage.rules`
   - `firestore.indexes.json`

2. Updated collection names in the code to match extension configuration:
   - Changed `speech_transcriptions` to `transcriptions` for Speech-to-Text
   - Verified `tts_requests` for Text-to-Speech

3. Enhanced debugging capabilities in the SpeechToTextLiveFixed component

## Notes

- The Firebase Extensions must be manually installed in your Firebase project
- The extension.yaml file provides documentation of the correct configuration but isn't automatically applied
