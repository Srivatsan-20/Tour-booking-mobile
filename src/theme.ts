import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
    primary: '#0056D2', // Strong, accessible Blue
    primaryDark: '#003C9E',
    background: '#F2F4F8', // Very light cool grey, easy on eyes
    surface: '#FFFFFF',
    textPrimary: '#111827', // Almost black
    textSecondary: '#4B5563', // Dark grey
    border: '#D1D5DB',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    white: '#FFFFFF',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const FONT_SIZE = {
    sm: 16, // Minimum legible size for elderly
    md: 18, // Standard body
    lg: 22, // Subtitles
    xl: 28, // Titles
    xxl: 34, // Hero
};

export const SHADOWS = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    strong: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
};

export const GLOBAL_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        minHeight: 56, // Large touch target
    },
    btnPrimary: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56, // Large touch target
        ...SHADOWS.card,
    },
    btnText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
    },
    btnSecondary: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    btnTextSecondary: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
    },
});
