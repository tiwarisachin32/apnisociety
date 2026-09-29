import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { useResponsive } from '../../hooks/useResponsive';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  maxWidth = 1120,
  style,
  contentContainerStyle,
}) => {
  const { isMobile, isDesktop } = useResponsive();

  const containerPadding = isMobile
    ? spacing.md
    : isDesktop
    ? spacing.xl
    : spacing.lg;

  const innerStyle: ViewStyle = {
    maxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: containerPadding,
    paddingVertical: isMobile ? spacing.md : spacing.xl,
  };

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.root, style]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={innerStyle}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, style]}>
      <View style={[styles.staticContent, innerStyle, contentContainerStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});

export default ScreenContainer;
