import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';

interface FamilyMemberCircleProps {
  name: string;
  image: ImageSourcePropType;
  onPress?: () => void;
}

const FamilyMemberCircle: React.FC<FamilyMemberCircleProps> = ({ name, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={image} style={styles.image} />
      <Text style={styles.name}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '33%',
    marginBottom: 20,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    color: '#2F4858',
    fontWeight: '500',
  },
});

export default FamilyMemberCircle;
