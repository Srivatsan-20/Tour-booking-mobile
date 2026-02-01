import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface DashboardCardProps {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    onPress: () => void;
    style?: ViewStyle;
    color?: string; // Accent color
    layout?: 'horizontal' | 'vertical';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    subtitle,
    icon,
    onPress,
    style,
    color = '#2563EB', // Default blue
    layout = 'horizontal',
}) => {
    const isVertical = layout === 'vertical';

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                isVertical && styles.cardVertical,
                pressed && styles.pressed,
                style,
            ]}
            onPress={onPress}
        >
            <View style={[
                styles.iconContainer,
                isVertical && styles.iconContainerVertical,
                { backgroundColor: color + '15' }
            ]}>
                {icon}
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={isVertical ? 2 : 1}>{title}</Text>
                {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
            </View>

            {isVertical ? (
                <View style={styles.chevronVertical}>
                    <ChevronRight size={20} color="#9CA3AF" />
                </View>
            ) : (
                <ChevronRight size={20} color="#9CA3AF" />
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardVertical: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        minHeight: 140, // consistent height for grid
    },
    pressed: {
        opacity: 0.7,
        backgroundColor: '#F9FAFB',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainerVertical: {
        marginRight: 0,
        marginBottom: 4,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    chevronVertical: {
        position: 'absolute',
        top: 16,
        right: 16,
    }
});
