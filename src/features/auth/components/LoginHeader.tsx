import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../theme';

interface LoginHeaderProps {
  title: string;
  onRightPress?: () => void;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ title, onRightPress }) => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Feather name="x" size={24} color={Colors.darkGrey} />
        </TouchableOpacity>
        
        <Text style={styles.title}>{title}</Text>
        
        <TouchableOpacity onPress={onRightPress} style={styles.iconButton} disabled={!onRightPress}>
          <Image source={require('../../../assets/images/Logo_Icon_small.png')} style={styles.iconButtonpic} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    backgroundColor: Colors.white,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGrey,
  },
  iconButton: {
    padding: 5,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonpic: {

    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  rightPlaceholder: {
    width: 44, 
  },
});

export default LoginHeader;
