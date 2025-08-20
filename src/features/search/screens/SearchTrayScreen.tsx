import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Pressable,
    KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import { useSearchHistory } from '../hooks/useSearchHistory';
import suggestionsData from '../data/searchSuggestions.json';

const SearchTrayScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [searchText, setSearchText] = useState('');
    const { searchHistory, addSearchQuery, removeSearchQuery } = useSearchHistory();

    const handleSearch = () => {
        if (searchText.trim()) {
            addSearchQuery(searchText.trim());
            router.push(`/search?q=${encodeURIComponent(searchText.trim())}`);
        }
    };

    const handleTagPress = (query: string) => {
        addSearchQuery(query);
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <View style={[styles.contentContainer, { paddingTop: insets.top }]} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Search</Text>
                    </View>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingTop: 10 }]}
                    >
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recents</Text>
                            <View style={styles.tagsContainer}>
                                {searchHistory.length > 0 ? (
                                    searchHistory.slice(0, 3).map((item, index) => (
                                        <BlurView key={index} intensity={30} tint="extraLight" style={styles.tag}>
                                            <TouchableOpacity style={styles.tagTouchable} onPress={() => handleTagPress(item.query)}>
                                                <Text style={styles.tagText}>{item.query}</Text>
                                                <TouchableOpacity onPress={() => removeSearchQuery(item.query)}>
                                                    <Ionicons name="close-outline" size={18} color="#fff" />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        </BlurView>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No recent searches</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Suggestions</Text>
                            <View style={styles.tagsContainer}>
                                {suggestionsData.slice(0, 3).map((item: string, index: number) => (
                                    <BlurView key={index} intensity={30} tint="extraLight" style={styles.tag}>
                                        <TouchableOpacity style={styles.tagTouchable} onPress={() => handleTagPress(item)}>
                                            <Text style={styles.tagText}>{item}</Text>
                                        </TouchableOpacity>
                                    </BlurView>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[styles.searchWrapper, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={22} color="#D2D0CF" style={styles.searchIcon} />
                            <TextInput
                                style={styles.input}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder="Search memories..."
                                placeholderTextColor="#666"
                                onSubmitEditing={handleSearch}
                                autoFocus
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
    },
    searchWrapper: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.white,
        height: 80,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        //backgroundColor: Colors.offWhite,
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 54,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.blacktext,
        fontFamily: 'Poppins-Regular',
    },
    section: {
        marginBottom: 24,
        marginTop: 24,
    },
    header: {
        paddingHorizontal: 18,
        paddingVertical: 16,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.white,
        fontFamily: 'Poppins-bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 16,
        fontFamily: 'Poppins-Regular',
    },
    tagsContainer: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: 10,
    },
    tagsContainerBlur: {
        borderRadius: 15,
        overflow: 'hidden',
        marginHorizontal: -4,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.white,
        fontFamily: 'Poppins-Regular',
        opacity: 0.7,
    },
    tag: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 0,
    },
    tagTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
    },
    tagText: {
        fontSize: 14,
        color: Colors.white,
        marginRight: 6,
        fontFamily: 'Poppins-Regular',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});

export default SearchTrayScreen;

