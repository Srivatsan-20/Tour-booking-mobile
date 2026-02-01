import React from 'react';
import { StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

interface ScreenContainerProps extends SafeAreaViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
    children,
    style,
    edges = ['top'],
    ...props
}) => {
    return (
        <SafeAreaView
            style={[styles.container, style]}
            edges={edges}
            {...props}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            {children}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});
