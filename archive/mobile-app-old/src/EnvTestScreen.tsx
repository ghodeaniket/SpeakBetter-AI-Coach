import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Config from "react-native-config";

const EnvTestScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Environment Variables Test</Text>

        <View style={styles.envContainer}>
          <Text style={styles.envTitle}>Firebase Config:</Text>
          <Text style={styles.envItem}>API Key: {Config.FIREBASE_API_KEY}</Text>
          <Text style={styles.envItem}>
            Auth Domain: {Config.FIREBASE_AUTH_DOMAIN}
          </Text>
          <Text style={styles.envItem}>
            Project ID: {Config.FIREBASE_PROJECT_ID}
          </Text>
          <Text style={styles.envItem}>
            Storage Bucket: {Config.FIREBASE_STORAGE_BUCKET}
          </Text>
          <Text style={styles.envItem}>
            Messaging Sender ID: {Config.FIREBASE_MESSAGING_SENDER_ID}
          </Text>
          <Text style={styles.envItem}>App ID: {Config.FIREBASE_APP_ID}</Text>
        </View>

        <View style={styles.envContainer}>
          <Text style={styles.envTitle}>Google Cloud Config:</Text>
          <Text style={styles.envItem}>
            API Key: {Config.GOOGLE_CLOUD_API_KEY}
          </Text>
        </View>

        <Text style={styles.note}>
          If you can see the environment variables above, then
          react-native-config is working correctly!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#4a55a2",
    textAlign: "center",
  },
  envContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  envTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  envItem: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
    fontFamily: "monospace",
  },
  note: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#4caf50",
    textAlign: "center",
    marginTop: 20,
  },
});

export default EnvTestScreen;
