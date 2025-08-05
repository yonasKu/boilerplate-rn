import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useJournal } from '@/hooks/useJournal';
import * as journalService from '@/services/journalService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';

const NewEntryScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addEntry, isLoading } = useJournal();

  const [entryText, setEntryText] = useState('');
  const [media, setMedia] = useState<Array<{ uri: string; type: 'image' | 'video' }>>([]); // Holds local file URIs and types
  const [isFavorited, setIsFavorited] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);
  const [childId, setChildId] = useState<string>('');
  const [children, setChildren] = useState<Array<{ id: string; name: string; dateOfBirth: Date }>>([]);

  // Load children on component mount
  useEffect(() => {
    const loadChildren = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      try {
        const q = query(collection(db, 'children'), where('parentId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const childrenData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateOfBirth: doc.data().dateOfBirth?.toDate ? doc.data().dateOfBirth.toDate() : new Date(doc.data().dateOfBirth)
        } as { id: string; name: string; dateOfBirth: Date }));
        
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setChildId(childrenData[0].id);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };
    
    loadChildren();
  }, []);

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: (asset as any).type === 'video' ? 'video' : 'image' as 'image' | 'video'
      }));
      setMedia(prevMedia => [...prevMedia, ...newMedia]);
    }
  };

  const handleSave = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }
    if (!childId) {
      Alert.alert('Select Child', 'Please select a child for this entry.');
      return;
    }
    
    try {
      // Get child's birth date for age calculation
      const selectedChild = children.find(c => c.id === childId);
      if (!selectedChild) {
        Alert.alert('Error', 'Could not find child information.');
        return;
      }
      
      const childAgeAtEntry = journalService.calculateChildAgeAtDate(
        selectedChild.dateOfBirth,
        new Date()
      );
      
      console.log('Starting journal entry creation...');
      console.log('Entry data:', { 
        text: entryText.substring(0, 50) + '...', 
        mediaCount: media.length, 
        isFavorited, 
        isMilestone,
        childId,
        childAgeAtEntry
      });
      
      await addEntry({ 
        text: entryText, 
        media, 
        isFavorited, 
        isMilestone,
        childId,
        childAgeAtEntry
      });
      
      console.log('Journal entry created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        userId: getAuth().currentUser?.uid,
        childId,
        mediaCount: media.length
      });
      
      Alert.alert(
        'Save Failed', 
        `Could not save your entry: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      );
    }
  };

  const renderHeaderRight = () => {
    if (isLoading) {
      return <ActivityIndicator color="#5D9275" />;
    }
    return (
      <TouchableOpacity onPress={handleSave} disabled={isLoading}>
        <Ionicons name="checkmark" size={28} color="#5D9275" />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenHeader 
        title="New Entry"
        rightComponent={renderHeaderRight()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Select Child</Text>
        <View style={styles.childSelector}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childOption, childId === child.id && styles.selectedChild]}
              onPress={() => setChildId(child.id)}
            >
              <Text style={[styles.childName, childId === child.id && styles.selectedChildText]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Your thoughts...</Text>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind today?"
          value={entryText}
          onChangeText={setEntryText}
          multiline
          autoFocus
        />
        <View style={styles.imageGrid}>
          {media.map((item, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={30} color="white" />
                </View>
              )}
            </View>
          ))}
          {media.length < 4 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickMedia}>
              <Ionicons name="add" size={40} color="#A9A9A9" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.tagContainer}>
          <TouchableOpacity 
            style={[styles.tagButton, isFavorited && styles.activeTagButton]}
            onPress={() => setIsFavorited(!isFavorited)}
          >
            <Ionicons name="heart-outline" size={16} color={isFavorited ? '#5D9275' : '#555'} />
            <Text style={[styles.tagText, isFavorited && styles.activeTagText]}>Favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tagButton, isMilestone && styles.activeTagButton]}
            onPress={() => setIsMilestone(!isMilestone)}
          >
            <Ionicons name="ribbon-outline" size={16} color={isMilestone ? '#5D9275' : '#555'} />
            <Text style={[styles.tagText, isMilestone && styles.activeTagText]}>Milestone</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    paddingVertical: 8,
    minHeight: 150,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  childOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  selectedChild: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  childName: {
    fontSize: 14,
    color: '#666',
  },
  selectedChildText: {
    color: 'white',
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  addImageButton: {
    width: '48%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  activeTagButton: {
    backgroundColor: '#EAF3F0',
    borderColor: '#5D9275',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeTagText: {
    color: '#5D9275',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  toolbarButton: {
    padding: 5,
  },
});

export default NewEntryScreen;
