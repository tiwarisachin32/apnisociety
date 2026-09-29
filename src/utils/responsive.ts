import { BREAKPOINTS } from '../constants/app';
import { DeviceType } from '../types';

/**
 * Returns whether the given width is considered mobile (< 768px).
 */
export function isMobileScreen(width: number): boolean {
  return width < BREAKPOINTS.mobile;
}

/**
 * Returns whether the given width is considered tablet (768px to 1023px).
 */
export function isTabletScreen(width: number): boolean {
  return width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
}

/**
 * Returns whether the given width is considered desktop (>= 1024px).
 */
export function isDesktopScreen(width: number): boolean {
  return width >= BREAKPOINTS.tablet;
}

/**
 * Categorizes screen width into DeviceType.
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Resolves a value according to current screen width.
 */
export function getResponsiveValue<T>(
  width: number,
  values: { mobile: T; tablet?: T; desktop?: T }
): T {
  if (isDesktopScreen(width) && values.desktop !== undefined) {
    return values.desktop;
  }
  if (isTabletScreen(width) && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.mobile;
}
