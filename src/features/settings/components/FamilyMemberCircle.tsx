import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Colors } from '../../../theme/colors';
import { generateAvatarStyle, getInitials, getContrastingTextColorForName } from '../../../utils/avatarUtils';

interface FamilyMemberCircleProps {
  name: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
  selected?: boolean;
  hideName?: boolean;
}

const FamilyMemberCircle: React.FC<FamilyMemberCircleProps> = ({ name, image, onPress, selected, hideName }) => {
  const renderAvatar = () => {
    if (image) {
      return <Image source={image} style={[styles.image, selected ? styles.imageSelected : undefined]} />;
    }
    const initials = getInitials(name);
    const bgStyle = generateAvatarStyle(name);
    const textColor = getContrastingTextColorForName(name);
    return (
      <View style={[styles.image, bgStyle, selected ? styles.imageSelected : undefined]}>
        <Text style={[styles.initials, { color: textColor }]}>{initials}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {renderAvatar()}
      {!hideName && <Text style={styles.name}>{name}</Text>}
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
  initials: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
  },
  name: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins-Regular',
  },
});

export default FamilyMemberCircle;
