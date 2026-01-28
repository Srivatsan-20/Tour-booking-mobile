import * as React from 'react';
import type { PropsWithChildren } from 'react';
import {
  Platform,
  type ScrollViewProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useHeaderHeight } from '@react-navigation/elements';

/**
 * Legacy hook for compatibility.
 * The react-native-keyboard-aware-scroll-view library handles scrolling automatically,
 * so this hook now returns a no-op function.
 */
export function useScrollToFocusedInput(_extraOffset: number = 24) {
  return React.useCallback(() => { }, []);
}

type Props = PropsWithChildren<
  Omit<ScrollViewProps, 'contentContainerStyle'> & {
    contentContainerStyle?: StyleProp<ViewStyle>;
    /** Extra bottom padding (handled via extraHeight/extraScrollHeight in the library) */
    bottomInset?: number;
  }
>;

/**
 * Common wrapper for form screens using react-native-keyboard-aware-scroll-view.
 */
export function KeyboardAvoidingScrollView({
  children,
  contentContainerStyle,
  bottomInset = 32,
  keyboardDismissMode = 'on-drag',
  keyboardShouldPersistTaps = 'always',
  ...rest
}: Props) {
  const headerHeight = useHeaderHeight();

  // On Android, we enable the library. On iOS, it's enabled by default.
  // We add some extra height to ensure the field isn't stuck at the very bottom.
  const extraScrollHeight = Platform.OS === 'ios' ? headerHeight + 50 : 180;

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={extraScrollHeight}
      extraHeight={Platform.OS === 'ios' ? headerHeight + 80 : 200}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[
        styles.defaultContent,
        contentContainerStyle,
        // We can still apply some bottom padding if needed, but the library handles the keyboard offset.
        { paddingBottom: bottomInset }
      ]}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  defaultContent: { flexGrow: 1 },
});
