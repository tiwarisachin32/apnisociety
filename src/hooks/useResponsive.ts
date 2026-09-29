import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { DeviceType, ResponsiveInfo } from '../types';
import { getDeviceType, isDesktopScreen, isMobileScreen, isTabletScreen } from '../utils/responsive';

/**
 * Custom hook providing responsive layout metrics and flags.
 * Seamlessly works across Android, iOS, and Web.
 */
export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth || Dimensions.get('window').width || 390,
        height: window.innerHeight || Dimensions.get('window').height || 844,
      };
    }
    const windowDim = Dimensions.get('window');
    return {
      width: windowDim.width || 390,
      height: windowDim.height || 844,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      } else {
        const win = Dimensions.get('window');
        setDimensions({
          width: win.width,
          height: win.height,
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    const subscription = Dimensions.addEventListener?.('change', ({ window: win }: { window: { width: number; height: number } }) => {
      setDimensions({
        width: win.width,
        height: win.height,
      });
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      subscription?.remove?.();
    };
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;
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
