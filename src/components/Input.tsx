import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    StyleProp
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
    rightIcon?: React.ReactNode;
    leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    rightIcon,
    leftIcon,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                error ? styles.errorBorder : {},
                props.editable === false ? styles.disabled : {},
            ]}>
                {leftIcon && <View style={styles.iconContainerLeft}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={COLORS.textTertiary}
                    selectionColor={COLORS.primary}
                    {...props}
                />
                {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md, // Comfortable touch target
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
    },
    iconContainer: {
        paddingRight: SPACING.md,
    },
    iconContainerLeft: {
        paddingLeft: SPACING.md,
    },
    errorBorder: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorBg,
    },
    disabled: {
        backgroundColor: COLORS.background,
        borderColor: COLORS.border,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.error,
        marginTop: SPACING.xs,
        marginLeft: SPACING.xs,
    },
});
