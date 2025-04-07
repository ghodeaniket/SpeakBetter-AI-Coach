import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AudioRecorder from '../../components/AudioRecorder';

// This component is for testing WebRTC compatibility across browsers
// In Sprint 0, we're validating that audio recording works reliably

interface CompatibilityResult {
  feature: string;
  supported: boolean;
  notes?: string;
}

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  isSupported: boolean;
}

const WebRTCCompatibilityTest: React.FC = () => {
  const [compatibilityResults, setCompatibilityResults] = useState<CompatibilityResult[]>([]);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [audioRecordingWorks, setAudioRecordingWorks] = useState<boolean | null>(null);
  const [testNotes, setTestNotes] = useState('');
  const [notesSubmitted, setNotesSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect browser information
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "Unknown";
      let os = "Unknown";
      
      // Detect browser
      if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
      } else if (userAgent.indexOf("SamsungBrowser") > -1) {
        browserName = "Samsung Browser";
      } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
        browserName = "Opera";
      } else if (userAgent.indexOf("Trident") > -1) {
        browserName = "Internet Explorer";
      } else if (userAgent.indexOf("Edge") > -1) {
        browserName = "Edge (Legacy)";
      } else if (userAgent.indexOf("Edg") > -1) {
        browserName = "Edge Chromium";
      } else if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
      } else if (userAgent.indexOf("Safari") > -1) {
        browserName = "Safari";
      }
      
      // Extract version
      let versionMatch;
      if (browserName === "Firefox") {
        versionMatch = userAgent.match(/Firefox\/([0-9.]+)/);
      } else if (browserName === "Chrome") {
        versionMatch = userAgent.match(/Chrome\/([0-9.]+)/);
      } else if (browserName === "Safari") {
        versionMatch = userAgent.match(/Version\/([0-9.]+)/);
      } else if (browserName === "Edge Chromium") {
        versionMatch = userAgent.match(/Edg\/([0-9.]+)/);
      }
      
      if (versionMatch && versionMatch.length >= 2) {
        browserVersion = versionMatch[1];
      }
      
      // Detect OS
      if (userAgent.indexOf("Win") > -1) {
        os = "Windows";
      } else if (userAgent.indexOf("Mac") > -1) {
        os = "MacOS";
      } else if (userAgent.indexOf("Linux") > -1) {
        os = "Linux";
      } else if (userAgent.indexOf("Android") > -1) {
        os = "Android";
      } else if (userAgent.indexOf("iOS") > -1 || (userAgent.indexOf("iPad") > -1 || userAgent.indexOf("iPhone") > -1)) {
        os = "iOS";
      }
      
      // Check if this browser is officially supported
      const isSupported = (
        (browserName === "Chrome" && parseFloat(browserVersion) >= 74) ||
        (browserName === "Firefox" && parseFloat(browserVersion) >= 66) ||
        (browserName === "Safari" && parseFloat(browserVersion) >= 12.1) ||
        (browserName === "Edge Chromium" && parseFloat(browserVersion) >= 79)
      );
      
      setBrowserInfo({
        name: browserName,
        version: browserVersion,
        os,
        isSupported
      });
    };
    
    // Test WebRTC compatibility
    const testWebRTCCompatibility = async () => {
      const results: CompatibilityResult[] = [];
      
      // Check getUserMedia support
      results.push({
        feature: "navigator.mediaDevices.getUserMedia",
        supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        notes: navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 
          "Audio capture API is supported" : 
          "Audio capture API is not supported"
      });
      
      // Check MediaRecorder API support
      results.push({
        feature: "MediaRecorder API",
        supported: typeof MediaRecorder !== 'undefined',
        notes: typeof MediaRecorder !== 'undefined' ? 
          "Recording API is supported" : 
          "Recording API is not supported"
      });
      
      // Check AudioContext support
      results.push({
        feature: "AudioContext",
        supported: typeof (window.AudioContext || (window as any).webkitAudioContext) !== 'undefined',
        notes: typeof (window.AudioContext || (window as any).webkitAudioContext) !== 'undefined' ? 
          "Audio processing API is supported" : 
          "Audio processing API is not supported"
      });
      
      // Check supported mimeTypes
      if (typeof MediaRecorder !== 'undefined') {
        const mimeTypes = [
          'audio/webm',
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/mp4;codecs=mp4a.40.2'
        ];
        
        const supportedTypes = mimeTypes.filter(type => {
          try {
            return MediaRecorder.isTypeSupported(type);
          } catch (e) {
            return false;
          }
        });
        
        results.push({
          feature: "Supported Audio Formats",
          supported: supportedTypes.length > 0,
          notes: supportedTypes.length > 0 ? 
            `Supported formats: ${supportedTypes.join(', ')}` : 
            "No supported audio formats detected"
        });
      }
      
      setCompatibilityResults(results);
      setLoading(false);
    };
    
    detectBrowser();
    testWebRTCCompatibility();
  }, []);
  
  const handleAudioCaptured = (blob: Blob) => {
    // Successfully captured audio - mark as working
    setAudioRecordingWorks(true);
  };
  
  const handleNotesSubmit = () => {
    // In a real implementation, we would send this to a database
    console.log('Test notes submitted:', testNotes);
    setNotesSubmitted(true);
  };

  const getOverallCompatibility = (): 'full' | 'partial' | 'incompatible' => {
    if (!compatibilityResults.length) return 'incompatible';
    
    const essentialFeatures = [
      "navigator.mediaDevices.getUserMedia",
      "MediaRecorder API"
    ];
    
    const essentialSupported = essentialFeatures.every(
      feature => compatibilityResults.find(r => r.feature === feature)?.supported
    );
    
    if (essentialSupported) {
      const allSupported = compatibilityResults.every(r => r.supported);
      return allSupported ? 'full' : 'partial';
    }
    
    return 'incompatible';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        WebRTC Compatibility Testing
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component validates browser compatibility for audio recording using WebRTC.
        It tests critical features needed for the SpeakBetter AI Coach audio capture.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Browser information */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Browser Information
            </Typography>
            
            {browserInfo && (
              <>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item>
                    <Chip 
                      icon={browserInfo.isSupported ? 
                        <CheckCircleOutlineIcon /> : 
                        <WarningAmberIcon />
                      }
                      label={browserInfo.isSupported ? "Officially Supported" : "Limited Support"}
                      color={browserInfo.isSupported ? "success" : "warning"}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant="body1">
                      {browserInfo.name} {browserInfo.version} on {browserInfo.os}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Typography variant="body2" color="text.secondary">
                  {browserInfo.isSupported ? 
                    "This browser is fully compatible with all WebRTC features needed for SpeakBetter." : 
                    "This browser may have limited compatibility. We recommend using Chrome, Firefox, Safari, or Edge."
                  }
                </Typography>
              </>
            )}
          </Paper>
          
          {/* Feature compatibility */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              WebRTC Compatibility Results
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={
                  getOverallCompatibility() === 'full' ? "Fully Compatible" :
                  getOverallCompatibility() === 'partial' ? "Partially Compatible" :
                  "Not Compatible"
                }
                color={
                  getOverallCompatibility() === 'full' ? "success" :
                  getOverallCompatibility() === 'partial' ? "warning" :
                  "error"
                }
                sx={{ mb: 2 }}
              />
            </Box>
            
            <List>
              {compatibilityResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {result.supported ? (
                        <CheckCircleOutlineIcon color="success" />
                      ) : (
                        <ErrorOutlineIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.feature}
                      secondary={result.notes}
                    />
                  </ListItem>
                  {index < compatibilityResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          {/* Live test with AudioRecorder */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Live Recording Test
            </Typography>
            
            <Typography variant="body2" paragraph>
              Try recording audio to validate that browser implementation works correctly.
              This tests the complete audio capture process including microphone access,
              recording, and audio processing.
            </Typography>
            
            <AudioRecorder 
              onAudioCaptured={handleAudioCaptured}
              maxDuration={10} // Short test recording
            />
            
            {audioRecordingWorks === true && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Audio recording works correctly in this browser! ✓
              </Alert>
            )}
          </Paper>
          
          {/* Test feedback */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Feedback
            </Typography>
            
            <Typography variant="body2" paragraph>
              Please provide any additional observations about audio recording quality,
              performance issues, or browser-specific behavior you noticed during testing.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Test Notes"
              variant="outlined"
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              disabled={notesSubmitted}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              onClick={handleNotesSubmit}
              disabled={!testNotes.trim() || notesSubmitted}
            >
              Submit Notes
            </Button>
            
            {notesSubmitted && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Thank you for your feedback! Your notes will help improve browser compatibility.
              </Alert>
            )}
          </Paper>
        </>
      )}
      
      {/* Implementation notes for Sprint 0 */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2">Sprint 0 Implementation Notes:</Typography>
        <Typography variant="body2">
          This component tests browser compatibility with WebRTC audio recording features.
          For Sprint 0, we detect and validate the core APIs needed for SpeakBetter's audio
          recording functionality. In the actual implementation, we would also collect and
          analyze compatibility data from different browsers and devices.
        </Typography>
      </Paper>
    </Box>
  );
};

export default WebRTCCompatibilityTest;
