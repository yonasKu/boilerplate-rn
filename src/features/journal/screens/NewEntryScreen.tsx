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
import JournalEntryCard from '@/features/journal/components/JournalEntryCard';
import { JournalEntry } from '@/hooks/useJournal';

type Media = {
  uri: string;
  type: 'image' | 'video';
};

const NewEntryScreen = () => {
  const router = useRouter();
  const { entryId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addEntry, updateEntry, entries, isLoading } = useJournal();
  const isEditMode = !!entryId;

  const [entryText, setEntryText] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);
  const [childId, setChildId] = useState<string>('');
  const [children, setChildren] = useState<Array<{ id: string; name: string; dateOfBirth: Date }>>([]);
  const [isPreview, setIsPreview] = useState(false);

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
        
        if (isEditMode && entryId) {
          const existingEntry = entries.find(entry => entry.id === entryId);
          if (existingEntry) {
            setEntryText(existingEntry.text);
            setMedia(existingEntry.media.map(m => ({ uri: m.url, type: m.type })));
            setIsFavorited(existingEntry.isFavorited);
            setIsMilestone(existingEntry.isMilestone);
            setChildId(existingEntry.childId);
          }
        } else if (childrenData.length > 0) {
          setChildId(childrenData[0].id);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };

    loadChildren();
  }, [isEditMode, entryId, entries]);

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image' as 'image' | 'video'
      }));
      setMedia(prevMedia => [...prevMedia, ...newMedia]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newMediaItem = {
        uri: result.assets[0].uri,
        type: 'image' as 'image' | 'video',
      };
      setMedia(prevMedia => [...prevMedia, newMediaItem]);
    }
  };

  const removeMedia = (uri: string) => {
    setMedia(prevMedia => prevMedia.filter(item => item.uri !== uri));
  };

  const handleSave = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }
    if (!childId) {
      Alert.alert('Select Child', 'This is a fallback, ideally UI ensures a child is always selected.');
      return;
    }

    try {
      const selectedChild = children.find(c => c.id === childId);
      if (!selectedChild) {
        Alert.alert('Error', 'Could not find child information.');
        return;
      }

      const childAgeAtEntry = journalService.calculateChildAgeAtDate(
        selectedChild.dateOfBirth,
        new Date()
      );

      const uploadedMedia = await Promise.all(
        media.filter(item => !item.uri.startsWith('http')).map(async (item) => {
          const url = await journalService.uploadMedia(item.uri, item.type);
          return { type: item.type, url };
        })
      );

      const existingMedia = media.filter(item => item.uri.startsWith('http')).map(item => ({
        type: item.type,
        url: item.uri
      }));

      const allMedia = [...uploadedMedia, ...existingMedia];

      if (isEditMode && entryId) {
        await updateEntry(entryId as string, {
          text: entryText,
          media: media.map(m => ({ type: m.type, url: m.uri })),
          isFavorited,
          isMilestone
        });
      } else {
        await addEntry({
          text: entryText,
          media: media,
          isFavorited,
          isMilestone,
          childId,
          childAgeAtEntry
        });
      }

      // Navigate back and refresh the journal page
      router.replace('/(main)/(tabs)/journal');
    } catch (error) {
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
      <View style={styles.headerRightContainer}>
        <TouchableOpacity onPress={() => setIsFavorited(!isFavorited)}>
          <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={28} color={isFavorited ? '#E91E63' : '#555'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (isPreview) {
              handleSave();
            } else {
              setIsPreview(true);
            }
          }}
          disabled={!entryText.trim() || !childId}
        >
          <Ionicons name={'checkmark'} size={28} color={!entryText.trim() || !childId ? '#BDBDBD' : '#5D9275'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMediaPreviews = () => {
    if (media.length === 0) return null;

    return (
      <View style={styles.mediaPreviewContainer}>
        {media.map((item, index) => (
          <View key={index} style={styles.mediaItemContainer}>
            <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
            <TouchableOpacity style={styles.removeMediaButton} onPress={() => removeMedia(item.uri)}>
              <Ionicons name="close-circle" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    // This is just to ensure the header updates when isFavorited changes
  }, [isFavorited]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -insets.bottom}
    >
            <ScreenHeader
        title={formattedDate}
        rightComponent={renderHeaderRight()}
        onBack={() => {
          if (isPreview) {
            setIsPreview(false);
          } else {
            router.back();
          }
        }}
        showCalendarIcon={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isPreview ? (
          <View>
            <JournalEntryCard
              entry={{
                id: 'preview',
                text: entryText,
                media: media.map(m => ({ url: m.uri, type: m.type })),
                isFavorited: isFavorited,
                isMilestone: isMilestone,
                childId: childId,
                childAgeAtEntry: 'Just now',
                createdAt: new Date(),
                likes: {},
              } as unknown as JournalEntry}
              isPreview={true}
            />
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isFavorited && styles.activeToggleButton]}
                onPress={() => setIsFavorited(!isFavorited)}
              >
                <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? '#FFF' : '#555'} />
                <Text style={[styles.toggleText, isFavorited && styles.activeToggleText]}>Favorite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isMilestone && styles.activeToggleButton]}
                onPress={() => setIsMilestone(!isMilestone)}
              >
                <Image source={require('../../../assets/images/Trophy_icon.png')} style={[styles.milestoneIcon, { tintColor: isMilestone ? '#FFF' : '#555' }]} />
                <Text style={[styles.toggleText, isMilestone && styles.activeToggleText]}>Milestone</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.childSelectorContainer}>
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
            <TextInput
              style={styles.textInput}
              placeholder={`What did ${children.find(c => c.id === childId)?.name || 'your child'} do today?`}
              placeholderTextColor="#A09D94"
              value={entryText}
              onChangeText={setEntryText}
              multiline
              autoFocus
            />
            {renderMediaPreviews()}
          </>
        )}
      </ScrollView>

      <View style={[styles.toolbar, { paddingBottom: Platform.OS === 'ios' ? 20 : 0 }]}>
        <TouchableOpacity style={styles.toolbarButton}>
          <Image source={require('../../../assets/images/Text_Icon.png')} style={[styles.toolbarIcon, { tintColor: '#A09D94' }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Image source={require('../../../assets/images/magicpen_icon.png')} style={[styles.toolbarIcon, { tintColor: '#A09D94' }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={pickMedia}>
          <Image source={require('../../../assets/images/gallery_icon.png')} style={[styles.toolbarIcon, { tintColor: '#A09D94' }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={takePhoto}>
          <Image source={require('../../../assets/images/Camera_icon.png')} style={[styles.toolbarIcon, { tintColor: '#A09D94' }]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            if (isPreview) {
              handleSave();
            } else {
              setIsPreview(true);
            }
          }}
          disabled={isLoading || !entryText.trim() || !childId}
        >
          {isLoading ? (
            <ActivityIndicator color="#5D9275" />
          ) : (
            <Image
              source={require('../../../assets/images/Send_icon.png')}
              style={[
                styles.sendIcon,
                (!entryText.trim() || !childId) ? styles.disabledIcon : { tintColor: '#5D9275' }
              ]}
            />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 16,
    flexGrow: 1,
  },
  childSelectorContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
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
    backgroundColor: '#5D9275',
    borderColor: '#5D9275',
  },
  childName: {
    fontSize: 14,
    color: '#666',
  },
  selectedChildText: {
    color: 'white',
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    flex: 1,
    textAlignVertical: 'top',
    paddingHorizontal: 20,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  mediaItemContainer: {
    position: 'relative',
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  toggleContainer: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: -4,
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  activeToggleButton: {
    backgroundColor: '#5D9275',
    borderColor: '#5D9275',
  },
  toggleText: {
    fontSize: 14,
    color: '#555',
  },
  activeToggleText: {
    color: '#FFF',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  toolbarButton: {
    padding: 2,
  },
  toolbarIcon: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  disabledIcon: {
    opacity: 0.4,
  },
  sendIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  milestoneIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
});

export default NewEntryScreen;
