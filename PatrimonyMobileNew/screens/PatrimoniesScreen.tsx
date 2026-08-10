import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

const PatrimoniesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Patrimônios</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Lista de patrimônios em desenvolvimento</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default PatrimoniesScreen;
