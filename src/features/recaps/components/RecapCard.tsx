import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../theme/colors';

interface RecapCardProps {
  id: string;
  image: any; 
  title: string;
  date: string;
}

const RecapCard: React.FC<RecapCardProps> = ({ id, image, title, date }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      onPress={() => router.push({ pathname: '/(main)/recaps/[id]', params: { id } })} 
      style={styles.card}
    >
      <ImageBackground source={image} style={styles.imageBackground} imageStyle={styles.image} resizeMode="cover">
        <View style={styles.overlay}>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </ImageBackground>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  imageBackground: {
    height: 200,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 15, // Match card's border radius, with 1px inset
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
  },
  cardTitle: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
  cardFooter: {
    padding: 16,
  },
  cardDate: {
    fontSize: 14,
    color: Colors.darkGrey,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default RecapCard;
