import React from 'react';
import { StyleSheet, View, ViewStyle, StatusBar, StyleProp } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { Theme } from '../constants/Theme';

interface ScreenContainerProps extends SafeAreaViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
    children,
    style,
    edges = ['top'],
    ...props
}) => {
    return (
        <View style={styles.background}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <SafeAreaView
                style={[styles.container, style]}
                edges={edges}
                {...props}
            >
                {children}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    container: {
        flex: 1,
    },
});
