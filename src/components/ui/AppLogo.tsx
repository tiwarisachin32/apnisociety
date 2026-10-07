import React, { useState } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { APP_NAME, APP_TAGLINE } from '../../constants/app';

export interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'mark' | 'horizontal' | 'stacked';
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 120,
  '2xl': 180,
};

// Official ApniSociety logo asset path (served statically via /logo.png and generated bundle)
export const OFFICIAL_APNISOCIETY_LOGO_URI = '/logo.png';

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  variant = 'mark',
  showTagline = false,
  style,
  imageStyle,
  textStyle,
}) => {
  const [imageError, setImageError] = useState(false);
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 40;

  // Square container for the logo so it's fully visible and never cut
  const renderMark = () => {
    const pad = Math.max(1, Math.round(pixelSize * 0.03));
    if (!imageError) {
      return (
        <View
          style={[
            styles.squareContainer,
            {
              width: pixelSize,
              height: pixelSize,
              minWidth: pixelSize,
              minHeight: pixelSize,
              maxWidth: pixelSize,
              maxHeight: pixelSize,
              aspectRatio: 1,
              flexShrink: 0,
              padding: pad,
            },
            variant === 'mark' ? style : undefined,
          ]}
        >
          <Image
            source={{ uri: OFFICIAL_APNISOCIETY_LOGO_URI }}
            style={[
              styles.image,
              imageStyle,
            ]}
            resizeMode="contain"
            onError={() => setImageError(true)}
            accessibilityLabel="ApniSociety Official Logo"
          />
        </View>
      );
    }

    // Vector-styled SVG-like fallback
    return (
      <View
        style={[
          styles.fallbackBadge,
          {
            width: pixelSize,
            height: pixelSize,
            minWidth: pixelSize,
            minHeight: pixelSize,
            aspectRatio: 1,
            flexShrink: 0,
            borderRadius: borderRadius.md,
          },
          variant === 'mark' ? (style as ViewStyle) : undefined,
          imageStyle as ViewStyle,
        ]}
      >
        <Text style={[styles.fallbackEmoji, { fontSize: pixelSize * 0.5 }]}>🏢</Text>
      </View>
    );
  };

  if (variant === 'mark') {
    return renderMark();
  }

  if (variant === 'horizontal') {
    return (
      <View style={[styles.rowContainer, style]}>
        {renderMark()}
        <View style={styles.textColHorizontal}>
          <View style={styles.brandTitleRow}>
            <Text style={[styles.brandTitleText, textStyle]}>
              <Text style={styles.brandApni}>Apni</Text>
              <Text style={styles.brandSociety}>Society</Text>
            </Text>
          </View>
          {showTagline && (
            <Text style={styles.brandTaglineSmall} numberOfLines={1}>
              {APP_TAGLINE}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Stacked variant (emblem on top, typography below)
  return (
    <View style={[styles.stackedContainer, style]}>
      {renderMark()}
      <View style={styles.stackedTextCol}>
        <Text style={[styles.stackedBrandTitle, textStyle]}>
          <Text style={styles.brandApni}>Apni</Text>
          <Text style={styles.brandSociety}>Society</Text>
        </Text>
        {showTagline && (
          <Text style={styles.stackedBrandTagline}>
            {APP_TAGLINE}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    aspectRatio: 1,
    flexShrink: 0,
    overflow: 'visible',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stackedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  image: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    aspectRatio: 1,
  },
  fallbackBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    lineHeight: undefined,
  },
  textColHorizontal: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.3,
  },
  brandApni: {
    color: '#0F2C59',
  },
  brandSociety: {
    color: '#059669',
  },
  brandTaglineSmall: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    marginTop: 1,
  },
  stackedTextCol: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  stackedBrandTitle: {
    fontSize: typography.sizes.xl + 2,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  stackedBrandTagline: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
});

export default AppLogo;
