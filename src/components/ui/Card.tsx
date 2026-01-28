import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';

type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
};

export function Card({ children, style }: Props) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.md,
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
});
