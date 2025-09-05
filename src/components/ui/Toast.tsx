import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/theme/colors';

interface ToastProps {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    time?: string;
    icon?: string;
    actionText?: string;
    onClose: () => void;
    onAction?: () => void;
    autoDismissMs?: number; // if > 0, auto close after this many ms
}

export const Toast: React.FC<ToastProps> = ({
    title,
    message,
    type,
    time,
    icon,
    actionText,
    onClose,
    onAction,
    autoDismissMs = 3000,
}) => {
    const slideAnim = new Animated.Value(-100);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        // Auto-dismiss after timeout if enabled
        if (autoDismissMs && autoDismissMs > 0) {
            const t = setTimeout(() => {
                onClose();
            }, autoDismissMs);
            return () => clearTimeout(t);
        }
    }, [autoDismissMs, onClose]);

    const getIcon = () => {
        // Use existing profile-2user.png for all notification types
        // This matches the ReminderToast component
        return require('../../assets/images/profile-2user.png');
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >
            <TouchableOpacity activeOpacity={0.9} onPress={onClose}>
            <View style={styles.toast}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <View style={styles.iconBackground}>
                            <Image source={require('../../assets/images/profile-2user.png')} style={styles.icon} />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    {time ? <Text style={styles.time}>{time}</Text> : null}
                </View>
                <View style={styles.content}>
                    <Text style={styles.mainText}>{message}</Text>
                    {actionText && onAction ? (
                        <TouchableOpacity onPress={onAction} style={{ marginTop: 8 }}>
                            <Text style={{ color: '#007AFF', fontWeight: '600' }}>{actionText}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: 'box-none',
    },
    toast: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 20,


    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBackground: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.lightPink, // Light green background
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    icon: {
        width: 16,
        height: 16,
        tintColor: Colors.grey,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.grey,
    },
    time: {
        fontSize: 12,
        color: Colors.lightPink2,
    },
    content: {
        alignItems: 'flex-start',
    },
    mainText: {
        fontSize: 14,
        color: Colors.blacktext,
        lineHeight: 20,
        fontWeight: '500',
    },
    subText: {
        fontSize: 14,
        color: Colors.blacktext,
    },
});
