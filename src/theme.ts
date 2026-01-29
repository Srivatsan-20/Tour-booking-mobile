import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
    // Brand Colors
    primary: '#4F46E5', // Indigo 600 - Modern, professional, trustworthy
    primaryDark: '#4338CA', // Indigo 700
    primaryLight: '#E0E7FF', // Indigo 100

    secondary: '#0EA5E9', // Sky 500 - Secondary accent
    secondaryLight: '#E0F2FE', // Sky 100

    // Semantic Colors
    background: '#F9FAFB', // Gray 50 - Very clean light grey
    surface: '#FFFFFF',

    textPrimary: '#111827', // Gray 900
    textSecondary: '#4B5563', // Gray 600
    textTertiary: '#9CA3AF', // Gray 400
    textInverted: '#FFFFFF',

    border: '#E5E7EB', // Gray 200
    divider: '#F3F4F6', // Gray 100

    // Status
    success: '#10B981', // Emerald 500
    successBg: '#ECFDF5',

    error: '#EF4444', // Red 500
    errorBg: '#FEF2F2',

    warning: '#F59E0B', // Amber 500
    warningBg: '#FFFBEB',

    info: '#3B82F6', // Blue 500
    infoBg: '#EFF6FF',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const RADIUS = {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 30, // For capsules
    round: 9999,
};

export const FONT_SIZE = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    huge: 40,
};

export const FONT_WEIGHT = {
    regular: '400',
    medium: '500',
    bold: '700',
    heavy: '800',
} as const;

export const SHADOWS = {
    soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: {
        shadowColor: '#64748B', // BlueGray
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    strong: {
        shadowColor: '#4F46E5', // Primary colored shadow for emphasis
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
};

export const GLOBAL_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
