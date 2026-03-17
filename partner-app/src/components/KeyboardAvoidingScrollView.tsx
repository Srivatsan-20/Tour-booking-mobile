import * as React from 'react';
import type { PropsWithChildren } from 'react';
import {
  Dimensions,
  findNodeHandle,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  UIManager,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

type KeyboardScrollContextValue = {
  registerFocusedTag: (reactTag: number, extraOffset?: number) => void;
};

const KeyboardScrollContext = React.createContext<KeyboardScrollContextValue | null>(null);

/**
 * Use on a TextInput's `onFocus` to auto-scroll it above the keyboard.
 * Works when the input is rendered inside a KeyboardAvoidingScrollView.
 */
export function useScrollToFocusedInput(extraOffset: number = 24) {
  const ctx = React.useContext(KeyboardScrollContext);

  return React.useCallback(
    (e: any) => {
      const tag = e?.nativeEvent?.target;
      if (!ctx || typeof tag !== 'number') return;
      // Register the focused input; the wrapper will scroll it into view once the keyboard is shown.
      ctx.registerFocusedTag(tag, extraOffset);
    },
    [ctx, extraOffset]
  );
}

type Props = PropsWithChildren<
  Omit<ScrollViewProps, 'contentContainerStyle'> & {
    contentContainerStyle?: StyleProp<ViewStyle>;
    /** Extra bottom padding so the last field can scroll above the keyboard */
    bottomInset?: number;
  }
>;

/**
 * Common wrapper for form screens:
 * - prevents inputs being hidden behind the keyboard
 * - keeps taps working while keyboard is open
 */
export function KeyboardAvoidingScrollView({
  children,
  contentContainerStyle,
  bottomInset = 32,
  keyboardDismissMode = 'on-drag',
  keyboardShouldPersistTaps = 'always',
  onScroll: onScrollProp,
  scrollEventThrottle = 16,
  ...rest
}: Props) {
  const headerHeight = useHeaderHeight();
  const scrollRef = React.useRef<ScrollView>(null);
  const focusedRef = React.useRef<{ tag: number; extraOffset: number } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [keyboardTopY, setKeyboardTopY] = React.useState<number | null>(null);
  const scrollYRef = React.useRef(0);

  React.useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvt as any, (e: any) => {
      const h = e?.endCoordinates?.height;
      const topY = e?.endCoordinates?.screenY;
      if (typeof h === 'number') setKeyboardHeight(h);
      else setKeyboardHeight(0);
      setKeyboardTopY(typeof topY === 'number' ? topY : null);
    });

    const subHide = Keyboard.addListener(hideEvt as any, () => {
      setKeyboardHeight(0);
      setKeyboardTopY(null);
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const scrollFocusedIntoView = React.useCallback(() => {
    const sv: any = scrollRef.current;
    const focused = focusedRef.current;
    if (!sv?.scrollResponderScrollNativeHandleToKeyboard || !focused) return;

    // Use RN's built-in helper; call it only after the keyboard is visible (more reliable on Android/Expo Go).
    sv.scrollResponderScrollNativeHandleToKeyboard(focused.tag, focused.extraOffset, true);
  }, []);

  const scrollFocusedIntoViewAndroid = React.useCallback(() => {
    const focused = focusedRef.current;
    const sv = scrollRef.current;
    if (!focused || !sv || keyboardHeight <= 0) return;

    // On Android (especially Expo Go / adjustPan), `scrollResponderScrollNativeHandleToKeyboard`
    // can be unreliable. Use measurement + explicit scroll.
    const tag = typeof focused.tag === 'number' ? focused.tag : findNodeHandle(focused.tag as any);
    if (!tag) return;

    const windowHeight = Dimensions.get('window').height;
    // Prefer the OS-reported keyboard top position when available (more accurate across adjustPan/adjustResize).
    const keyboardTop = keyboardTopY ?? (windowHeight - keyboardHeight);
    const extra = focused.extraOffset ?? 24;

    UIManager.measureInWindow(tag, (_x: number, y: number, _w: number, h: number) => {
      const inputBottom = y + h;
      const desiredBottom = keyboardTop - extra;
      const overlap = inputBottom - desiredBottom;
      if (overlap > 0) {
        sv.scrollTo({ y: Math.max(0, scrollYRef.current + overlap), animated: true });
      }
    });
  }, [keyboardHeight, keyboardTopY]);

  React.useEffect(() => {
    if (keyboardHeight <= 0) return;
    // After the keyboard animation/layout settles, scroll the focused input into view.
    const id = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (Platform.OS === 'android') scrollFocusedIntoViewAndroid();
        else scrollFocusedIntoView();
      });
    }, 50);
    return () => clearTimeout(id);
  }, [keyboardHeight, scrollFocusedIntoView, scrollFocusedIntoViewAndroid]);

  const registerFocusedTag = React.useCallback((reactTag: number, extraOffset: number = 24) => {
    focusedRef.current = { tag: reactTag, extraOffset };
    // If the keyboard is already open, scroll immediately.
    if (keyboardHeight > 0) {
      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          if (Platform.OS === 'android') scrollFocusedIntoViewAndroid();
          else scrollFocusedIntoView();
        });
      }, 0);
    }
  }, [keyboardHeight, scrollFocusedIntoView, scrollFocusedIntoViewAndroid]);

  const effectiveBottomInset = Platform.OS === 'android'
    ? Math.max(bottomInset, keyboardHeight + 24)
    : Math.max(bottomInset, 32);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <KeyboardScrollContext.Provider value={{ registerFocusedTag }}>
        <ScrollView
          ref={scrollRef}
          keyboardDismissMode={keyboardDismissMode}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          scrollEventThrottle={scrollEventThrottle}
          onScroll={(e) => {
            scrollYRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
            onScrollProp?.(e);
          }}
          contentContainerStyle={[styles.defaultContent, { paddingBottom: effectiveBottomInset }, contentContainerStyle]}
          {...rest}
        >
          {children}
        </ScrollView>
      </KeyboardScrollContext.Provider>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  defaultContent: { flexGrow: 1 },
});
