import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Colors } from '../../../theme/colors';

interface FamilyMemberCircleProps {
  name: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  selected?: boolean;
}

const FamilyMemberCircle: React.FC<FamilyMemberCircleProps> = ({ name, image, onPress, selected }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={image} style={[styles.image, selected ? styles.imageSelected : undefined]} />
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
  imageSelected: {
    borderWidth: 4,
    borderColor: Colors.secondary,
  },
  name: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins-Regular',
  },
});

export default FamilyMemberCircle;
