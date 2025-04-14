import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Button,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { AudioVisualizer } from "../components/audio";
import AudioSession from "../services/AudioSession";

/**
 * Example component demonstrating the AudioVisualizer component with live recording
 */
const AudioVisualizerExample = () => {
  // Use the audio recording hook
  const {
    isRecording,
    isProcessing,
    duration,
    audioLevel,
    visualizationData,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  } = useAudioRecording();

  // Selected visualization type
  const [visualizationType, setVisualizationType] = useState<
    "bars" | "wave" | "circle" | "dots"
  >("bars");

  // Configure audio session when component mounts
  useEffect(() => {
    // Configure audio session for recording
    AudioSession.configureAudioSession("recording")
      .then(() => console.log("Audio session configured"))
      .catch((err) => console.error("Failed to configure audio session", err));

    // Clean up on unmount
    return () => {
      AudioSession.deactivateAudioSession().catch((err) =>
        console.error("Failed to deactivate audio session", err),
      );
    };
  }, []);

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      await startRecording({
        maxDuration: 60, // 60 seconds max
        silenceThreshold: 0.05,
        autoStop: false,
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  // Handle recording stop
  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording();
      console.log("Recording stopped, blob size:", audioBlob.size);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Audio Visualizer Example</Text>

        {/* Audio level display */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Duration: {duration.toFixed(1)}s</Text>
          <Text style={styles.infoText}>
            Audio Level: {(audioLevel * 100).toFixed(0)}%
          </Text>
          {error && (
            <Text style={styles.errorText}>Error: {error.message}</Text>
          )}
        </View>

        {/* Visualization type selector */}
        <View style={styles.visualizationTypeContainer}>
          <Text style={styles.sectionTitle}>Visualization Type:</Text>
          <View style={styles.typeButtons}>
            {(["bars", "wave", "circle", "dots"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  visualizationType === type && styles.selectedTypeButton,
                ]}
                onPress={() => setVisualizationType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    visualizationType === type && styles.selectedTypeButtonText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visualizers */}
        <View style={styles.visualizersContainer}>
          <Text style={styles.sectionTitle}>Audio Visualization:</Text>

          {/* Current selected visualization */}
          <View style={styles.currentVisualization}>
            <AudioVisualizer
              audioData={visualizationData}
              isRecording={isRecording}
              type={visualizationType}
              style={styles.visualizer}
              numberOfBars={32}
              options={{
                responsive: true,
                dynamicHeight: true,
                sensitivity: 1.5,
                minBarHeight: 3,
              }}
            />
          </View>

          {/* Recording controls */}
          <View style={styles.controlsContainer}>
            {!isRecording ? (
              <Button
                title="Start Recording"
                onPress={handleStartRecording}
                disabled={isProcessing}
              />
            ) : (
              <View style={styles.recordingControls}>
                <Button
                  title="Stop"
                  onPress={handleStopRecording}
                  disabled={isProcessing}
                  color="#E53935"
                />
                <View style={{ width: 16 }} />
                <Button
                  title="Cancel"
                  onPress={cancelRecording}
                  disabled={isProcessing}
                  color="#9E9E9E"
                />
              </View>
            )}
          </View>
        </View>

        {/* Show all visualization types for comparison */}
        <View style={styles.allVisualizationsContainer}>
          <Text style={styles.sectionTitle}>All Visualization Types:</Text>

          <View style={styles.visualizerContainer}>
            <Text style={styles.visualizerLabel}>Bars:</Text>
            <AudioVisualizer
              audioData={visualizationData}
              isRecording={isRecording}
              type="bars"
              style={styles.smallVisualizer}
              numberOfBars={16}
            />
          </View>

          <View style={styles.visualizerContainer}>
            <Text style={styles.visualizerLabel}>Wave:</Text>
            <AudioVisualizer
              audioData={visualizationData}
              isRecording={isRecording}
              type="wave"
              style={styles.smallVisualizer}
              numberOfBars={32}
            />
          </View>

          <View style={styles.visualizerContainer}>
            <Text style={styles.visualizerLabel}>Circle:</Text>
            <AudioVisualizer
              audioData={visualizationData}
              isRecording={isRecording}
              type="circle"
              style={styles.smallVisualizer}
              options={{
                color: "#4CAF50",
              }}
            />
          </View>

          <View style={styles.visualizerContainer}>
            <Text style={styles.visualizerLabel}>Dots:</Text>
            <AudioVisualizer
              audioData={visualizationData}
              isRecording={isRecording}
              type="dots"
              style={styles.smallVisualizer}
              numberOfBars={12}
              options={{
                color: "#FF7043",
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#4A55A2",
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#E53935",
    marginTop: 8,
  },
  visualizationTypeContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333333",
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#F0F5FF",
    marginBottom: 8,
    minWidth: "22%",
    alignItems: "center",
  },
  selectedTypeButton: {
    backgroundColor: "#4A55A2",
  },
  typeButtonText: {
    color: "#4A55A2",
    fontWeight: "500",
  },
  selectedTypeButtonText: {
    color: "#FFFFFF",
  },
  visualizersContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentVisualization: {
    marginBottom: 16,
    height: 80,
    justifyContent: "center",
  },
  visualizer: {
    height: 80,
    width: "100%",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  recordingControls: {
    flexDirection: "row",
    justifyContent: "center",
  },
  allVisualizationsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  visualizerContainer: {
    marginBottom: 16,
  },
  visualizerLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#666666",
  },
  smallVisualizer: {
    height: 40,
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
  },
});

export default AudioVisualizerExample;
