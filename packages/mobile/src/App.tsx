import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// This is a placeholder component that will be replaced in Phase 2
const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SpeakBetter Mobile</Text>
      <Text style={styles.subtext}>This is a placeholder component for Phase 1</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A55A2',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
  },
});

export default App;
