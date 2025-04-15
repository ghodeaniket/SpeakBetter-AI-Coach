import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { useAudioRecording, useSpeechAnalysis } from '../../hooks';
import * as Haptics from 'expo-haptics';
import { useNetwork } from '../../contexts';
import { 
  FreestylePractice, 
  GuidedPractice,
  QAPractice 
} from './PracticeModes';
import { useNavigation } from '@react-navigation/native';

export const PracticeScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('freestyle');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopping' | 'processing'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const navigation = useNavigation();
  const theme = useTheme();
  const { isConnected } = useNetwork();
  
  // Timer ref for recording
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use our custom hooks
  const { 
    isRecording, 
    duration, 
    startRecording, 
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording
  } = useAudioRecording({
    maxDuration: 180, // 3 minutes max
    autoStop: true
  });
  
  const {
    isAnalyzing,
    progress: analysisProgress,
    analyzeAudio
  } = useSpeechAnalysis();
  
  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Start timer for recording
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recordingState]);
  
  // Update elapsed time from duration
  useEffect(() => {
    if (isRecording) {
      setElapsedTime(Math.floor(duration));
    }
  }, [duration, isRecording]);
  
  const handleStartRecording = async () => {
    // Check if content is selected for guided modes
    if ((selectedTab === 'guided' || selectedTab === 'qa') && !selectedContent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'No Content Selected', 
        selectedTab === 'guided' 
          ? 'Please select a script to practice with.'
          : 'Please select a question to practice with.'
      );
      return;
    }
    
    // Check network connectivity for speech analysis
    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Offline Mode',
        'You are currently offline. You can record, but speech analysis will not be available until you reconnect.',
        [
          { text: 'Continue Anyway', onPress: () => proceedWithRecording() }, 
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    proceedWithRecording();
  };
  
  const proceedWithRecording = async () => {
    try {
      setRecordingState('recording');
      setElapsedTime(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Try to start recording with max 3 retries
      let retryAttempt = 0;
      const maxRetries = 3;
      
      const attemptStartRecording = async (): Promise<void> => {
        try {
          await startRecording();
        } catch (error) {
          retryAttempt++;
          console.error(`Recording start failed (attempt ${retryAttempt}/${maxRetries})`, error);
          
          if (retryAttempt < maxRetries) {
            // Let the user know we're retrying
            if (retryAttempt === 1) {
              // Only show alert on first retry
              Alert.alert(
                'Recording Issue',
                'Had trouble starting the recording. Retrying automatically...',
                [{ text: 'OK' }],
                { cancelable: true }
              );
            }
            
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 500));
            return attemptStartRecording();
          } else {
            // All retries failed
            setRecordingState('idle');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            // Show a more specific error message if available
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Failed to start recording. Please check app permissions.';
              
            Alert.alert(
              'Recording Error', 
              `Unable to start recording after multiple attempts. ${errorMessage}`
            );
          }
        }
      };
      
      await attemptStartRecording();
    } catch (error) {
      console.error('Failed to start recording', error);
      setRecordingState('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Recording Error', 'Failed to start recording. Please check app permissions.');
    }
  };
  
  const handleStopRecording = async () => {
    if (recordingState !== 'recording' && recordingState !== 'paused') return;
    
    try {
      setRecordingState('stopping');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Try to stop recording with max 3 retries
      let retryAttempt = 0;
      const maxRetries = 3;
      let audioBlob: Blob | null = null;
      
      const attemptStopRecording = async (): Promise<Blob | null> => {
        try {
          return await stopRecording();
        } catch (error) {
          retryAttempt++;
          console.error(`Recording stop failed (attempt ${retryAttempt}/${maxRetries})`, error);
          
          if (retryAttempt < maxRetries) {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 500));
            return attemptStopRecording();
          } else {
            // All retries failed
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            // Show a more specific error message if available
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Failed to stop recording properly.';
              
            Alert.alert(
              'Recording Error', 
              `Unable to finalize recording after multiple attempts. ${errorMessage}`,
              [{ text: 'OK' }]
            );
            
            // Force cancel the recording
            cancelRecording();
            setRecordingState('idle');
            return null;
          }
        }
      };
      
      audioBlob = await attemptStopRecording();
      
      // If we couldn't get a valid recording, exit early
      if (!audioBlob) {
        return;
      }
      
      // If online, proceed with analysis
      if (isConnected) {
        setRecordingState('processing');
        
        try {
          const result = await analyzeAudio(audioBlob, { 
            languageCode: 'en-US',
            enhancedModel: true
          });
          
          // Store the recording blob
          setRecordingBlob(audioBlob);
          
          // Navigate to results screen
          // @ts-ignore - navigation prop typing
          navigation.navigate('AnalysisResults', {
            result,
            audioBlob,
            practiceDuration: elapsedTime,
            practiceType: selectedTab,
            practiceContent: selectedContent || '',
          });
          
          // Reset recording state
          setRecordingState('idle');
          
        } catch (error) {
          console.error('Speech analysis failed', error);
          setRecordingState('idle');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          
          // Show a more specific error message if available
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to analyze your speech.';
            
          Alert.alert(
            'Analysis Error', 
            `Unable to analyze your speech. ${errorMessage}. Your recording has been saved.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // If offline, just finish recording
        setRecordingState('idle');
        Alert.alert(
          'Recording Complete', 
          'Your recording is complete, but speech analysis is not available while offline.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      setRecordingState('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  };
  
  const handlePauseResumeRecording = async () => {
    if (recordingState === 'recording') {
      try {
        await pauseRecording();
        setRecordingState('paused');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.error('Failed to pause recording', error);
      }
    } else if (recordingState === 'paused') {
      try {
        await resumeRecording();
        setRecordingState('recording');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.error('Failed to resume recording', error);
      }
    }
  };
  
  const handleCancelRecording = () => {
    if (recordingState === 'idle' || recordingState === 'processing') return;
    
    Alert.alert(
      'Cancel Recording', 
      'Are you sure you want to cancel this recording? All progress will be lost.',
      [
        { text: 'Continue Recording', style: 'cancel' },
        { 
          text: 'Cancel Recording', 
          style: 'destructive',
          onPress: () => {
            cancelRecording();
            setRecordingState('idle');
            setElapsedTime(0);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      ]
    );
  };
  
  // Content selection handlers
  const handleSelectTopic = (topic: string) => {
    setSelectedContent(topic);
  };
  
  const handleSelectScriptId = (scriptId: string) => {
    setSelectedContent(scriptId);
  };
  
  const handleSelectQuestion = (question: string) => {
    setSelectedContent(question);
  };
  
  // Render tab content
  const renderTabContent = () => {
    // Don't show selection when recording/processing
    if (recordingState !== 'idle') {
      return null;
    }
    
    switch (selectedTab) {
      case 'freestyle':
        return <FreestylePractice onSelectTopic={handleSelectTopic} />;
      case 'guided':
        return <GuidedPractice onSelectScriptId={handleSelectScriptId} />;
      case 'qa':
        return <QAPractice onSelectQuestion={handleSelectQuestion} />;
      default:
        return null;
    }
  };
  
  const styles = useStyles(theme => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.xl,
    },
    tab: {
      flex: 1,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabInactive: {
      backgroundColor: theme.colors.lightBg,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    tabTextInactive: {
      color: theme.colors.primary,
    },
    recorderContainer: {
      backgroundColor: theme.colors.lightBg,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      minHeight: 180,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    timerText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.lg,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    recordButton: {
      backgroundColor: theme.colors.primary,
    },
    stopButton: {
      backgroundColor: theme.colors.error,
    },
    pauseButton: {
      backgroundColor: theme.colors.warning,
    },
    submitButton: {
      backgroundColor: theme.colors.success,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.fontSize.lg,
    },
    cancelButton: {
      marginTop: theme.spacing.md,
    },
    cancelText: {
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.sm,
      textAlign: 'center',
    },
    helpText: {
      marginTop: theme.spacing.lg,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    processingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    processingText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    progressText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    contentPreview: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    contentPreviewText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
      fontStyle: 'italic',
    },
    contentTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
  }));
  
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'freestyle' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setSelectedTab('freestyle')}
            disabled={recordingState !== 'idle'}
          >
            <Text
              style={selectedTab === 'freestyle' ? styles.tabTextActive : styles.tabTextInactive}
            >
              Freestyle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'guided' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setSelectedTab('guided')}
            disabled={recordingState !== 'idle'}
          >
            <Text
              style={selectedTab === 'guided' ? styles.tabTextActive : styles.tabTextInactive}
            >
              Guided
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'qa' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setSelectedTab('qa')}
            disabled={recordingState !== 'idle'}
          >
            <Text
              style={selectedTab === 'qa' ? styles.tabTextActive : styles.tabTextInactive}
            >
              Q&A
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
        
        {selectedContent && recordingState === 'idle' && (
          <View style={styles.contentPreview}>
            <Text style={styles.contentTitle}>
              {selectedTab === 'freestyle' 
                ? 'Selected Topic:' 
                : selectedTab === 'guided'
                  ? 'Selected Script:'
                  : 'Selected Question:'
              }
            </Text>
            <Text style={styles.contentPreviewText}>
              {selectedContent}
            </Text>
          </View>
        )}

        <View style={styles.recorderContainer}>
          {recordingState === 'processing' ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.processingText}>Analyzing your speech...</Text>
              <Text style={styles.progressText}>
                {Math.floor(analysisProgress * 100)}% complete
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
              
              {/* Updated to use our new AudioVisualizer component */}
              <AudioVisualizer 
                isRecording={recordingState === 'recording'}
                style={{ width: '100%', height: 100 }}
                barCount={30}
                barWidth={3}
                barSpacing={3}
                minBarHeight={5}
                maxBarHeight={80}
                backgroundColor={theme.colors.lightBg}
                lowColor={theme.colors.primary}
                highColor={theme.colors.warning}
              />
            </>
          )}
        </View>

        {recordingState === 'idle' ? (
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.recordButton]}
              onPress={handleStartRecording}
            >
              <Feather name="mic" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : recordingState === 'recording' || recordingState === 'paused' ? (
          <>
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={[styles.controlButton, styles.pauseButton]}
                onPress={handlePauseResumeRecording}
              >
                <Feather 
                  name={recordingState === 'paused' ? 'play' : 'pause'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStopRecording}
              >
                <Feather name="square" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelRecording}
            >
              <Text style={styles.cancelText}>Cancel Recording</Text>
            </TouchableOpacity>
          </>
        ) : recordingState === 'stopping' ? (
          <View style={styles.controlsContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : null}

        {recordingState === 'idle' && (
          <Text style={styles.helpText}>
            Tap the microphone button to start recording. Recording will stop automatically after 3 minutes.
          </Text>
        )}
        
        {recordingState === 'recording' && (
          <Text style={styles.helpText}>
            Speak clearly and at a natural pace. Tap the square button when you're finished.
          </Text>
        )}
        
        {recordingState === 'paused' && (
          <Text style={styles.helpText}>
            Recording is paused. Tap play to continue or the square to finish recording.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
