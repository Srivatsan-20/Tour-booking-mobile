import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    StyleProp
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS, FONT_WEIGHT } from '../theme';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    style,
    textStyle,
    leftIcon,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return COLORS.border;
        switch (variant) {
            case 'primary': return COLORS.primary;
            case 'secondary': return COLORS.secondary;
            case 'danger': return COLORS.error;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return COLORS.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return COLORS.textTertiary;
        switch (variant) {
            case 'primary': return COLORS.textInverted;
            case 'secondary': return COLORS.textInverted;
            case 'danger': return COLORS.textInverted;
            case 'outline': return COLORS.primary;
            case 'ghost': return COLORS.primary;
            default: return COLORS.textInverted;
        }
    };

    const getBorder = () => {
        if (variant === 'outline' && !disabled) {
            return { borderWidth: 1.5, borderColor: COLORS.primary };
        }
        return {};
    };

    const getHeight = () => {
        switch (size) {
            case 'sm': return 36;
            case 'md': return 48; // Standard clickable height
            case 'lg': return 56;
            default: return 48;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return FONT_SIZE.sm;
            case 'md': return FONT_SIZE.md;
            case 'lg': return FONT_SIZE.lg;
            default: return FONT_SIZE.md;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.base,
                {
                    backgroundColor: getBackgroundColor(),
                    height: getHeight(),
                    ...getBorder(),
                },
                variant === 'primary' && !disabled ? SHADOWS.medium : {},
                style,
            ]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {leftIcon && leftIcon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(),
                                fontSize: getFontSize(),
                                marginLeft: leftIcon ? SPACING.sm : 0,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg,
    },
    text: {
        fontWeight: FONT_WEIGHT.bold,
    },
});
