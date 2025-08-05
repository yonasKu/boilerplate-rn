import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RecapCardProps {
  id: string;
  image: any; // Or a more specific type like ImageSourcePropType
  title: string;
  date: string;
}

const RecapCard: React.FC<RecapCardProps> = ({ id, image, title, date }) => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push({ pathname: '/(main)/recaps/[id]', params: { id } })} style={styles.cardContainer}>
      <ImageBackground source={image} style={styles.imageBackground} imageStyle={styles.imageStyle} resizeMode="cover">
        <Text style={styles.cardTitle}>{title}</Text>
      </ImageBackground>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{date}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="#A9A9A9" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#A9A9A9" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 1.5, // Android
    shadowColor: '#000', // iOS & Android
    shadowOffset: { width: 0, height: 1 }, // iOS
    shadowOpacity: 0.05, // iOS
    shadowRadius: 2, // iOS
  },
  imageBackground: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default RecapCard;
