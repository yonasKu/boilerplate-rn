import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import { Button } from '../../../components/Button';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useChildProfilesScreen } from '@/features/settings/hooks/useChildProfilesScreen';

const ChildProfilesScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    // state
    loading,
    children,
    journalImage,
    journalName,
    isUploadingJournalImage,
    uploadingChildIds,
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
    handleJournalNameBlur,
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
  } = useChildProfilesScreen();

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }] }>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
 

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handlePickJournalImage} disabled={isUploadingJournalImage}>
            {isUploadingJournalImage ? (
              <View style={[styles.avatar, styles.uploadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.avatar}>
                <ProfileAvatar
                  imageUrl={journalImage || null}
                  name={journalName || 'Journal'}
                  size={110}
                  textSize={36}
                />
              </View>
            )}
          </TouchableOpacity>
          {journalImage ? (
            <TouchableOpacity
              style={styles.editIconContainer}
              onPress={handlePickJournalImage}
              disabled={isUploadingJournalImage}
            >
              <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePickJournalImage} disabled={isUploadingJournalImage}>
              <Text style={styles.addPhotoText}>Add photo</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.journalNameInput}
            placeholder="Your journal name"
            placeholderTextColor={Colors.mediumGrey}
            value={journalName}
            onChangeText={setJournalName}
            onBlur={handleJournalNameBlur}
            accessibilityLabel="Journal name"
          />
        </View>

        <Text style={styles.sectionSubtitle}>Who are you journaling about?</Text>

        <View style={styles.listContainer}>
          {children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No child profiles yet</Text>
              <Text style={styles.emptySubtext}>Add your first child to get started</Text>
            </View>
          ) : (
            children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childHeader}>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity style={styles.childAvatar} onPress={() => handlePickChildImage(child.id)} disabled={!!uploadingChildIds[child.id || '']}> 
                      {uploadingChildIds[child.id || ''] ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <ProfileAvatar
                          imageUrl={child.avatar || null}
                          name={child.name || ''}
                          size={52}
                          textSize={20}
                        />
                      )}
                      <TouchableOpacity style={styles.childEditIconContainer} onPress={() => handlePickChildImage(child.id)} disabled={!!uploadingChildIds[child.id || '']}>
                        <Image source={require('../../../assets/images/camera.png')} style={styles.childEditIcon} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>Name</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleDeleteChild(child.id, child.name)}
                        accessibilityLabel={`Remove child ${child.name}`}
                      >
                        <Image source={require('../../../assets/images/trash_Icon.png')} style={styles.trashIcon} />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.inputUnderline}
                      placeholder="Child’s name or nickname"
                      placeholderTextColor={Colors.mediumGrey}
                      value={child.name}
                      editable={!savingChildIds[child.id || '']}
                      onChangeText={(t) => handleNameChange(child.id!, t)}
                      onBlur={() => handleNameBlur(child.id)}
                    />
                  </View>
                </View>

                <View style={styles.rowInline}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.fieldLabel}>Birthday/due date</Text>
                    <View style={styles.underlineContainer}>
                      <TextInput
                        style={styles.inputUnderlineText}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor={Colors.mediumGrey}
                        value={formatDate(child.dateOfBirth) || ''}
                        editable={false}
                        accessibilityLabel={"Child's birthday"}
                      />
                      <TouchableOpacity onPress={() => openDateForChild(child.id)}>
                        <Image source={require('../../../assets/images/calendar.png')} style={styles.calendarIcon} />
                      </TouchableOpacity>
                    </View>
                    {openDatePickerFor === child.id && (
                      <DateTimePicker
                        mode="date"
                        value={child.dateOfBirth ? new Date(child.dateOfBirth) : new Date()}
                        maximumDate={new Date()}
                        onChange={(_, d) => handleDateSelected(child.id!, d || undefined)}
                      />
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.fieldLabel}>Gender</Text>
                    <TouchableOpacity style={styles.pickerWrapper} onPress={() => toggleGenderPicker(child.id)}>
                      <View style={styles.underlineContainer}>
                        <Text style={[styles.pickerText, { color: child.gender ? Colors.black : Colors.mediumGrey }]}>
                          {toDisplayGender(child.gender) || 'Select'}
                        </Text>
                        <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.arrowIcon} />
                      </View>
                    </TouchableOpacity>
                    {openGenderPickerFor === child.id && (
                      <View style={styles.optionsContainer}>
                        {genderOptions.map(opt => (
                          <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => handleGenderSelect(child.id!, opt)}>
                            <Text style={styles.optionText}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.modalButton]}
          onPress={() => setAddingChild(prev => !prev)}
          accessibilityLabel="Add another child row"
        >
          <Text style={styles.secondaryButtonText}>{addingChild ? 'Cancel' : '+ Add Child'}</Text>
        </TouchableOpacity>

        {addingChild && (
          <View style={styles.childCard}>
            <View style={styles.childHeader}>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Name</Text>
                </View>
                <TextInput
                  style={styles.inputUnderline}
                  placeholder="Child’s name or nickname"
                  placeholderTextColor={Colors.mediumGrey}
                  value={newChild.name}
                  onChangeText={(t) => setNewChild(prev => ({ ...prev, name: t }))}
                />
              </View>
            </View>

            <View style={styles.rowInline}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Birthday/due date</Text>
                <View style={styles.underlineContainer}>
                  <Text style={styles.inputUnderlineText}>
                    {formatDate(newChild.dateOfBirth) || 'MM/DD/YYYY'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowNewChildDate(true)}>
                    <Image source={require('../../../assets/images/calendar.png')} style={styles.calendarIcon} />
                  </TouchableOpacity>
                </View>
                {showNewChildDate && (
                  <DateTimePicker
                    mode="date"
                    value={newChild.dateOfBirth || new Date()}
                    maximumDate={new Date()}
                    onChange={(_, d) => { setShowNewChildDate(false); if (d) setNewChild(prev => ({ ...prev, dateOfBirth: d })); }}
                  />
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <TouchableOpacity style={styles.pickerWrapper} onPress={() => setOpenNewGenderPicker(prev => !prev)}>
                  <View style={styles.underlineContainer}>
                    <Text style={[styles.pickerText, { color: newChild.gender ? Colors.black : Colors.mediumGrey }]}>
                      {newChild.gender || 'Select'}
                    </Text>
                    <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.arrowIcon} />
                  </View>
                </TouchableOpacity>
                {openNewGenderPicker && (
                  <View style={styles.optionsContainer}>
                    {genderOptions.map(opt => (
                      <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => { setNewChild(prev => ({ ...prev, gender: opt })); setOpenNewGenderPicker(false); }}>
                        <Text style={styles.optionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 8 }} onPress={() => { setAddingChild(false); setNewChild({ name: '' }); }}>
                <Text style={{ color: Colors.darkGrey }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 12 }} onPress={handleSaveNewChild}>
                <Text style={{ color: Colors.primary, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title={isSavingAll ? 'Saving...' : 'Save Changes'}
            onPress={handleSaveAll}
            loading={isSavingAll}
            disabled={isSavingAll}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
    </View>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  headerTop: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    alignItems: 'center',
    fontSize: 26,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 32,
  },
  sectionSubtitle: {
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.mediumGrey,
    marginTop: 16,
    fontFamily: 'Poppins-Regular',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  journalNameInput: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    width: '80%',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 6,
  },
  addPhotoText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  listContainer: {
    marginHorizontal: 0,
    marginTop: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
    height: 55,
    marginTop: 16,
//    borderBottomWidth: 1,
//    borderBottomColor: '#F5F5F5',
  },
  profileName: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: 'Poppins-Medium',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 32,
    right: '34%',
  },
  editIcon: {
    width: 50,
    height: 50,
  },
  modalButton: {
    alignSelf: 'center',
    width: 150,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: Colors.black,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.mediumGrey,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    marginTop: 20,
  },
  continueButton: {
    marginBottom: 20,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: Colors.darkGrey,
    fontFamily: 'poppins-500regular',
  },
  inputUnderline: {
    fontSize: 15,
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: Colors.lightGrey,
  },
  rowInline: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    alignItems: 'flex-start',
    paddingVertical: 6,
    marginLeft: 24,
  },
  pickerWrapper: {
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  underlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: Colors.lightGrey,
    paddingVertical: 8,
  },
  inputUnderlineText: {
    flex: 1,
    fontSize: 12,
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
    paddingVertical: 6,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.blacktext,
    width: '100%',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 6,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.mediumGrey,
  },
  optionsContainer: {
    position: 'absolute',
    top: '100%',
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    padding: 8,
    zIndex: 1,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.darkGrey,
  },
  selectedOptionButton: {
    backgroundColor: Colors.lightPink,
    borderRadius: 12,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '500',
    padding: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.grey,
  },
  childCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    position: 'relative',
  },
  childAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  childEditIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  childEditIcon: {
    width: 12,
    height: 12,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  trashIcon: {
    width: 16,
    height: 16,
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGrey,
  },
});

export default ChildProfilesScreen;
