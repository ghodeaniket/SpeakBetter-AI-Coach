import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import {
  AudioSession,
  AudioSessionInfo,
  AudioSessionInterruptionType,
} from "../services/AudioSession";

const AudioSessionExample = () => {
  const [sessionInfo, setSessionInfo] = useState<AudioSessionInfo | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Configure audio session when component mounts
  useEffect(() => {
    // Set up audio session interruption listener
    const interruptionListener = AudioSession.addListener(
      "audioSessionInterruption",
      (event) => {
        if (event.type === AudioSessionInterruptionType.BEGAN) {
          console.log("Audio session interrupted");
          setIsActive(false);
        } else if (event.type === AudioSessionInterruptionType.ENDED) {
          console.log("Audio session interruption ended");
          // Optionally reconfigure the session
        }
      },
    );

    // Set up audio route change listener
    const routeChangeListener = AudioSession.addListener(
      "audioRouteChange",
      (event) => {
        console.log("Audio route changed:", event);
        // Update the session info when route changes
        refreshSessionInfo();
      },
    );

    // Return cleanup function
    return () => {
      interruptionListener();
      routeChangeListener();

      // Deactivate audio session when component unmounts
      AudioSession.deactivateAudioSession().catch((error) =>
        console.error("Failed to deactivate audio session", error),
      );
    };
  }, []);

  // Function to refresh session info
  const refreshSessionInfo = async () => {
    try {
      const info = await AudioSession.getAudioSessionInfo();
      setSessionInfo(info);
    } catch (error) {
      console.error("Failed to get audio session info", error);
      Alert.alert("Error", "Failed to get audio session information");
    }
  };

  // Function to activate recording mode
  const activateRecordingMode = async () => {
    try {
      await AudioSession.configureAudioSession("recording");
      setIsActive(true);
      refreshSessionInfo();
    } catch (error) {
      console.error("Failed to configure audio session", error);
      Alert.alert("Error", "Failed to configure audio session for recording");
    }
  };

  // Function to activate playback mode
  const activatePlaybackMode = async () => {
    try {
      await AudioSession.configureAudioSession("playback");
      setIsActive(true);
      refreshSessionInfo();
    } catch (error) {
      console.error("Failed to configure audio session", error);
      Alert.alert("Error", "Failed to configure audio session for playback");
    }
  };

  // Function to deactivate session
  const deactivateSession = async () => {
    try {
      await AudioSession.deactivateAudioSession();
      setIsActive(false);
      refreshSessionInfo();
    } catch (error) {
      console.error("Failed to deactivate audio session", error);
      Alert.alert("Error", "Failed to deactivate audio session");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Session Example</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Configure for Recording"
          onPress={activateRecordingMode}
          disabled={isActive}
        />
        <Button
          title="Configure for Playback"
          onPress={activatePlaybackMode}
          disabled={isActive}
        />
        <Button
          title="Deactivate Session"
          onPress={deactivateSession}
          disabled={!isActive}
        />
        <Button title="Refresh Info" onPress={refreshSessionInfo} />
      </View>

      {sessionInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Audio Session Info:</Text>
          <Text>Sample Rate: {sessionInfo.sampleRate} Hz</Text>
          <Text>Output Channels: {sessionInfo.outputChannels}</Text>
          <Text>Input Channels: {sessionInfo.inputChannels}</Text>
          <Text>Buffer Duration: {sessionInfo.bufferDuration * 1000} ms</Text>
          <Text>
            Input Available: {sessionInfo.isInputAvailable ? "Yes" : "No"}
          </Text>

          <Text style={styles.sectionTitle}>Current Route:</Text>

          <Text style={styles.subSectionTitle}>Inputs:</Text>
          {sessionInfo.currentRoute.inputs.length > 0 ? (
            sessionInfo.currentRoute.inputs.map((input, index) => (
              <Text key={`input-${index}`}>
                {input.name} ({input.type})
              </Text>
            ))
          ) : (
            <Text>No input devices</Text>
          )}

          <Text style={styles.subSectionTitle}>Outputs:</Text>
          {sessionInfo.currentRoute.outputs.length > 0 ? (
            sessionInfo.currentRoute.outputs.map((output, index) => (
              <Text key={`output-${index}`}>
                {output.name} ({output.type})
              </Text>
            ))
          ) : (
            <Text>No output devices</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4a55a2",
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  infoContainer: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#4a55a2",
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
});

export default AudioSessionExample;
