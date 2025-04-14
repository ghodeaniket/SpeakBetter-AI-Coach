# Manual Testing Guide for Firebase Extensions Integration

This guide provides step-by-step instructions for manually testing the integration between the SpeakBetter AI Coach application and Firebase Extensions.

## Prerequisites

Ensure that:

1. The application is running (currently at http://localhost:5179/)
2. You have access to the Firebase Console for the project "speakbetter-dev-722cc"

## Testing Speech-to-Text Integration

### Step 1: Configure Firebase Extension (if not already done)

1. Go to the Firebase Console: https://console.firebase.google.com/project/speakbetter-dev-722cc/extensions
2. Install the "Speech-to-Text" extension if not already installed
3. Configure with the following settings:
   - Collection name: `transcriptions`
   - Language code: `en-US`
   - Encoding: `LINEAR16` or `WEBM_OPUS` (depending on what's supported)
   - Sample rate: `16000`

### Step 2: Test in the Application

1. Navigate to the application in your browser
2. From the left menu, select "Speech-to-Text" with the "Fixed Version" chip
3. Record a short audio sample
4. Click "Transcribe Audio (Live API)"
5. Verify that:
   - The debug information shows connections to the correct collection
   - After some processing time, a transcription appears
   - Filler words are detected correctly

### Step 3: Verify in Firebase Console

1. Go to Firestore in the Firebase Console
2. Navigate to the "transcriptions" collection
3. Verify a new document has been created
4. Check that it contains the transcription text

## Testing Text-to-Speech Integration

### Step 1: Configure Firebase Extension (if not already done)

1. Go to the Firebase Console: https://console.firebase.google.com/project/speakbetter-dev-722cc/extensions
2. Install the "Text-to-Speech" extension if not already installed
3. Configure with the following settings:
   - Collection name: `tts_requests`
   - Language code: `en-US`
   - Voice name: `en-US-Wavenet-F` (or another WaveNet voice)
   - Audio encoding: `MP3`

### Step 2: Test in the Application

1. Navigate to the application in your browser
2. From the left menu, select "Text-to-Speech" with the "Live API" chip
3. Enter some text or select one of the sample texts
4. Configure the voice settings if desired
5. Click "Generate Speech (Live API)"
6. Verify that:
   - After some processing time, a playback control appears
   - The audio plays correctly when you click the play button
   - The voice matches the selected settings

### Step 3: Verify in Firebase Console

1. Go to Firestore in the Firebase Console
2. Navigate to the "tts_requests" collection
3. Verify a new document has been created
4. Check that it contains the audio URL and status

## Troubleshooting

If the integrations don't work as expected:

1. **Check Console Logs:**

   - Open the browser developer tools (F12 or right-click > Inspect)
   - Go to the Console tab
   - Look for any error messages related to Firebase

2. **Verify Collection Names:**

   - Double-check that the collection names in the code match those in the Firebase Extensions
   - SpeechToTextLive.tsx should use `transcriptions`
   - TextToSpeechLive.tsx should use `tts_requests`

3. **Check Firebase Extensions Settings:**

   - Go to the Extensions tab in Firebase Console
   - Verify that the extensions are installed and configured correctly
   - Check the extension logs for any errors

4. **Verify Firebase Project:**
   - Make sure the application is connecting to the correct Firebase project
   - Check the config in `/src/firebase/config.ts`

## What Should Work Now

With the fixes applied:

1. The `firebase.json` and `.firebaserc` files are properly configured
2. The collection names in the code match those in the Firebase Extensions
3. The application has enhanced debugging capabilities
4. The file structure is correct for Firebase deployment

These changes should resolve the connection issues between the app and Firebase Extensions.
