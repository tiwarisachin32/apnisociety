/**
 * Device Session Management for Multi-Device Concurrent Logins
 * Ensures that an account can be logged in simultaneously on multiple devices
 * (mobile phones, tablets, work laptops, desktop PCs) without session collision or forced logouts.
 */

export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser: string;
  loginTime: string;
  lastActive: string;
  isCurrentDevice: boolean;
  status: 'active' | 'expired';
}

const DEVICE_ID_KEY = 'apnisociety_client_device_id';
const SESSIONS_STORAGE_PREFIX = 'apnisociety_device_sessions_';

/**
 * Returns or generates a persistent device ID for this client/browser
 */
export function getCurrentDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 9);
      id = `dev_${Date.now().toString(36)}_${rand}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'fallback-device-id';
  }
}

/**
 * Detects device hardware type, OS platform, and web browser
 */
export function detectCurrentDeviceInfo(): {
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceName: 'ApniSociety Client',
      deviceType: 'desktop',
      platform: 'Web',
      browser: 'Browser',
    };
  }

  const ua = window.navigator.userAgent || '';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let platform = 'Unknown OS';
  let browser = 'Web Browser';

  // Detect Device Type
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle)/i.test(ua);
  const isMobile = !isTablet && /(android|bb\d+|meego|mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino)/i.test(ua);

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }

  // Detect Platform
  if (/android/i.test(ua)) platform = 'Android';
  else if (/ipad|iphone|ipod/i.test(ua)) platform = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) platform = 'macOS';
  else if (/windows/i.test(ua)) platform = 'Windows';
  else if (/linux/i.test(ua)) platform = 'Linux';

  // Detect Browser
  if (/chrome|crios/i.test(ua) && !/edge|edg|opr|opera/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg|edge/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  const deviceName = `${platform} ${deviceType === 'desktop' ? 'PC' : deviceType === 'tablet' ? 'Tablet' : 'Phone'} (${browser})`;

  return { deviceName, deviceType, platform, browser };
}

/**
 * Registers or touches the current device session for the user.
 * Preserves existing sessions so other devices stay concurrently logged in.
 */
export function registerDeviceSession(userId: string): DeviceSession {
  const currentId = getCurrentDeviceId();
  const info = detectCurrentDeviceInfo();
  const now = new Date().toISOString();

  const newSession: DeviceSession = {
    deviceId: currentId,
    deviceName: info.deviceName,
    deviceType: info.deviceType,
    platform: info.platform,
    browser: info.browser,
    loginTime: now,
    lastActive: now,
    isCurrentDevice: true,
    status: 'active',
  };

  if (typeof window === 'undefined') return newSession;

  try {
    const key = `${SESSIONS_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let sessions: DeviceSession[] = [];
    if (raw) {
      try {
        sessions = JSON.parse(raw);
      } catch {}
    }

    // Filter out old or update current
    const index = sessions.findIndex((s) => s.deviceId === currentId);
    if (index >= 0) {
      sessions[index] = {
        ...sessions[index],
        lastActive: now,
        status: 'active',
        deviceName: info.deviceName,
      };
    } else {
      sessions.push(newSession);
    }

    localStorage.setItem(key, JSON.stringify(sessions));
  } catch {
    // Ignore storage issues
  }

  return newSession;
}

/**
 * Gets all registered active sessions for a user, marking the current device.
 */
export function getActiveDeviceSessions(userId: string): DeviceSession[] {
  const currentId = getCurrentDeviceId();
  if (typeof window === 'undefined') {
    const info = detectCurrentDeviceInfo();
    return [
      {
        deviceId: currentId,
        deviceName: info.deviceName,
        deviceType: info.deviceType,
        platform: info.platform,
        browser: info.browser,
        loginTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isCurrentDevice: true,
        status: 'active',
      },
    ];
  }

  try {
    const key = `${SESSIONS_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let sessions: DeviceSession[] = [];
    if (raw) {
      try {
        sessions = JSON.parse(raw);
      } catch {}
    }

    if (sessions.length === 0) {
      // Create initial device session for the current client
      return [registerDeviceSession(userId)];
    }

    return sessions.map((s) => ({
      ...s,
      isCurrentDevice: s.deviceId === currentId,
    }));
  } catch {
    return [];
  }
}

/**
 * Terminates a specific device session
 */
export function terminateDeviceSession(userId: string, targetDeviceId: string): DeviceSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${SESSIONS_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    let sessions: DeviceSession[] = JSON.parse(raw);
    sessions = sessions.filter((s) => s.deviceId !== targetDeviceId);
    localStorage.setItem(key, JSON.stringify(sessions));
    return sessions;
  } catch {
    return [];
  }
}

/**
 * Terminates all sessions other than the current device
 */
export function terminateAllOtherSessions(userId: string): DeviceSession[] {
  const currentId = getCurrentDeviceId();
  if (typeof window === 'undefined') return [];
  try {
    const key = `${SESSIONS_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    let sessions: DeviceSession[] = JSON.parse(raw);
    sessions = sessions.filter((s) => s.deviceId === currentId);
    localStorage.setItem(key, JSON.stringify(sessions));
    return sessions;
  } catch {
    return [];
  }
}
