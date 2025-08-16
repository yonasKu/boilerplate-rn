import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useJournal } from '@/hooks/useJournal';
import * as journalService from '@/services/journalService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';

const EditEntryScreen = () => {
  const router = useRouter();
  const { entryId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { updateEntry, entries } = useJournal();

  const [entryText, setEntryText] = useState('');
  const [media, setMedia] = useState<Array<{ uri: string; type: 'image' | 'video'; url?: string }>>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [children, setChildren] = useState<Array<{ id: string; name: string; dateOfBirth: Date }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalEntry, setOriginalEntry] = useState<{
    id: string;
    text: string;
    media: Array<{ type: 'image' | 'video'; url: string }>;
    isFavorited: boolean;
    isMilestone: boolean;
    childIds: string[];
    childAgeAtEntry: Record<string, string>;
    createdAt: any;
  } | null>(null);

  // Load children and existing entry
  useEffect(() => {
    const loadData = async () => {
      if (!entryId) {
        Alert.alert('Error', 'No entry ID provided');
        router.back();
        return;
      }

      // Load children
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const q = query(collection(db, 'children'), where('parentId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const childrenData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateOfBirth: doc.data().dateOfBirth?.toDate ? doc.data().dateOfBirth.toDate() : new Date(doc.data().dateOfBirth as string | number)
        } as { id: string; name: string; dateOfBirth: Date }));
        
        setChildren(childrenData);

        // Load existing entry
        const existingEntry = entries.find(e => e.id === entryId);
        if (existingEntry) {
          setOriginalEntry(existingEntry);
          setEntryText(existingEntry.text || '');
          setMedia(existingEntry.media?.map(m => ({ ...m, uri: m.url })) || []);
          setIsFavorited(existingEntry.isFavorited || false);
          setIsMilestone(existingEntry.isMilestone || false);
          setSelectedChildren(existingEntry.childIds || []);
        } else {
          Alert.alert('Error', 'Entry not found');
          router.back();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Could not load entry data');
      }
    };

    loadData();
  }, [entryId, entries, router]);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
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

  const removeMedia = (index: number) => {
    setMedia(prevMedia => prevMedia.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }
    if (selectedChildren.length === 0) {
      Alert.alert('Select Child', 'Please select at least one child for this entry.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate age for each selected child
      const childAgeAtEntry: Record<string, string> = {};
      selectedChildren.forEach(childId => {
        const child = children.find(c => c.id === childId);
        if (child) {
          const age = journalService.calculateChildAgeAtDate(child.dateOfBirth, new Date());
          childAgeAtEntry[childId] = age;
        }
      });

      await updateEntry(typeof entryId === 'string' ? entryId : entryId[0], {
        text: entryText,
        media: media.map(m => ({ type: m.type, url: m.uri })),
        isFavorited,
        isMilestone,
        childIds: selectedChildren,
        childAgeAtEntry: childAgeAtEntry
      });

      router.back();
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', 'Could not update your entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Edit Entry" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Children</Text>
        <View style={styles.childSelector}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childOption, selectedChildren.includes(child.id) && styles.selectedChild]}
              onPress={() => {
                setSelectedChildren(prev => 
                  prev.includes(child.id) 
                    ? prev.filter(id => id !== child.id)
                    : [...prev, child.id]
                );
              }}
            >
              <Text style={[styles.childText, selectedChildren.includes(child.id) && styles.selectedChildText]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Entry</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="What's on your mind?"
          value={entryText}
          onChangeText={setEntryText}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{entryText.length}/1000</Text>

        <View style={styles.mediaSection}>
          <Text style={styles.label}>Media</Text>
          <TouchableOpacity style={styles.addMediaButton} onPress={pickMedia}>
            <Ionicons name="camera-outline" size={24} color="#5D9275" />
            <Text style={styles.addMediaText}>Add Photos/Videos</Text>
          </TouchableOpacity>
          
          {media.length > 0 && (
            <View style={styles.mediaGrid}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaContainer}>
                  <Image source={{ uri: item.url || item.uri }} style={styles.media} />
                  <TouchableOpacity 
                    style={styles.removeMediaButton} 
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.tagsSection}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tags}>
            <TouchableOpacity
              style={[styles.tagButton, isFavorited && styles.activeTag]}
              onPress={() => setIsFavorited(!isFavorited)}
            >
              <Ionicons name="heart" size={16} color={isFavorited ? '#5D9275' : '#666'} />
              <Text style={[styles.tagText, isFavorited && styles.activeTagText]}>Favorite</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tagButton, isMilestone && styles.activeTag]}
              onPress={() => setIsMilestone(!isMilestone)}
            >
              <Ionicons name="ribbon-outline" size={16} color={isMilestone ? '#5D9275' : '#666'} />
              <Text style={[styles.tagText, isMilestone && styles.activeTagText]}>Milestone</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  childSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  selectedChild: {
    backgroundColor: '#EAF3F0',
    borderColor: '#5D9275',
  },
  childText: {
    fontSize: 14,
    color: '#666',
  },
  selectedChildText: {
    color: '#5D9275',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  mediaSection: {
    marginTop: 20,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addMediaText: {
    fontSize: 16,
    color: '#5D9275',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  tagsSection: {
    marginTop: 20,
    marginBottom: 100,
  },
  tags: {
    flexDirection: 'row',
    gap: 12,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTag: {
    backgroundColor: '#EAF3F0',
    borderColor: '#5D9275',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  activeTagText: {
    color: '#5D9275',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#5D9275',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditEntryScreen;
