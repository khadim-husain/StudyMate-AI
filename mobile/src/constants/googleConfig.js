import { Platform } from 'react-native';

// Safe placeholder so expo-auth-session invariant checks do not crash at render time
// when EXPO_PUBLIC_GOOGLE_CLIENT_ID_* environment variables are empty during development.
export const PLACEHOLDER_CLIENT_ID = '1014169992683-placeholder.apps.googleusercontent.com';

const webId = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '').trim();
const androidId = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '').trim();
const iosId = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '').trim();

export const GOOGLE_AUTH_CONFIG = {
  clientId: webId || PLACEHOLDER_CLIENT_ID,
  webClientId: webId || PLACEHOLDER_CLIENT_ID,
  androidClientId: androidId || PLACEHOLDER_CLIENT_ID,
  iosClientId: iosId || PLACEHOLDER_CLIENT_ID,
};

export const hasRealGoogleClientId = () => {
  const currentPlatformId = Platform.select({
    web: webId,
    android: androidId,
    ios: iosId,
    default: webId,
  });
  return Boolean(
    currentPlatformId &&
    currentPlatformId.length > 0 &&
    !currentPlatformId.includes('placeholder')
  );
};

