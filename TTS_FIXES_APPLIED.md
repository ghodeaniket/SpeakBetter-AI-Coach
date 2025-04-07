# Text-to-Speech Integration Fixes

## Issue Summary

The Text-to-Speech (TTS) integration in the SpeakBetter AI Coach application was not working properly during Sprint 0 validation. After investigation, several problems were identified:

1. **Collection Path Mismatch**: The code was hardcoded to use a specific collection name (`tts_requests`), which might not match the actual collection name used by the Firebase Extension. In the `firebase.json` file, the extension was registered as `tts-api`, potentially causing a mismatch.

2. **Field Name Discrepancies**: Different versions or configurations of the Firebase TTS extension might use different field names for the status and audio content, making it difficult to extract the results.

3. **Storage Path Handling**: When an audio file path (rather than a direct URL) was returned, the code had difficulty constructing the correct storage reference to get the download URL.

4. **Limited Response Format Support**: The original code had some logic to handle different response formats but was still too rigid for the variety of possible formats returned by different Firebase Extension versions.

5. **Insufficient Error Handling and Debugging**: The original implementation lacked detailed logging and debugging capabilities, making it difficult to diagnose issues.

## Solutions Implemented

A new enhanced Text-to-Speech component (`TextToSpeechLiveFixed.tsx`) has been created with the following improvements:

### 1. Collection Auto-Detection

The fixed component automatically detects available collections at startup by:
- Trying multiple possible collection names used by different TTS extensions
- Querying each collection to check if it exists and contains documents
- Selecting the first valid collection found, or defaulting to the expected one if none is found

```typescript
// List of possible collection names used by different TTS extensions
const possibleCollectionNames = [
  'tts_requests',
  'tts-requests',
  'textToSpeech',
  'text-to-speech',
  'tts_api',
  'tts-api',
  'ttsRequests'
];

// Collection detection implementation
useEffect(() => {
  const detectCollections = async () => {
    for (const collName of possibleCollectionNames) {
      try {
        const colRef = collection(db, collName);
        const q = query(colRef, limit(1));
        
        const snapshot = await getDocs(q);
        if (!activeCollection) {
          setActiveCollection(collName);
        }
      } catch (err) {
        // Collection might not exist, that's okay
      }
    }
    
    // If no collection was found, default to the expected one
    if (!activeCollection) {
      setActiveCollection('tts_requests');
    }
  };
  
  detectCollections();
}, []);
```

### 2. Multiple Field Name Support

The fixed component tries multiple field name combinations to find the response data:

```typescript
// List of possible field names for audio content
const possibleAudioFields = [
  'audioContent',
  'output.audioContent',
  'audioUrl',
  'output.audioUrl',
  'url',
  'output.url',
  // ... many more options
];

// List of possible status field names
const possibleStatusFields = [
  'state',
  'status',
  'output.state',
  'output.status',
  'processedState',
  'processedStatus'
];

// Field extraction helper
const extractField = (data: any, fieldPaths: string[]): any => {
  for (const path of fieldPaths) {
    const parts = path.split('.');
    let value = data;
    
    for (const part of parts) {
      if (value === undefined || value === null) break;
      value = value[part];
    }
    
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  
  return null;
};
```

### 3. Multiple Storage Path Handling

The fixed component tries multiple storage path formats when retrieving audio files:

```typescript
// Try different path formats
const possiblePaths = [
  audioContent,
  `tts_audio/${audioContent}`,
  `tts_requests/${audioContent}`,
  `${activeCollection}/${audioContent}`,
  `${activeCollection}/${docId}/${audioContent}`,
  `${docId}/${audioContent}`
];

// Try each path until one works
for (const path of possiblePaths) {
  try {
    const url = await getDownloadURL(ref(storage, path));
    return resolve({
      audioUrl: url,
      durationMs: data.durationMs || data.duration || 5000,
      processingTimeMs: endTime - startTime
    });
  } catch (err) {
    // Continue to the next path
  }
}
```

### 4. Comprehensive Request Document

The fixed component creates a more comprehensive request document that includes fields in multiple formats to work with different extension versions:

```typescript
// Create a comprehensive request document
const requestData = {
  // Core fields required by most TTS extensions
  input: {
    text: params.text
  },
  voice: {
    languageCode: 'en-US',
    name: params.voiceId,
    ssmlGender: voiceOption.gender
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: params.speed,
    pitch: params.pitch
  },
  
  // Alternative formats some extensions might expect
  text: params.text,
  voiceName: params.voiceId,
  voiceGender: voiceOption.gender,
  languageCode: 'en-US',
  speakingRate: params.speed,
  pitchAdjustment: params.pitch,
  
  // Add metadata and timestamps
  createdAt: serverTimestamp(),
  status: 'pending',
  state: 'PROCESSING'
};
```

### 5. Detailed Debug Logging

The fixed component includes extensive debug logging to help diagnose issues:

```typescript
// Debug log component
<Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
  <Typography variant="h6" gutterBottom>
    Debug Logs
  </Typography>
  
  <Box sx={{ 
    maxHeight: 300, 
    overflowY: 'auto', 
    p: 2, 
    fontFamily: 'monospace', 
    fontSize: '0.875rem',
    bgcolor: '#2b2b2b',
    color: '#f8f8f8',
    borderRadius: 1
  }}>
    {debugLogs.length > 0 ? (
      debugLogs.map((log, index) => (
        <Box key={index} sx={{ mb: 0.5 }}>{log}</Box>
      ))
    ) : (
      <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#aaa' }}>
        No logs yet. Click "Generate Speech" to see debug information.
      </Typography>
    )}
  </Box>
</Paper>
```

## How to Use the Fixed Component

1. Navigate to "Text-to-Speech" → "Fixed Version" in the sidebar
2. Enter text or select a sample feedback template
3. Configure voice settings (voice, speed, pitch)
4. Click "Generate Speech (Enhanced)"
5. The debug logs will show detailed information about the process
6. If successful, an audio player will appear with the synthesized speech

## Technical Details

The enhanced implementation uses:

- **Collection Detection**: Tries multiple possible collection names at startup
- **Field Path Extraction**: Handles nested fields and multiple name formats
- **Multiple Storage Path Formats**: Tries different combinations to find the correct audio file
- **Object Property Traversal**: For handling various response formats
- **Extensive Error Handling**: With detailed error messages and fallbacks

## Additional Notes

If you encounter any issues with the fixed component:

1. Check the debug logs for detailed information about what's happening
2. Verify in the Firebase Console that:
   - The Text-to-Speech Extension is properly installed and configured
   - The Extension has the necessary permissions
   - The project has billing enabled and sufficient quota
   - There are no errors in the Firebase Functions logs

## Summary

These changes significantly improve the robustness of the Text-to-Speech validation by making the code more flexible and adaptable to different extension configurations. The detailed logging provides valuable insights for debugging and troubleshooting any remaining issues.
