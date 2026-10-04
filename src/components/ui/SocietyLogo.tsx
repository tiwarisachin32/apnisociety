import React, { useState } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export interface SocietyLogoProps {
  societyName?: string;
  societyCode?: string;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showBadgeBorder?: boolean;
}

const SIZE_MAP = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 52,
};

export const SocietyLogo: React.FC<SocietyLogoProps> = ({
  societyName = 'Society',
  societyCode,
  logoUrl,
  size = 'md',
  style,
  imageStyle,
  showBadgeBorder = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 36;

  // Extract initials (e.g. "Shanti Heights RWA" -> "SH")
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'SC').toUpperCase();
  };

  const initials = getInitials(societyName);

  if (logoUrl && !imageError) {
    return (
      <View
        style={[
          styles.container,
          showBadgeBorder && styles.badgeBorder,
          { width: pixelSize, height: pixelSize, borderRadius: pixelSize / 2 },
          style,
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
          style={[
            styles.image,
            { width: pixelSize, height: pixelSize, borderRadius: pixelSize / 2 },
            imageStyle,
          ]}
          resizeMode="cover"
          onError={() => setImageError(true)}
          accessibilityLabel={`${societyName} Official Crest`}
        />
      </View>
    );
  }

  // Society Internal Monogram Crest Badge
  const fontSize = Math.max(10, Math.floor(pixelSize * 0.4));

  return (
    <View
      style={[
        styles.initialsBadge,
        showBadgeBorder && styles.badgeBorder,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius: pixelSize * 0.28,
        },
        style,
      ]}
      accessibilityLabel={`${societyName} Society Crest`}
    >
      <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  badgeBorder: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsBadge: {
    backgroundColor: '#0F766E', // Distinct deep teal/emerald for society internal crests
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
});

export default SocietyLogo;
