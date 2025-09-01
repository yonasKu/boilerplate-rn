import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export type ActionCalloutProps = {
    title: string;
    description?: string;
    ctaLabel?: string;
    onPress?: () => void;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
    titleStyle?: TextStyle;
    descriptionStyle?: TextStyle;
    backgroundColor?: string; // default: Colors.lightPink
    // Left adornments
    dateBadge?: Date; // shows small date circle like screenshots
    iconName?: keyof typeof Ionicons.glyphMap; // alternatively show an icon on the left of title
    // Success state: big check icon, no CTA
    success?: boolean;
};

const monthShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const DateBadge = ({ date }: { date: Date }) => {
    const day = `${date.getDate()}`.padStart(2, '0');
    const mon = monthShort[date.getMonth()];
    return (
        <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{mon}</Text>
        </View>
    );
};

export const ActionCallout: React.FC<ActionCalloutProps> = ({
    title,
    description,
    ctaLabel,
    onPress,
    style,
    contentStyle,
    titleStyle,
    descriptionStyle,
    backgroundColor = Colors.lightPink,
    dateBadge,
    iconName,
    success = false,
}) => {
    return (
        <View style={[styles.card, { backgroundColor }, style]}>
            <View style={[styles.row, contentStyle]}>
                {/* Left adornment area */}
                {dateBadge ? (
                    <DateBadge date={dateBadge} />
                ) : iconName ? (
                    <View style={styles.leftIconWrap}>
                        <Ionicons name={iconName} size={18} color={Colors.darkGrey} />
                    </View>
                ) : null}

                {/* Main content */}
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, titleStyle]}>{title}</Text>
                </View>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 8 }}>
                {!!description && <Text style={[styles.subtitle, descriptionStyle]}>{description}</Text>}
            </View>

            {/* Footer: CTA or Success check */}
            {success ? (
                <View style={styles.successIconWrap}>
                    <Ionicons name="checkmark" size={22} color={Colors.white} />
                </View>
            ) : ctaLabel && onPress ? (
                <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.8}>
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        //gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    leftIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.offWhite,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: Colors.darkGrey,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.darkGrey,
        marginTop: 4,
        lineHeight: 18,
        fontFamily: 'Poppins_400Regular',
        //paddingRight: 4,
    },
    cta: {
        alignSelf: 'center',
        marginVertical: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 22,
    },
    ctaText: {
        color: Colors.white,
        fontFamily: 'Poppins_500Medium',
        fontSize: 13,
    },
    successIconWrap: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    dateDay: {
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
        color: Colors.darkGrey,
        lineHeight: 12,
    },
    dateMonth: {
        fontSize: 9,
        fontFamily: 'Poppins_400Regular',
        color: Colors.mediumGrey,
        lineHeight: 10,
    },
});

export default ActionCallout;
