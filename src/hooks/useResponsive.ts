import { Platform, useWindowDimensions } from 'react-native';
import { DeviceType, ResponsiveInfo } from '../types';
import { getDeviceType, isDesktopScreen, isMobileScreen, isTabletScreen } from '../utils/responsive';

/**
 * Custom hook providing responsive layout metrics and flags.
 * Seamlessly works across Android, iOS, and Web using standard React Native useWindowDimensions.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = isMobileScreen(width);
  const isTablet = isTabletScreen(width);
  const isDesktop = isDesktopScreen(width);
  const deviceType: DeviceType = getDeviceType(width);
  const isWeb = Platform.OS === 'web';

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    deviceType,
  };
}

export default useResponsive;
