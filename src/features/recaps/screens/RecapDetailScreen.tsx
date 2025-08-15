import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RecapDetailScreen = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader showBackButton />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.recapInfoBar}>
          <Text style={styles.dateText}>Week of July 15</Text>
          <View style={styles.participantsContainer}>
            <View style={[styles.participantCircle, { backgroundColor: '#D57A66' }]}><Text style={styles.participantInitial}>A</Text></View>
            <View style={[styles.participantCircle, { backgroundColor: '#5D6D7E' }]}><Text style={styles.participantInitial}>S</Text></View>
            <View style={[styles.participantCircle, { backgroundColor: '#5D9275' }]}><Text style={styles.participantInitial}>B+</Text></View>
            <TouchableOpacity style={styles.addParticipantCircle}>
              <Ionicons name="add" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

      <View style={styles.imageContainer}>
        <Image source={require('../../../assets/images/sample_recap.png')} style={styles.mainImage} />
        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>1/4</Text>
        </View>
      </View>

      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={26} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color="#A9A9A9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={26} color="#A9A9A9" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Image source={require('../../../assets/images/edit-2_icon.png')} style={styles.editIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sienna's First Steps</Text>
        <Text style={styles.description}>
          This is where we'll have a summary of that week's journal entries. People should be able to leave comments and "like". From here you'll scroll through photos and read the summary. When finished you can hit "book" to memories or use the bottom nav.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20, 
  },
  recapInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    //paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -4,
  },
  participantInitial: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addParticipantCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  imageContainer: {
    marginVertical: 10,
  },
  mainImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderRadius: 22,
  },
  imageCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFF',
    fontSize: 12,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    width: 26,
    height: 26,
  },
  editIcon: {
    width: 26,
    height: 26,
  },
  contentContainer: {
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2F4858',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default RecapDetailScreen;
