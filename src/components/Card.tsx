import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    variant?: 'elevated' | 'outlined' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    onPress,
    variant = 'elevated',
    padding = 'md',
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'elevated': return styles.elevated;
            case 'outlined': return styles.outlined;
            case 'flat': return styles.flat;
            default: return styles.elevated;
        }
    };

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return SPACING.sm;
            case 'md': return SPACING.md;
            case 'lg': return SPACING.lg;
            default: return SPACING.md;
        }
    };

    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={[
                styles.base,
                getVariantStyle(),
                { padding: getPadding() },
                style
            ]}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    base: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.md,
    },
    elevated: {
        ...SHADOWS.soft,
    },
    outlined: {
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    flat: {
        backgroundColor: 'transparent',
    },
});
