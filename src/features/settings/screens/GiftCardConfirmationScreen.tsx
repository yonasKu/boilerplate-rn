import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Colors } from '../../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const GiftCardConfirmationScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <SafeAreaView
            style={[
                styles.container,
            ]}
            edges={['top', 'bottom', 'left', 'right']}
        >
            <ScreenHeader title="Confirmation" />

            <View style={styles.content}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <Ionicons name="close" size={18} color={Colors.darkGrey} />
                </TouchableOpacity>

                <View style={styles.contentInner}>
                    <Image source={require('../../../assets/images/Logo_Icon.png')} style={styles.logo} />

                    <Text style={styles.title}>Your gift{'\n'}is on the way!</Text>
                    <Text style={styles.subtitle}>Your recipient will receive an email with{'\n'}their gift card shortly.</Text>

                    <View style={styles.rowPill}>
                        <View style={styles.leftTag}><Text style={styles.leftTagText}>Purchased</Text></View>
                        <Text style={styles.rowValue}>1 Year of Sproutbook</Text>
                    </View>

                    <View style={styles.rowPill}>
                        <View style={styles.leftTag}><Text style={styles.leftTagText}>Price</Text></View>
                        <Text style={styles.rowValue}>$48.00</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        // justifyContent: 'center',
    },
    content: {
        marginTop: 80,
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingTop: 20,
        width: '100%',

    },
    contentInner: {
        gap: 12,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        alignSelf: 'center',
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        top: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.offWhite,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginTop: 8,
        marginBottom: 14,
    },
    title: {
        fontSize: 26,
        color: Colors.black,
        fontFamily: 'Poppins-Bold',

        textAlign: 'center',
        lineHeight: 34,
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        color: Colors.grey,
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        lineHeight: 22,
    },
    rowPill: {
        marginTop: 12,
        alignSelf: 'stretch',
        backgroundColor: Colors.primary,
        borderRadius: 26,
        height: 52,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftTag: {
        backgroundColor: "transparent",
        paddingVertical: 7,
        paddingHorizontal: 12,
    },
    leftTagText: {
        color: Colors.lightPink,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    rowValue: {
        color: Colors.lightPink,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
});

export default GiftCardConfirmationScreen;
