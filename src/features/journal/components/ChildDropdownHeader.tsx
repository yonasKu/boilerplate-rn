// import React, { useState, useMemo } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { ProfileAvatar } from '../../../components/ProfileAvatar';

// export interface ChildItem {
//   id: string;
//   name: string;
//   profileImageUrl?: string;
// }

// interface Props {
//   userName?: string | null;
//   userImageUrl?: string | null;
//   selectedChild: ChildItem | null;
//   childrenList: ChildItem[];
//   onSelect: (child: ChildItem | null) => void;
// }

// const ChildDropdownHeader: React.FC<Props> = ({
//   userName,
//   userImageUrl,
//   selectedChild,
//   childrenList,
//   onSelect,
// }) => {
//   const [open, setOpen] = useState(false);

//   const displayName = selectedChild ? selectedChild.name : 'Journals';
//   const displayImageUrl = selectedChild?.profileImageUrl || userImageUrl || undefined;

//   const data = useMemo(() => [null, ...childrenList] as (ChildItem | null)[], [childrenList]);

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity
//         style={styles.trigger}
//         onPress={() => setOpen((v) => !v)}
//         activeOpacity={0.7}
//       >
//         <ProfileAvatar imageUrl={displayImageUrl} name={selectedChild?.name || userName || 'User'} size={40} textSize={16} />
//         <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
//           {displayName}
//         </Text>
//         <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#2F4858" />
//       </TouchableOpacity>

//       {open && (
//         <View style={styles.dropdown}>
//           <FlatList
//             keyboardShouldPersistTaps="handled"
//             data={data}
//             keyExtractor={(item) => (item ? item.id : 'all-journals')}
//             ItemSeparatorComponent={() => <View style={styles.separator} />}
//             renderItem={({ item }) => {
//               const isSelected = (item === null && selectedChild === null) || (item?.id === selectedChild?.id);
//               const name = item ? item.name : 'Journals';
//               const imageUrl = item ? item.profileImageUrl : userImageUrl || undefined;
//               return (
//                 <TouchableOpacity
//                   style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
//                   onPress={() => {
//                     onSelect(item ?? null);
//                     setOpen(false);
//                   }}
//                 >
//                   <ProfileAvatar imageUrl={imageUrl} name={name} size={30} textSize={14} />
//                   <Text style={styles.dropdownItemText}>{name}</Text>
//                 </TouchableOpacity>
//               );
//             }}
//           />
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'relative',
//     flexShrink: 1,
//   },
//   trigger: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     flexShrink: 1,
//   },
//   title: {
//     maxWidth: 160,
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2F4858',
//   },
//   dropdown: {
//     position: 'absolute',
//     top: 56,
//     left: 0,
//     width: 260,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     zIndex: 1000,
//     maxHeight: 280,
//   },
//   separator: {
//     height: 1,
//     backgroundColor: '#F1F1F1',
//   },
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     gap: 10,
//   },
//   dropdownItemSelected: {
//     backgroundColor: '#F7FBF9',
//   },
//   dropdownItemText: {
//     fontSize: 14,
//     color: '#2F4858',
//   },
// });

// export default ChildDropdownHeader;
