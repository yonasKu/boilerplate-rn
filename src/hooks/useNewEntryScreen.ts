import React from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useJournal } from '@/hooks/useJournal';
import * as journalService from '@/services/journalService';
import { useActiveTimeline } from '@/context/ActiveTimelineContext';
import { useAccount } from '@/context/AccountContext';

export type Media = {
  uri: string;
  type: 'image' | 'video';
};

export type CalendarDay = { day: number; month: number; year: number; dateString?: string; timestamp?: number };

type Child = { id: string; name: string; dateOfBirth: Date; profileImageUrl?: string };

export function useNewEntryScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId?: string }>();
  const { addEntry, updateEntry, entries, isLoading } = useJournal();
  const isEditMode = !!entryId;
  const { canCreateEntries, isViewingOthers, loading: timelineLoading } = useActiveTimeline();
  const { accountType } = useAccount();

  const [entryText, setEntryText] = React.useState('');
  const [media, setMedia] = React.useState<Media[]>([]);
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [isMilestone, setIsMilestone] = React.useState(false);
  const [selectedChildren, setSelectedChildren] = React.useState<string[]>([]);
  const [children, setChildren] = React.useState<Child[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  // Helpers for dates and marking posted days
  const toJsDate = (v: any | undefined | null): Date | null => {
    if (!v) return null;
    const d = v?.toDate ? v.toDate() : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getEntryDate = (e: any): Date | null => {
    // Prefer occurredAt, fallback createdAt
    return toJsDate(e?.occurredAt) || toJsDate(e?.createdAt);
  };

  const formatYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayYMD = formatYMD(new Date());
  const selectedDateYMD = React.useMemo(() => formatYMD(selectedDate), [selectedDate]);

  type Marked = { marked?: boolean; selected?: boolean; selectedColor?: string; selectedTextColor?: string; dots?: { key: string; color: string }[] };
  const markedDates: Record<string, Marked> = React.useMemo(() => {
    const marks: Record<string, Marked> = {};
    // Mark posted days with a dot
    (entries || []).forEach((e: any) => {
      const d = getEntryDate(e);
      if (!d) return;
      const key = formatYMD(d);
      marks[key] = {
        ...(marks[key] || {}),
        marked: true,
        dots: [{ key: 'posted', color: '#5D9275' }],
      };
    });
    // Highlight selected date
    const selKey = formatYMD(selectedDate);
    marks[selKey] = {
      ...(marks[selKey] || {}),
      selected: true,
      selectedColor: '#5D9275',
      selectedTextColor: '#FFFFFF',
    };
    return marks;
  }, [entries, selectedDate]);

  // Guard: can create entries
  React.useEffect(() => {
    if (timelineLoading) return;
    if (!canCreateEntries) {
      if ((accountType ?? 'full') === 'view-only') {
        Alert.alert('View-only access', 'Upgrade your account to create journal entries.');
      } else if (isViewingOthers) {
        Alert.alert('Switch timeline', 'Switch to your own timeline to create journal entries.');
      } else {
        Alert.alert('Unavailable', 'You cannot create entries right now.');
      }
      router.replace('/(main)/(tabs)/journal');
    }
  }, [canCreateEntries, isViewingOthers, accountType, timelineLoading]);

  // Load children and init state (and prefill in edit mode)
  React.useEffect(() => {
    const loadChildren = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const q = query(collection(db, 'children'), where('parentId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const childrenData: Child[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
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
            setMedia(existingEntry.media.map((m: any) => ({ uri: m.url, type: m.type })));
            setIsFavorited(existingEntry.isFavorited);
            setIsMilestone(existingEntry.isMilestone);
            setSelectedChildren(existingEntry.childIds || []);
            const occurred = toJsDate((existingEntry as any).occurredAt) || toJsDate((existingEntry as any).createdAt);
            if (occurred) setSelectedDate(occurred);
          }
        } else {
          // For new entries, default to all children (journal is for all)
          setSelectedChildren(childrenData.map(c => c.id));
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
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    setIsSaving(true);

    try {
      // Determine child IDs for this entry
      const childIdsForEntry = isEditMode ? selectedChildren : children.map(c => c.id);

      // Calculate age for each child included in this entry
      const childAgeAtEntry: Record<string, string> = {};
      childIdsForEntry.forEach(childId => {
        const child = children.find(c => c.id === childId);
        if (child) {
          const age = journalService.calculateChildAgeAtDate(new Date(child.dateOfBirth), selectedDate);
          childAgeAtEntry[childId] = age;
        }
      });

      const finalMedia = media.filter(item => item.uri).map(item => ({
        uri: item.uri,
        type: item.type as 'image' | 'video'
      }));

      if (isEditMode && entryId) {
        // For updateEntry, we need to provide the actual URLs
        const uploadedMedia = await Promise.all(
          media.filter(item => item.uri && !item.uri.startsWith('http')).map(async (item) => {
            const url = await journalService.uploadMedia(item.uri, item.type);
            return { url: url, type: item.type } as { url: string; type: 'image' | 'video' };
          })
        );

        const existingMedia = media.filter(item => item.uri && item.uri.startsWith('http')).map(item => ({
          url: item.uri,
          type: item.type as 'image' | 'video'
        }));

        const updateMedia = [...uploadedMedia, ...existingMedia];
        
        await updateEntry(entryId as string, {
          text: entryText,
          media: updateMedia,
          isFavorited,
          isMilestone
        });
        router.replace({ pathname: '/(main)/journal/[entryId]', params: { entryId: entryId as string } });
      } else {
        const entryData = {
          text: entryText,
          media: finalMedia,
          isFavorited,
          isMilestone,
          childIds: childIdsForEntry,
          childAgeAtEntry,
          occurredAt: selectedDate
        };
        const newEntryId = await addEntry(entryData);
        router.replace({ pathname: '/(main)/journal/[entryId]', params: { entryId: newEntryId } });
      }

      } catch (error) {
      console.error('Save entry error:', error);
      let errorMessage = 'Could not save your entry. Please try again.';
      if ((error as any)?.code === 'permission-denied') {
        errorMessage = "You don't have permission to post this entry. Please check your account status or contact support.";
      } else if ((error as any)?.code === 'unavailable') {
        errorMessage = 'Service is temporarily unavailable. Please check your internet connection and try again.';
      }
      Alert.alert('Cannot Post Entry', errorMessage, [{ text: 'OK', style: 'default' }]);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = React.useMemo(() => selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }), [selectedDate]);

  const onCalendarDayPress = (day: CalendarDay) => {
    const d = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(d);
    setShowDatePicker(false);
  };

  const isSaveDisabled = !entryText.trim();

  return {
    // mode
    isEditMode,
    timelineLoading,

    // entries / loading
    entries,
    isLoading,

    // editor state
    entryText,
    setEntryText,
    media,
    setMedia,
    isFavorited,
    setIsFavorited,
    isMilestone,
    setIsMilestone,
    isSaving,

    // children
    children,
    selectedChildren,
    setSelectedChildren,

    // date
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,
    markedDates,
    todayYMD,
    selectedDateYMD,
    formattedDate,

    // actions
    pickMedia,
    takePhoto,
    removeMedia,
    handleSave,
    onCalendarDayPress,

    // ui helpers
    isSaveDisabled,
  };
}
