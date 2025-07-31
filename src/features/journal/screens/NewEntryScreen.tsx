import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewEntryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>New Entry Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});

export default NewEntryScreen;
