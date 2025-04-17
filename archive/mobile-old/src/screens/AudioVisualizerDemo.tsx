import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  NativeModules,
} from 'react-native';
import { AudioVisualizer, CircularAudioVisualizer } from '../components/AudioVisualizer';

const { AudioSessionModule } = NativeModules;

interface AudioVisualizerDemoProps {
  navigation?: any;
}

const AudioVisualizerDemo: React.FC<AudioVisualizerDemoProps> = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  // Function to check microphone permissions
  const checkPermissions = async () => {
    if (Platform.OS === 'ios' && AudioSessionModule?.checkMicrophoneAuthorization) {
      try {
        const status = await AudioSessionModule.checkMicrophoneAuthorization();
        setPermissionStatus(status);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setPermissionStatus('error');
      }
    }
  };

  // Function to configure audio session
  const configureAudioSession = async () => {
    if (Platform.OS === 'ios' && AudioSessionModule?.configureAudioSession) {
      try {
        await AudioSessionModule.configureAudioSession();
        if (AudioSessionModule.optimizeForSpeechRecognition) {
          await AudioSessionModule.optimizeForSpeechRecognition();
        }
      } catch (error) {
        console.error('Error configuring audio session:', error);
      }
    }
  };

  // Handle start/stop recording
  const toggleRecording = async () => {
    if (!isRecording) {
      // Check permissions before starting
      await checkPermissions();
      if (permissionStatus !== 'authorized') {
        console.log('Microphone permission not granted');
        return;
      }
      
      // Configure audio session
      await configureAudioSession();
    }
    
    setIsRecording(!isRecording);
  };
  
  // Cleanup when component unmounts
  React.useEffect(() => {
    // Check initial permissions
    checkPermissions();
    
    return () => {
      // Make sure to stop recording when component unmounts
      if (isRecording) {
        setIsRecording(false);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>SpeakBetter Audio Visualizer</Text>
        
        <Text style={styles.sectionTitle}>Microphone Permission</Text>
        <Text style={styles.permissionStatus}>
          Status: {permissionStatus || 'unknown'}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.button,
            isRecording ? styles.stopButton : styles.startButton,
          ]}
          onPress={toggleRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Bar Visualizer</Text>
        <View style={styles.visualizerContainer}>
          <AudioVisualizer 
            isRecording={isRecording}
            style={styles.barVisualizer}
            barCount={30}
            barWidth={4}
            barSpacing={2}
            minBarHeight={5}
            maxBarHeight={80}
          />
        </View>
        
        <Text style={styles.sectionTitle}>Circular Visualizer</Text>
        <View style={styles.visualizerContainer}>
          <CircularAudioVisualizer
            isRecording={isRecording}
            size={150}
            minInnerSize={50}
            maxInnerSize={120}
          />
        </View>
        
        <Text style={styles.sectionTitle}>Customized Bar Visualizer</Text>
        <View style={styles.visualizerContainer}>
          <AudioVisualizer 
            isRecording={isRecording}
            style={styles.customBarVisualizer}
            barCount={15}
            barWidth={8}
            barSpacing={4}
            lowColor="#4CAF50"
            highColor="#F44336"
            barBorderRadius={4}
          />
        </View>
        
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4A55A2',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333333',
  },
  permissionStatus: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666666',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 15,
  },
  startButton: {
    backgroundColor: '#4A55A2',
  },
  stopButton: {
    backgroundColor: '#FF7043',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  visualizerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  barVisualizer: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#F0F5FF',
  },
  customBarVisualizer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  spacer: {
    height: 50,
  },
});

export default AudioVisualizerDemo;
