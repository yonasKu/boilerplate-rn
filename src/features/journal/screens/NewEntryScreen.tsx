import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator, Linking, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Colors } from '@/theme/colors';
import JournalEntryCard from '@/features/journal/components/JournalEntryCard';
import JournalEntryPreviewCard from '@/features/journal/components/JournalEntryPreviewCard';
import ShareBottomSheet from '@/features/journal/components/ShareBottomSheet';
import JournalPreviewActionButtons from '../components/JournalPreviewActionButtons';
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
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [children, setChildren] = useState<Array<{ id: string; name: string; dateOfBirth: Date; profileImageUrl?: string }>>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const q = query(collection(db, 'children'), where('parentId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const childrenData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            profileImageUrl: data.profileImageUrl,
            dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth)
          };
        });

        setChildren(childrenData);
        
        if (isEditMode && entryId) {
          const existingEntry = entries.find(entry => entry.id === entryId);
          if (existingEntry) {
            setEntryText(existingEntry.text);
            setMedia(existingEntry.media.map(m => ({ uri: m.url, type: m.type })));
            setIsFavorited(existingEntry.isFavorited);
            setIsMilestone(existingEntry.isMilestone);
            setSelectedChildren(existingEntry.childIds || []);
          }
        } else if (childrenData.length === 1) {
          setSelectedChildren([childrenData[0].id]);
        } else if (childrenData.length > 1) {
          setSelectedChildren([]);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };

    loadChildren();
  }, [isEditMode, entryId, entries]);

  const pickMedia = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to upload images. You can enable this in Settings > Privacy > Photos > SproutBook.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Platform.OS === 'ios' && Linking.openURL('app-settings:') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image' as 'image'
        }));
        setMedia(prevMedia => [...prevMedia, ...newMedia]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your camera to take photos. You can enable this in Settings > Privacy > Camera > SproutBook.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Platform.OS === 'ios' && Linking.openURL('app-settings:') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMediaItem = {
          uri: result.assets[0].uri,
          type: 'image' as 'image' | 'video',
        };
        setMedia(prevMedia => [...prevMedia, newMediaItem]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeMedia = (uri: string) => {
    setMedia(prevMedia => prevMedia.filter(item => item.uri !== uri));
  };

  const handleSave = async () => {
    console.log('🚀 Starting save process...');
    console.log('📄 Entry text:', entryText);
    console.log('👶 Selected children:', selectedChildren);
    console.log('📸 Media count:', media.length);
    console.log('⭐ Is favorited:', isFavorited);
    console.log('🏆 Is milestone:', isMilestone);

    if (!entryText.trim()) {
      console.log('❌ Save failed: Empty entry text');
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }
    if (selectedChildren.length === 0) {
      console.log('❌ Save failed: No children selected');
      Alert.alert('Select Child', 'Please select at least one child');
      return;
    }

    setIsSaving(true);
    console.log('⏳ Setting isSaving to true...');

    try {
      const selectedChildData = children.filter(c => selectedChildren.includes(c.id));
      console.log('👶 Selected child data:', selectedChildData);
      
      if (selectedChildData.length === 0) {
        console.log('❌ Save failed: No child data found');
        Alert.alert('Error', 'Could not find child information.');
        setIsSaving(false);
        return;
      }

      // Use first child's age for age calculation, or handle multiple ages if needed
      const childAgeAtEntry = selectedChildren.length > 0 
        ? selectedChildren.map(childId => {
            const child = children.find(c => c.id === childId);
            if (!child) {
              console.warn(`⚠️ Child ${childId} not found in children array`);
              return '';
            }
            const age = journalService.calculateChildAgeAtDate(new Date(child.dateOfBirth), new Date());
            console.log(`📊 Child ${child.name} age: ${age}`);
            return `${child.name}: ${age}`;
          }).filter(Boolean).join(', ')
        : '';
      console.log('📊 Child age at entry:', childAgeAtEntry);

      console.log('📸 Processing media...');
      const mediaToUpload = media.filter(item => !item.uri.startsWith('http'));
      // Prepare media array with correct format for addEntry (uri property)
      const finalMedia = media.filter(item => item.uri).map(item => ({
        uri: item.uri,
        type: item.type as 'image' | 'video'
      }));
      console.log('📸 Final media array:', finalMedia);

      if (isEditMode && entryId) {
        console.log('📝 Updating existing entry:', entryId);
        // For updateEntry, we need to provide the actual URLs
        const uploadedMedia = await Promise.all(
          media.filter(item => item.uri && !item.uri.startsWith('http')).map(async (item) => {
            const url = await journalService.uploadMedia(item.uri, item.type);
            return { url: url, type: item.type };
          })
        );

        const existingMedia = media.filter(item => item.uri && item.uri.startsWith('http')).map(item => ({
          url: item.uri,
          type: item.type
        }));

        const updateMedia = [...uploadedMedia, ...existingMedia];
        
        await updateEntry(entryId as string, {
          text: entryText,
          media: updateMedia,
          isFavorited,
          isMilestone
        });
        console.log('✅ Entry updated successfully');
      } else {
        console.log('📝 Creating new entry...');
        const entryData = {
          text: entryText,
          media: finalMedia,
          isFavorited,
          isMilestone,
          childIds: selectedChildren,
          childAgeAtEntry
        };
        console.log('📝 Entry data to save:', entryData);
        await addEntry(entryData);
        console.log('✅ New entry created successfully');
      }

      console.log('🎯 Navigating back to journal...');
      router.replace('/(main)/(tabs)/journal');
    } catch (error) {
      console.error('❌ Save failed with error:', error);
      console.error('❌ Error stack:', (error as Error).stack);
      Alert.alert(
        'Save Failed',
        `Could not save your entry: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      );
    } finally {
      console.log('🏁 Save process completed, setting isSaving to false');
      setIsSaving(false);
    }
  };

  const handleShare = (type: 'copy' | 'system') => {
    if (type === 'copy') {
      // Copy entry text to clipboard
      Alert.alert('Copied', 'Entry text copied to clipboard');
    } else {
      // System share
      Alert.alert('Share', 'System share dialog will open');
    }
    setShowShareSheet(false);
  };

  const renderHeaderRight = () => {
    if (isSaving || isLoading) {
      return <ActivityIndicator color="#5D9275" />;
    }

    const isDisabled = !entryText.trim() || selectedChildren.length === 0;

    return (
      <View style={styles.headerRightContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isDisabled && styles.disabledActionButton]}
          onPress={handleSave}
          disabled={isDisabled || isSaving}
        >
          <Ionicons name="checkmark" size={20} color={isDisabled ? '#BDBDBD' : '#5D9275'} />
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

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isPreview ? (
          <View>
            <JournalEntryPreviewCard
              entry={{
                text: entryText,
                media: media.map(m => ({ url: m.uri, type: m.type })),
              }}
            />
            <JournalPreviewActionButtons
              isFavorited={isFavorited}
              isMilestone={isMilestone}
              onToggleFavorite={() => setIsFavorited(!isFavorited)}
              onToggleMilestone={() => setIsMilestone(!isMilestone)}
              onShare={() => setShowShareSheet(true)}
            />
          </View>
        ) : (
          <>
            {children.length > 1 && (
          <View style={styles.childSelectorContainer}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childOption,
                  selectedChildren.includes(child.id) && styles.selectedChild,
                ]}
                onPress={() => {
                  setSelectedChildren(prev => 
                    prev.includes(child.id) 
                      ? prev.filter(id => id !== child.id)
                      : [...prev, child.id]
                  );
                }}
              >
                <ProfileAvatar
                  imageUrl={child.profileImageUrl}
                  name={child.name}
                  size={20}
                  textSize={10}
                />
                <Text style={[
                  styles.childName,
                  selectedChildren.includes(child.id) && styles.selectedChildName,
                ]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
            <TextInput
              style={styles.textInput}
              placeholder={`What did ${children.find(c => selectedChildren.includes(c.id))?.name || 'your child'} do today?`}
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
        <View style={styles.toolbarActionsLeft}>
          <TouchableOpacity style={styles.toolbarButton} onPress={pickMedia}>
            <Image source={require('../../../assets/images/gallery_icon.png')} style={[styles.toolbarIconGallery, { tintColor: '#A09D94' }]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton} onPress={takePhoto}>
            <Image source={require('../../../assets/images/Camera_icon.png')} style={[styles.toolbarIconCamera, { tintColor: '#A09D94' }]} />
          </TouchableOpacity>
        </View>
      </View>
     </View>
    </TouchableWithoutFeedback>
      <ShareBottomSheet
        isVisible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onShare={handleShare}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    flexGrow: 1,
  },
  label: {
    fontSize: 14,
    color: Colors.mediumGrey,
    marginBottom: 8,
    marginLeft: 10,
  },
  childSelectorContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  childSelector: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  childOption: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectedChild: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  selectedChildName: {
    color: Colors.primary,
    fontWeight: '600',
  },
  childName: {
    fontSize: 14,
    color: Colors.darkGrey,
  },
  selectedChildText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.darkGrey,
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
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
  },
  activeToggleButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.mediumGrey,
  },
  activeToggleText: {
    color: Colors.white,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20, 
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
    backgroundColor: Colors.white,
  },
  toolbarActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarIcon: {
    width: 28,
    height: 28,
    resizeMode: 'cover',
  },
  toolbarIconCamera: {
    width: 28,
    height: 28,
    resizeMode: 'cover',
  },
  toolbarIconGallery: {
    width: 24,
    height: 24,
    resizeMode: 'cover',
  },
  disabledIcon: {
    opacity: 0.4,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  milestoneIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.white,
  },
  previewContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  disabledActionButton: {
    backgroundColor: Colors.offWhite,
    borderColor: Colors.lightGrey,
  },
  headerIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
  },
  disabledHeaderIcon: {
    tintColor: Colors.lightGrey,
  },
});

export default NewEntryScreen;
