import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Spacing } from '@/theme';

const Logo = () => {
  return (
    <View style={styles.container}>
      {/* We will use a placeholder for now. The actual logo image will be added to assets later. */}
      <Image 
        source={{ uri: 'https://placehold.co/100x100/5a8a5a/ffffff?text=Logo' }} 
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
});

export default Logo;
