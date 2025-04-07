import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AudioRecorder from '../../components/AudioRecorder';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  wordLevelInfo?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
  fillerWords?: {
    count: number;
    words: Array<{
      word: string;
      timestamp: number;
    }>;
  };
}

const SpeechToTextDirect: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to add debug messages with local time
  const addDebugMessage = (message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString(); // Local timezone
    setDebugLogs(prev => [...prev, `${timeString} - ${message}`]);
    console.log(`${timeString} - ${message}`);
  };

  // Function to upload audio to Firebase Storage and get a public URL
  const uploadAudio = async (blob: Blob): Promise<string> => {
    try {
      // Create a unique file name with timestamp
      const timestamp = new Date().getTime();
      const fileName = `speech_samples/test_${timestamp}.webm`;
      const storageRef = ref(storage, fileName);
      
      addDebugMessage(`Uploading audio to ${fileName}...`);
      