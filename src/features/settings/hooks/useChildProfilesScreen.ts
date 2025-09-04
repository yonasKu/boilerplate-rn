import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getUserChildren, updateChild, addChild, deleteChild } from '@/services/childService';
import { uploadChildProfileImage, uploadJournalImage, getUserProfile, updateJournalSettings } from '@/services/userService';

export type ChildProfile = {
  name: string;
  id?: string;
  dateOfBirth?: Date;
  gender?: string;
  avatar?: string;
};

// Safe date formatting utility
const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';

  try {
    let date: Date;

    if ((dateInput as any)?.toDate) {
      date = (dateInput as any).toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return '';
    }

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const useChildProfilesScreen = () => {
  const { user } = useAuth();

  const [children, setChildren] = React.useState<ChildProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [journalImage, setJournalImage] = React.useState<string | undefined>(undefined);
  const [journalName, setJournalName] = React.useState<string>('');
  const [isUploadingJournalImage, setIsUploadingJournalImage] = React.useState<boolean>(false);
  const [uploadingChildIds, setUploadingChildIds] = React.useState<Record<string, boolean>>({});
  const [lifestage, setLifestage] = React.useState<string | null>(null);
  const [openGenderPickerFor, setOpenGenderPickerFor] = React.useState<string | null>(null);
  const [openDatePickerFor, setOpenDatePickerFor] = React.useState<string | null>(null);
  const [savingChildIds, setSavingChildIds] = React.useState<Record<string, boolean>>({});
  const [addingChild, setAddingChild] = React.useState<boolean>(false);
  const [newChild, setNewChild] = React.useState<{ name: string; dateOfBirth?: Date; gender?: string }>({ name: '' });
  const [showNewChildDate, setShowNewChildDate] = React.useState<boolean>(false);
  const [openNewGenderPicker, setOpenNewGenderPicker] = React.useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [childrenData, profile] = await Promise.all([
          getUserChildren(user.uid),
          getUserProfile(user.uid),
        ]);

        setChildren(childrenData.map((child: any) => ({
          name: child.name,
          id: child.id,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          avatar: child.avatar || (child as any).profileImageUrl,
        })));

        if (profile) {
          setJournalName((profile as any).journalName || '');
          setJournalImage((profile as any).journalImageUrl || undefined);
          setLifestage((profile as any).lifestage ?? null);
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handlePickJournalImage = async () => {
    try {
      if (!user) return;
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo access to upload a journal image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingJournalImage(true);
        const uri = result.assets[0].uri;
        const url = await uploadJournalImage(user.uid, uri);
        setJournalImage(url);
      }
    } catch (e) {
      console.error('Error picking journal image', e);
      Alert.alert('Error', 'Failed to upload journal image. Please try again.');
    } finally {
      setIsUploadingJournalImage(false);
    }
  };

  const genderOptions = React.useMemo(() => (
    lifestage === 'Soon to be parent'
      ? ['Boy', 'Girl', "Don't know yet"]
      : ['Boy', 'Girl', 'Prefer not to say']
  ), [lifestage]);

  const toFirestoreGender = (display: string): 'Boy' | 'Girl' | 'prefer_not_to_say' | "Don't know yet" | 'other' =>
    display === 'Prefer not to say' ? 'prefer_not_to_say' : (display as any);

  const toDisplayGender = (value?: string): string =>
    value === 'prefer_not_to_say' ? 'Prefer not to say' : (value || '');

  const handleNameChange = (childId: string, name: string) => {
    setChildren(prev => prev.map(c => (c.id === childId ? { ...c, name } : c)));
  };

  const handleNameBlur = async (childId: string | undefined) => {
    if (!childId) return;
    try {
      setSavingChildIds(prev => ({ ...prev, [childId]: true }));
      const current = children.find(c => c.id === childId);
      if (!current) return;
      await updateChild(childId, { name: current.name });
    } catch (e) {
      Alert.alert('Error', 'Failed to save name');
    } finally {
      setSavingChildIds(prev => ({ ...prev, [childId!]: false }));
    }
  };

  const openDateForChild = (childId?: string) => {
    if (!childId) return;
    setOpenDatePickerFor(childId);
  };

  const handleDateSelected = async (childId: string, date?: Date) => {
    setOpenDatePickerFor(null);
    if (!date) return;
    try {
      setSavingChildIds(prev => ({ ...prev, [childId]: true }));
      await updateChild(childId, { dateOfBirth: date });
      setChildren(prev => prev.map(c => (c.id === childId ? { ...c, dateOfBirth: date } : c)));
    } catch (e) {
      Alert.alert('Error', 'Failed to save date');
    } finally {
      setSavingChildIds(prev => ({ ...prev, [childId]: false }));
    }
  };

  const toggleGenderPicker = (childId?: string) => {
    setOpenGenderPickerFor(prev => (prev === (childId || null) ? null : (childId || null)));
  };

  const handleGenderSelect = async (childId: string, display: string) => {
    try {
      setSavingChildIds(prev => ({ ...prev, [childId]: true }));
      const gender = toFirestoreGender(display);
      await updateChild(childId, { gender: gender as any });
      setChildren(prev => prev.map(c => (c.id === childId ? { ...c, gender } : c)));
    } catch (e) {
      Alert.alert('Error', 'Failed to save gender');
    } finally {
      setSavingChildIds(prev => ({ ...prev, [childId]: false }));
      setOpenGenderPickerFor(null);
    }
  };

  const handleDeleteChild = (childId?: string, name?: string) => {
    if (!childId || !user) return;
    Alert.alert(
      'Delete child profile?',
      `${name || 'This child'} and some related data may no longer be available. This action cannot be undone.\n\nDo you really want to delete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              setSavingChildIds(prev => ({ ...prev, [childId]: true }));
              await deleteChild(childId, user.uid);
              setChildren(prev => prev.filter(c => c.id !== childId));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete child');
            } finally {
              setSavingChildIds(prev => ({ ...prev, [childId]: false }));
            }
          }
        }
      ]
    );
  };

  const handleSaveNewChild = async () => {
    try {
      if (!user) return;
      const name = (newChild.name || '').trim();
      if (!name) {
        Alert.alert('Missing name', 'Please enter a name');
        return;
      }
      const genderDisplay = newChild.gender || (lifestage === 'Soon to be parent' ? "Don't know yet" : 'Prefer not to say');
      const childId = await addChild({
        name,
        dateOfBirth: newChild.dateOfBirth || new Date(),
        gender: toFirestoreGender(genderDisplay) as any,
      }, user.uid);
      setChildren(prev => ([
        ...prev,
        { id: childId, name, dateOfBirth: newChild.dateOfBirth || new Date(), gender: toFirestoreGender(genderDisplay), avatar: undefined }
      ]));
      setNewChild({ name: '' });
      setAddingChild(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to add child');
    }
  };

  const handlePickChildImage = async (childId?: string) => {
    if (!childId) return;
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo access to upload a child picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingChildIds(prev => ({ ...prev, [childId]: true }));
        const uri = result.assets[0].uri;
        const url = await uploadChildProfileImage(childId, uri);
        setChildren(prev => prev.map(c => (c.id === childId ? { ...c, avatar: url } : c)));
      }
    } catch (e) {
      console.error('Error picking child image', e);
      Alert.alert('Error', 'Failed to upload child image. Please try again.');
    } finally {
      setUploadingChildIds(prev => ({ ...prev, [childId!]: false }));
    }
  };

  const handleSaveAll = async () => {
    try {
      if (!user) return;
      setIsSavingAll(true);

      await updateJournalSettings(user.uid, { journalName });

      const updates = children
        .filter(c => !!c.id)
        .map(c => {
          const payload: any = {};
          if (typeof c.name === 'string') payload.name = c.name;
          if (c.dateOfBirth) payload.dateOfBirth = c.dateOfBirth as any;
          if (c.gender) payload.gender = c.gender as any;
          return updateChild(c.id!, payload);
        });

      await Promise.all(updates);

      Alert.alert('Saved', 'Your changes have been saved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleJournalNameBlur = async () => {
    try {
      if (!user) return;
      await updateJournalSettings(user.uid, { journalName });
    } catch (e) {
      console.warn('Failed to save journal name on blur');
    }
  };

  return {
    // state
    loading,
    children,
    journalImage,
    journalName,
    isUploadingJournalImage,
    uploadingChildIds,
    lifestage,
    openGenderPickerFor,
    openDatePickerFor,
    savingChildIds,
    addingChild,
    newChild,
    showNewChildDate,
    openNewGenderPicker,
    isSavingAll,

    // derived
    genderOptions,
    toDisplayGender,
    formatDate,

    // setters
    setJournalName,
    setAddingChild,
    setNewChild,
    setShowNewChildDate,
    setOpenNewGenderPicker,

    // actions
    handlePickJournalImage,
    handleNameChange,
    handleNameBlur,
    openDateForChild,
    handleDateSelected,
    toggleGenderPicker,
    handleGenderSelect,
    handleDeleteChild,
    handleSaveNewChild,
    handlePickChildImage,
    handleSaveAll,
    handleJournalNameBlur,
  };
};

export default useChildProfilesScreen;
