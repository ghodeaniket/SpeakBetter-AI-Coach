import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";
import EnvTestScreen from "./EnvTestScreen";
import Config from "react-native-config";

export default function TestApp() {
  // Log environment variables for debugging
  console.log("Environment variables loaded:", Config);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.title}>SpeakBetter Mobile Test App</Text>
        <EnvTestScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#4a55a2",
    textAlign: "center",
  },
});
