import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ViewStyle, StyleProp, Platform } from 'react-native';
import { COLORS, GLOBAL_STYLES, SPACING } from '../theme';

interface ScreenProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    unsafe?: boolean; // If true, don't use SafeAreaView (e.g., for full screen images)
    darkBar?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
    children,
    style,
    unsafe = false,
    darkBar = true,
}) => {
    const Wrapper = unsafe ? View : SafeAreaView;

    return (
        <Wrapper style={[styles.container, style]}>
            <StatusBar
                barStyle={darkBar ? 'dark-content' : 'light-content'}
                backgroundColor={COLORS.background}
            />
            <View style={styles.inner}>
                {children}
            </View>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    inner: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
});
