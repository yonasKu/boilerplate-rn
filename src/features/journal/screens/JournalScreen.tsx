import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const JournalScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={require('../../../assets/images/sampleProfile.png')} style={styles.avatar} />
                    <Text style={styles.headerTitle}>Matthew</Text>
                    <Ionicons name="chevron-down" size={20} color="#2F4858" />
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="notifications-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
                        <Ionicons name="settings-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.content}>
                <Image source={require('../../../assets/images/leaf_home.png')} style={styles.mainImage} />
                <Text style={styles.promptText}>Let's start your first memory</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4858',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    promptText: {
        marginTop: 24,
        fontSize: 16,
        color: '#A9A9A9',
    },
});

export default JournalScreen;

