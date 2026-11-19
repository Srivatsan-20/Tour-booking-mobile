import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle
} from 'react-native';
import { Theme } from '../theme';

interface HeritageButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'gold' | 'outline' | 'ghost';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const HeritageButton = ({
    title,
    onPress,
    loading,
    variant = 'gold',
    style,
    textStyle
}: HeritageButtonProps) => {
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
            style={[
                styles.button,
                variant === 'gold' && styles.goldButton,
                isOutline && styles.outlineButton,
                isGhost && styles.ghostButton,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'gold' ? '#000' : Theme.colors.gold} />
            ) : (
                <Text style={[
                    styles.text,
                    variant === 'gold' && styles.goldText,
                    (isOutline || isGhost) && styles.outlineText,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: Theme.borderRadius.lg,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    goldButton: {
        backgroundColor: Theme.colors.gold,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Theme.colors.gold,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    text: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    goldText: {
        color: '#000',
    },
    outlineText: {
        color: Theme.colors.gold,
    },
});
