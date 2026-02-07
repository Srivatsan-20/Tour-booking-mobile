export const Theme = {
    colors: {
        background: '#FFFFFF', // Pure White
        surface: '#FFFFFF', // Surface is also white (no cards)
        text: '#000000', // Pure Black
        textSecondary: '#8E8E93', // Neutral Gray
        primary: '#FF3B30', // Swiss Red (Accent)
        secondary: '#000000', // Secondary actions act like primary text
        danger: '#FF3B30',
        success: '#34C759',
        warning: '#FFCC00',
        divider: '#E5E5EA', // Light Gray
        border: '#000000', // For inputs etc
        icon: '#000000',
    },
    typography: {
        header1: {
            fontSize: 32,
            fontWeight: '700',
            color: '#000000',
            lineHeight: 40,
            letterSpacing: -0.5,
        },
        header2: {
            fontSize: 24,
            fontWeight: '600',
            color: '#000000',
            lineHeight: 32,
            letterSpacing: -0.5,
        },
        header3: {
            fontSize: 20,
            fontWeight: '600',
            color: '#000000',
            lineHeight: 28,
        },
        bodyLarge: {
            fontSize: 18,
            fontWeight: '400',
            color: '#000000',
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: '400',
            color: '#374151',
            lineHeight: 24,
        },
        caption: {
            fontSize: 14,
            fontWeight: '400',
            color: '#6b7280',
            lineHeight: 20,
        },
        button: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            letterSpacing: 0.5,
        },
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },
    layout: {
        borderRadius: 12,
        borderWidth: 1,
        cardPadding: 16,
        shadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        shadowSoft: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
    },
} as const;
