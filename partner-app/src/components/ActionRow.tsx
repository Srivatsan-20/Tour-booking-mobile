import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

interface ActionRowProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode; // Optional in Swiss design
    onPress: () => void;
    style?: ViewStyle;
    actionLabel?: string; // Optional text link instead of chevron
    isDestructive?: boolean;
}

export const ActionRow: React.FC<ActionRowProps> = ({
    title,
    subtitle,
    icon,
    onPress,
    style,
    actionLabel,
    isDestructive,
}) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
                style,
            ]}
            onPress={onPress}
        >
            <View style={styles.content}>
                {/* Icons are secondary, mainly for context if needed */}
                {icon && <View style={styles.iconContainer}>{icon}</View>}

                <View style={styles.textContainer}>
                    <Text style={[
                        styles.title,
                        isDestructive && styles.destructiveText
                    ]}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>

            <View style={styles.action}>
                {actionLabel ? (
                    <Text style={styles.actionLabel}>{actionLabel}</Text>
                ) : (
                    <ChevronRight size={20} color={Theme.colors.textSecondary} />
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.divider,
        backgroundColor: Theme.colors.background,
    },
    pressed: {
        opacity: 0.5,
        backgroundColor: '#F9F9F9',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Theme.spacing.md,
    },
    iconContainer: {
        // Minimalist icons, no background
        opacity: 0.8,
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
    title: {
        ...Theme.typography.bodyLarge,
        fontWeight: '600',
    },
    destructiveText: {
        color: Theme.colors.danger,
    },
    subtitle: {
        ...Theme.typography.caption,
        textTransform: 'none', // Editorial style often mixes case appropriately
        color: Theme.colors.textSecondary,
        fontSize: 15,
    },
    action: {
        marginLeft: Theme.spacing.md,
    },
    actionLabel: {
        ...Theme.typography.caption,
        color: Theme.colors.textSecondary,
        fontWeight: '600',
    },
});
