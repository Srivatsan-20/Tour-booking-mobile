import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Calendar, Users, MapPin, ChevronRight, Bus } from 'lucide-react-native';

interface ListCardProps {
    title: string;
    subtitle?: string;
    meta1?: { icon?: React.ReactNode; text: string };
    meta2?: { icon?: React.ReactNode; text: string };
    status?: { text: string; color: string; bg: string };
    onPress: () => void;
    style?: ViewStyle;
}

export const ListCard: React.FC<ListCardProps> = ({
    title,
    subtitle,
    meta1,
    meta2,
    status,
    onPress,
    style,
}) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
                style,
            ]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {status && (
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.text}
                        </Text>
                    </View>
                )}
            </View>

            {subtitle && (
                <View style={styles.row}>
                    <Calendar size={14} color="#6B7280" style={styles.icon} />
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
            )}

            <View style={styles.divider} />

            <View style={styles.footer}>
                <View style={styles.metaContainer}>
                    {meta1 && (
                        <View style={styles.metaItem}>
                            {meta1.icon ?? <Bus size={14} color="#6B7280" />}
                            <Text style={styles.metaText}>{meta1.text}</Text>
                        </View>
                    )}
                    {meta2 && (
                        <View style={styles.metaItem}>
                            {meta2.icon ?? <Users size={14} color="#6B7280" />}
                            <Text style={styles.metaText}>{meta2.text}</Text>
                        </View>
                    )}
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    pressed: {
        opacity: 0.8,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        marginRight: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
});
