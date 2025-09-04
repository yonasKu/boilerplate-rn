import React from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';

import { Calendar } from 'react-native-calendars';
import { Colors } from '@/theme/colors';
// Removed preview components and share sheet as preview mode is no longer used
import { useNewEntryScreen } from '@/hooks/useNewEntryScreen';

const NewEntryScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    // entries / loading
    isLoading,
    timelineLoading,

    // editor state
    entryText,
    setEntryText,
    media,
    isSaving,

    // date
    showDatePicker,
    setShowDatePicker,
    markedDates,
    todayYMD,
    selectedDateYMD,
    formattedDate,

    // actions
    pickMedia,
    removeMedia,
    handleSave,
    onCalendarDayPress,

    // ui helpers
    isSaveDisabled,
  } = useNewEntryScreen();

  if (timelineLoading) {
    return null;
  }

  // Helpers for dates and marking posted days
  const renderHeaderRight = () => {
    if (isSaving || isLoading) {
      return <ActivityIndicator color="#5D9275" />;
    }

    return (
      <View style={styles.headerRightContainer}>
        <TouchableOpacity onPress={handleSave} disabled={isSaveDisabled || isSaving}>
          <Text style={[styles.headerSaveText, (isSaveDisabled || isSaving) && styles.headerSaveTextDisabled]}>Save</Text>
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -insets.bottom}
    >
            <ScreenHeader
        title={formattedDate}
        centerTitle
        rightComponent={renderHeaderRight()}
        leftComponent={
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerCloseButton}
          >
            <Ionicons name="close" size={20} color={Colors.darkGrey} />
          </TouchableOpacity>
        }
        onTitlePress={() => setShowDatePicker(true)}
        showCalendarIcon={false}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Child selection removed: entries apply to all children by default */}
        <TextInput
          style={styles.textInput}
          placeholder={`What happened today?`}
          placeholderTextColor="#A09D94"
          value={entryText}
          onChangeText={setEntryText}
          multiline
          autoFocus
        />
        {renderMediaPreviews()}
      </ScrollView>

      {/*
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
      */}

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + (Platform.OS === 'ios' ? 24 : 16) }]}
        onPress={pickMedia}
        activeOpacity={0.85}
      >
        <Image source={require('../../../assets/images/gallery_icon.png')} style={styles.fabIcon} />
      </TouchableOpacity>

     </View>
    </TouchableWithoutFeedback>
      {/* Date picker overlay */}
      {showDatePicker && (
        <View style={styles.dateOverlay}>
          <View style={styles.dateSheet}>
            <View style={styles.dateSheetActions}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.headerSaveText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              current={selectedDateYMD}
              maxDate={todayYMD}
              markedDates={markedDates}
              onDayPress={onCalendarDayPress}
              markingType="multi-dot"
              enableSwipeMonths
              hideExtraDays={false}
              theme={{
                selectedDayBackgroundColor: '#5D9275',
                todayTextColor: '#5D9275',
                arrowColor: '#5D9275',
              }}
            />
          </View>
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.overlayBackdrop} />
          </TouchableWithoutFeedback>
        </View>
      )}
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
    justifyContent: 'center',
    width: 40,
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
  headerSaveText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerSaveTextDisabled: {
    color: Colors.lightGrey,
  },
  headerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.white,
    resizeMode: 'contain',
  },
  dateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dateSheet: {
    backgroundColor: Colors.white,
    paddingTop: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  dateSheetActions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
});

export default NewEntryScreen;
