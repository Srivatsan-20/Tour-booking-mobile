import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../constants/Theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 30, // Subtle blur
    noPadding = false
}) => {
    // Android doesn't always handle BlurView well over complex gradients without performance hits,
    // so we can use a semi-transparent background as a fallback or enhancement.
    const isAndroid = Platform.OS === 'android';
    const containerBg = isAndroid ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.1)';

    return (
        <View style={[styles.wrapper, style]}>
            {/* Gradient Border */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.borderGradient}
            >
                {/* Glass Content */}
                <BlurView
                    intensity={isAndroid ? 0 : intensity}
                    tint="dark"
                    style={[
                        styles.content,
                        { backgroundColor: containerBg },
                        !noPadding && styles.padding
                    ]}
                >
                    {children}
                </BlurView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: Theme.layout.borderRadius,
        overflow: 'hidden',
        marginBottom: Theme.spacing.md,
    },
    borderGradient: {
        padding: 1, // The border width
        borderRadius: Theme.layout.borderRadius,
    },
    content: {
        borderRadius: Theme.layout.borderRadius - 1, // Inner radius slightly smaller
        width: '100%',
    },
    padding: {
        padding: Theme.layout.cardPadding,
    }
});
