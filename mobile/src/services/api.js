import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOCK_USER,
  MOCK_DOCUMENTS,
  MOCK_TASKS,
  MOCK_QUIZ,
  MOCK_FLASHCARDS,
  MOCK_CHAT_MESSAGES,
  MOCK_ANALYTICS,
  MOCK_CHAT_HISTORIES,
} from './mockData';

// Set to FALSE to connect to the live FastAPI PostgreSQL backend!
export const USE_MOCK_DATA = false;

// Candidate URLs for StudyMate AI Backend
export const CANDIDATE_URLS = {
  PRODUCTION_RENDER: 'https://studymate-ai-backend-cwa4.onrender.com/api/v1',
  CLOUDFLARE_TUNNEL: 'https://ceiling-ministry-investing-kitty.trycloudflare.com/api/v1',
  LAN_CURRENT: 'http://172.19.119.123:8000/api/v1',
  TUNNEL: 'https://studymate-ai-dev.loca.lt/api/v1',
  TUNNEL_FALLBACK: 'https://studymate-ai-api.loca.lt/api/v1',
  LAN_HOTSPOT: 'http://172.20.10.5:8000/api/v1',
  LAN_WIFI: 'http://10.10.5.167:8000/api/v1',
  LOCALHOST: 'http://localhost:8000/api/v1',
  EMULATOR: 'http://10.0.2.2:8000/api/v1',
};

// Cached active backend URL
let activeBackendUrl = null;

// AsyncStorage key for user-configured or verified server URL
const SERVER_URL_KEY = '@studymate_active_server';

// Initialize and restore verified URL from storage
AsyncStorage.getItem(SERVER_URL_KEY).then((stored) => {
  if (stored && stored.startsWith('http')) {
    activeBackendUrl = stored;
  }
}).catch(() => { });

/**
 * Returns the list of candidates to try in order of priority.
 * Detects whether Expo is running in tunnel mode (e.g. ngrok / exp.direct)
 * and prioritizes cloud tunnels to eliminate local LAN timeouts.
 */
export const getServerCandidates = () => {
  const candidates = [];

  // 1. Build-time or runtime environment variable override (e.g. for EAS production builds or custom tunnels)
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl && envApiUrl.startsWith('http')) {
    const cleanEnvUrl = envApiUrl.replace(/\/+$/, '');
    const finalEnvUrl = cleanEnvUrl.endsWith('/api/v1') ? cleanEnvUrl : `${cleanEnvUrl}/api/v1`;
    if (!candidates.includes(finalEnvUrl)) {
      candidates.push(finalEnvUrl);
    }
  }

  // 2. Default production cloud backend on Render
  if (!candidates.includes(CANDIDATE_URLS.PRODUCTION_RENDER)) {
    candidates.push(CANDIDATE_URLS.PRODUCTION_RENDER);
  }

  // 3. If user previously had a verified or custom URL, try it
  if (activeBackendUrl && !candidates.includes(activeBackendUrl)) {
    candidates.push(activeBackendUrl);
  }

  // 3. Web browser: use window hostname or localhost
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const webHostUrl = `http://${window.location.hostname}:8000/api/v1`;
      if (!candidates.includes(webHostUrl)) candidates.push(webHostUrl);
    }
    if (!candidates.includes(CANDIDATE_URLS.LOCALHOST)) {
      candidates.push(CANDIDATE_URLS.LOCALHOST);
    }
    return candidates;
  }

  // 3.5. Cloudflare Tunnel (reliable public HTTPS, bypasses all firewall and local IP changes)
  if (CANDIDATE_URLS.CLOUDFLARE_TUNNEL && !candidates.includes(CANDIDATE_URLS.CLOUDFLARE_TUNNEL)) {
    candidates.push(CANDIDATE_URLS.CLOUDFLARE_TUNNEL);
  }

  // 4. Check if Metro is running via Tunnel (e.g. ngrok or exp.direct)
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    '';
  const isTunnelMode = hostUri.includes('exp.direct') || hostUri.includes('ngrok');

  if (isTunnelMode) {
    // When running Expo in tunnel mode, physical devices connect over the internet.
    if (!candidates.includes(CANDIDATE_URLS.CLOUDFLARE_TUNNEL)) candidates.push(CANDIDATE_URLS.CLOUDFLARE_TUNNEL);
    if (!candidates.includes(CANDIDATE_URLS.TUNNEL)) candidates.push(CANDIDATE_URLS.TUNNEL);
    if (!candidates.includes(CANDIDATE_URLS.TUNNEL_FALLBACK)) candidates.push(CANDIDATE_URLS.TUNNEL_FALLBACK);
  }

  // 5. Local network dynamic host (from Metro hostUri if not tunnel)
  const host = hostUri.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('ngrok') && !host.includes('exp.direct')) {
    const dynamicHostUrl = `http://${host}:8000/api/v1`;
    if (!candidates.includes(dynamicHostUrl)) candidates.push(dynamicHostUrl);
  }

  // 6. LAN Wi-Fi / Hotspot IPs (for physical Android phone connecting to development PC)
  if (!candidates.includes(CANDIDATE_URLS.LAN_CURRENT)) {
    candidates.push(CANDIDATE_URLS.LAN_CURRENT);
  }
  if (!candidates.includes(CANDIDATE_URLS.LAN_HOTSPOT)) {
    candidates.push(CANDIDATE_URLS.LAN_HOTSPOT);
  }
  if (!candidates.includes(CANDIDATE_URLS.LAN_WIFI)) {
    candidates.push(CANDIDATE_URLS.LAN_WIFI);
  }

  // 7. Tunnel endpoints (if not already added in tunnel mode)
  if (!candidates.includes(CANDIDATE_URLS.TUNNEL)) {
    candidates.push(CANDIDATE_URLS.TUNNEL);
  }
  if (!candidates.includes(CANDIDATE_URLS.TUNNEL_FALLBACK)) {
    candidates.push(CANDIDATE_URLS.TUNNEL_FALLBACK);
  }

  // 8. Android Emulator (only if running inside emulator)
  if (Platform.OS === 'android' && !candidates.includes(CANDIDATE_URLS.EMULATOR)) {
    candidates.push(CANDIDATE_URLS.EMULATOR);
  }

  // 9. Localhost fallback
  if (!candidates.includes(CANDIDATE_URLS.LOCALHOST)) {
    candidates.push(CANDIDATE_URLS.LOCALHOST);
  }

  return candidates;
};

// Dynamically resolves host IP so physical phones and web clients connect seamlessly
export const getBackendBaseUrl = () => {
  if (activeBackendUrl) return activeBackendUrl;
  const candidates = getServerCandidates();
  return candidates[0] || CANDIDATE_URLS.TUNNEL;
};

export const setCustomServerUrl = async (url) => {
  if (!url) return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const finalUrl = cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  activeBackendUrl = finalUrl;
  try {
    await AsyncStorage.setItem(SERVER_URL_KEY, finalUrl);
  } catch (_) { }
  return finalUrl;
};

export const getActiveServerUrl = () => {
  return getBackendBaseUrl();
};

export const testServerConnection = async (baseUrl) => {
  const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
  const healthEndpoint = `${rootUrl}/api/v1/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'bypass-tunnel-reminder': 'true',
        'Bypass-Tunnel-Reminder': 'true',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, data };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.message };
  }
};

/**
 * Probes candidate servers and automatically locks on to the best responding candidate.
 */
export const probeBestServer = async () => {
  const candidates = getServerCandidates();
  for (const candidate of candidates) {
    const test = await testServerConnection(candidate);
    if (test.ok) {
      await setCustomServerUrl(candidate);
      return { ok: true, url: candidate, data: test.data };
    }
  }
  return { ok: false, error: 'No reachable server candidates.' };
};

export const API_BASE_URL = getBackendBaseUrl();

const TOKEN_KEY = '@studymate_auth_token';

export const storage = {
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Error saving auth token:', e);
    }
  },
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Error reading auth token:', e);
      return null;
    }
  },
  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Error removing auth token:', e);
    }
  },
};

/**
 * Generic API client connected to FastAPI backend.
 * Automatically tries fallback candidates if a candidate is unreachable.
 */
async function request(endpoint, options = {}) {
  const token = await storage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'Bypass-Tunnel-Reminder': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const candidates = getServerCandidates();
  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const candidateBase = candidates[i];
    const isFirstCandidate = i === 0;
    // Timeout shorter (6s) on initial probe if candidate might be blocked, 15s for confirmed
    const timeoutDuration = candidates.length > 1 && isFirstCandidate ? 7000 : 15000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    try {
      const response = await fetch(`${candidateBase}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle proxy/gateway offline codes (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
      if (response.status >= 502 && response.status <= 504) {
        console.warn(`[API] Candidate ${candidateBase} returned gateway/tunnel error (HTTP ${response.status}). Trying next candidate...`);
        const gwErr = new Error(`Gateway offline (HTTP ${response.status}) at ${candidateBase}`);
        gwErr.isNetworkError = true;
        lastError = gwErr;
        continue;
      }

      // If we got a successful response (or even a valid 4xx app-level response), this host works!
      if (activeBackendUrl !== candidateBase) {
        activeBackendUrl = candidateBase;
        AsyncStorage.setItem(SERVER_URL_KEY, candidateBase).catch(() => { });
        console.log(`[API] Connected successfully to ${candidateBase}`);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMsg = '';
        if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map((e) => e.msg || e).join(', ');
        } else if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        }

        // Map status codes to specific, meaningful errors
        if (!errorMsg) {
          switch (response.status) {
            case 400:
              errorMsg = 'Invalid request. Please verify your submitted information.';
              break;
            case 401:
              errorMsg = 'Invalid email or password. Please verify your credentials.';
              break;
            case 403:
              errorMsg = 'Access forbidden. You do not have permission for this action.';
              break;
            case 404:
              errorMsg = 'Requested API endpoint not found on server (HTTP 404).';
              break;
            case 409:
              errorMsg = 'An account with this email address already exists. Please sign in instead.';
              break;
            case 422:
              errorMsg = 'Validation error: Please ensure email is formatted properly and password is at least 6 characters.';
              break;
            case 500:
              errorMsg = 'Internal server error. Please try again in a few moments.';
              break;
            default:
              errorMsg = `Server error (HTTP ${response.status}). Please try again.`;
          }
        }
        const appError = new Error(errorMsg);
        appError.status = response.status;
        throw appError;
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Check if error is a network routing/timeout error that warrants trying next candidate
      const isNetworkUnreachable =
        error.isNetworkError ||
        error.name === 'AbortError' ||
        error.message?.includes('canceled') ||
        error.message?.includes('cancelled') ||
        error.message?.includes('timed out') ||
        error.message?.includes('Network request failed') ||
        error.message?.includes('NoRouteToHostException') ||
        error.message?.includes('Host unreachable') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('Cleartext HTTP traffic');

      if (isNetworkUnreachable) {
        console.warn(`[API] Candidate ${candidateBase} unreachable (${error.message}). Trying next candidate...`);
        continue; // Try next candidate in the list
      } else {
        // App-level error (e.g. 401 Unauthorized, 400 Bad Request) - do not retry other servers
        throw error;
      }
    }
  }

  // All candidates failed
  const target = activeBackendUrl || candidates[0] || 'unknown';
  console.warn(`[API] ${endpoint} error: all candidate backends unreachable.`);
  const connectErr = new Error(
    `Cannot connect to StudyMate AI server.\n\nPlease verify your backend is running at ${target} or tap the server status badge below to connect.`
  );
  connectErr.isNetworkError = true;
  throw connectErr;
}

/**
 * Universal file upload handler supporting Web, Android, iOS, and Expo runtime.
 * Automatically tries candidate servers with failover.
 * Bypasses Expo fetch FormData serializer using XMLHttpRequest on Native to prevent
 * "Unsupported FormDataPart implementation" errors.
 */
async function uploadFile(endpoint, file, fieldName = 'file') {
  const token = await storage.getToken();
  const candidates = getServerCandidates();
  let lastError = null;

  const fileName = file.name || file.fileName || (fieldName === 'avatar' ? 'profile_avatar.jpg' : 'document.pdf');
  const mimeType = file.type || file.mimeType || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  for (let i = 0; i < candidates.length; i++) {
    const candidateBase = candidates[i];
    const uploadUrl = `${candidateBase}${endpoint}`;

    try {
      const data = await new Promise(async (resolve, reject) => {
        try {
          if (Platform.OS === 'web') {
            const formData = new FormData();
            if (file.file) {
              formData.append(fieldName, file.file, fileName);
            } else if (file.uri) {
              const res = await fetch(file.uri);
              const blob = await res.blob();
              formData.append(fieldName, blob, fileName);
            } else {
              throw new Error('No valid file or URI provided for web upload.');
            }

            const isConfirmed = activeBackendUrl === candidateBase;
            const controller = new AbortController();
            const timeoutDuration = isConfirmed ? 60000 : 7000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'bypass-tunnel-reminder': 'true',
                'Bypass-Tunnel-Reminder': 'true',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: formData,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const resJson = await response.json().catch(() => ({}));
            if (!response.ok) {
              let errorMsg = 'Upload failed';
              if (Array.isArray(resJson.detail)) {
                errorMsg = resJson.detail.map((e) => e.msg || e).join(', ');
              } else if (resJson.detail) {
                errorMsg = typeof resJson.detail === 'string' ? resJson.detail : JSON.stringify(resJson.detail);
              }
              const err = new Error(errorMsg);
              err.status = response.status;
              reject(err);
              return;
            }
            resolve(resJson);
          } else {
            // On Native (Android / iOS):
            // Use XMLHttpRequest directly. React Native's native RCTNetworking
            // seamlessly reads { uri, name, type } via Android/iOS native file streams,
            // bypassing Expo WinterCG fetch's "Unsupported FormDataPart implementation" error.
            const formData = new FormData();
            formData.append(fieldName, {
              uri: file.uri,
              name: fileName,
              type: mimeType,
            });

            const xhr = new XMLHttpRequest();
            xhr.open('POST', uploadUrl);
            const isConfirmed = activeBackendUrl === candidateBase;
            xhr.timeout = isConfirmed ? 60000 : 7000;

            xhr.setRequestHeader('bypass-tunnel-reminder', 'true');
            xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
            xhr.setRequestHeader('Accept', 'application/json');
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.onload = () => {
              let resJson = {};
              try {
                resJson = JSON.parse(xhr.responseText);
              } catch (_) {
                resJson = { detail: xhr.responseText };
              }

              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(resJson);
              } else {
                let errorMsg = 'Upload failed';
                if (Array.isArray(resJson.detail)) {
                  errorMsg = resJson.detail.map((e) => e.msg || e).join(', ');
                } else if (resJson.detail) {
                  errorMsg = typeof resJson.detail === 'string' ? resJson.detail : JSON.stringify(resJson.detail);
                } else if (xhr.status === 413) {
                  errorMsg = 'File exceeds maximum upload size (20MB).';
                } else {
                  errorMsg = `Server error (${xhr.status})`;
                }
                const err = new Error(errorMsg);
                err.status = xhr.status;
                reject(err);
              }
            };

            xhr.onerror = () => {
              const err = new Error(`Network request failed during upload to ${candidateBase}`);
              err.isNetworkError = true;
              reject(err);
            };

            xhr.ontimeout = () => {
              const err = new Error(`Upload timed out connecting to ${candidateBase}`);
              err.isNetworkError = true;
              reject(err);
            };

            xhr.send(formData);
          }
        } catch (inner) {
          reject(inner);
        }
      });

      // Mark this candidate as working if it succeeded
      if (activeBackendUrl !== candidateBase) {
        activeBackendUrl = candidateBase;
        AsyncStorage.setItem(SERVER_URL_KEY, candidateBase).catch(() => {});
        console.log(`[API] Upload succeeded to ${candidateBase}`);
      }

      return data;
    } catch (err) {
      lastError = err;
      const isNetworkUnreachable =
        err.isNetworkError ||
        err.name === 'AbortError' ||
        err.message?.includes('Network request failed') ||
        err.message?.includes('timed out') ||
        err.message?.includes('NoRouteToHostException') ||
        err.message?.includes('Host unreachable') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('fetch failed');

      if (isNetworkUnreachable) {
        console.warn(`[API] Upload candidate ${candidateBase} unreachable (${err.message}). Trying next candidate...`);
        continue;
      } else {
        // App-level error (e.g., 400 Bad Request, 413 File Too Large) - do not retry next server
        throw err;
      }
    }
  }

  const target = activeBackendUrl || candidates[0] || 'unknown';
  console.warn(`[API] ${endpoint} upload error: all candidate backends unreachable.`);
  throw lastError || new Error(`Cannot connect to backend server for upload. Please verify backend is running at ${target}.`);
}

export const api = {
  // Authentication
  auth: {
    async login(email, password) {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 400));
        await storage.saveToken('mock_jwt_token_khadim');
        return { user: MOCK_USER, token: 'mock_jwt_token_khadim' };
      }

      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (data.access_token) {
        await storage.saveToken(data.access_token);
      }
      const user = await api.auth.getProfile();
      return { user, token: data.access_token };
    },

    async register(name, email, password) {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 600));
        const user = { ...MOCK_USER, name, email };
        await storage.saveToken('mock_jwt_token_new_user');
        return { user, token: 'mock_jwt_token_new_user' };
      }

      await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: name.trim(), email: email.trim(), password }),
      });
      return api.auth.login(email, password);
    },

    async googleLogin(googleData) {
      const payload = typeof googleData === 'string'
        ? { id_token: googleData }
        : googleData;

      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 400));
        await storage.saveToken('mock_jwt_token_google');
        return { user: MOCK_USER, token: 'mock_jwt_token_google' };
      }

      const res = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.access_token) {
        await storage.saveToken(res.access_token);
        const profile = await api.auth.getProfile();
        return { user: profile, token: res.access_token };
      }
      throw new Error('Google Sign-In failed to generate session token.');
    },

    async forgotPassword(email) {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          message: 'If that email is registered, you will receive password reset instructions shortly.',
          success: true,
        };
      }

      return await request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    },

    async verifyResetToken(email, token) {
      if (USE_MOCK_DATA) {
        return { message: 'Reset token is valid.', success: true };
      }

      const encodedEmail = encodeURIComponent(email.trim().toLowerCase());
      const encodedToken = encodeURIComponent(token.trim());
      return await request(`/auth/verify-reset-token?email=${encodedEmail}&token=${encodedToken}`, {
        method: 'GET',
      });
    },

    async resetPassword(email, token, newPassword) {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          message: 'Password has been reset successfully. You can now log in with your new password.',
          success: true,
        };
      }

      return await request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          new_password: newPassword,
        }),
      });
    },

    async logout() {
      if (!USE_MOCK_DATA) {
        try {
          await request('/auth/logout', { method: 'POST' });
        } catch (_) { }
      }
      await storage.removeToken();
      return true;
    },

    async getProfile() {
      if (USE_MOCK_DATA) {
        return MOCK_USER;
      }
      const user = await request('/users/me');
      return {
        ...user,
        name: user.full_name || user.name || 'Student',
        role: 'Student Account',
      };
    },
  },

  // Users
  users: {
    async getProfile() {
      if (USE_MOCK_DATA) {
        return MOCK_USER;
      }
      return await request('/users/me');
    },

    async updateProfile(updates) {
      if (USE_MOCK_DATA) {
        return { ...MOCK_USER, ...updates };
      }
      const payload = {};
      if (updates.name !== undefined || updates.full_name !== undefined) {
        payload.full_name = updates.name || updates.full_name;
      }
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;

      const res = await request('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return {
        ...res,
        name: res.full_name || updates.name,
      };
    },

    async uploadAvatar(file) {
      return await uploadFile('/users/avatar', file, 'file');
    },

    async changePassword(currentPassword, newPassword) {
      return await request('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    },

    async getPreferences() {
      try {
        return await request('/users/preferences');
      } catch (err) {
        return {
          notifications_enabled: true,
          study_reminders: true,
          task_deadline_reminders: true,
          quiz_reminders: true,
          daily_study_goals: true,
          doc_processing_notifications: true,
          theme: 'system',
          language: 'en',
        };
      }
    },

    async updatePreferences(prefs) {
      return await request('/users/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
    },
  },

  // Documents
  documents: {
    async getAll() {
      if (USE_MOCK_DATA) {
        return MOCK_DOCUMENTS;
      }
      try {
        const docs = await request('/documents');
        return docs.map((d) => ({
          id: d.id,
          title: d.filename,
          subject: 'General Study',
          pages: d.page_count || 1,
          size: `${(d.file_size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date(d.created_at).toLocaleDateString(),
          status:
            d.processing_status === 'completed'
              ? 'Completed'
              : d.processing_status === 'processing'
                ? 'Processing'
                : 'Failed',
          summary: 'Extracted semantic notes available for AI study.',
          keyConcepts: ['Core Formulations', 'Practical Exercises'],
          revisionNotes: ['Review definitions on page 1.'],
          chunks: [],
        }));
      } catch (err) {
        console.warn('Backend offline, loading cached study materials.');
        return MOCK_DOCUMENTS;
      }
    },

    async getById(id) {
      if (USE_MOCK_DATA) {
        const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
        return doc || MOCK_DOCUMENTS[0];
      }
      try {
        const d = await request(`/documents/${id}`);
        return {
          id: d.id,
          title: d.filename,
          subject: 'General Study',
          pages: d.page_count || 1,
          size: `${(d.file_size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date(d.created_at).toLocaleDateString(),
          status:
            d.processing_status === 'completed'
              ? 'Completed'
              : d.processing_status === 'processing'
                ? 'Processing'
                : 'Failed',
          extractedChunksCount: d.extracted_chunks_count || 0,
          summary: 'Extracted semantic notes available for AI study.',
          keyConcepts: ['Core Formulations', 'Practical Exercises'],
          revisionNotes: ['Review definitions on page 1.'],
          chunks: [],
        };
      } catch (err) {
        const doc = MOCK_DOCUMENTS.find((d) => d.id === id);
        return doc || MOCK_DOCUMENTS[0];
      }
    },

    async delete(id) {
      if (USE_MOCK_DATA) {
        return { success: true };
      }
      return await request(`/documents/${id}`, { method: 'DELETE' });
    },

    async getChunks(id) {
      if (USE_MOCK_DATA) return [];
      try {
        const chunks = await request(`/documents/${id}/chunks`);
        return (chunks || []).map((c) => ({
          id: c.id,
          page: c.page_number || 1,
          heading: `Section ${c.chunk_index + 1}`,
          text: c.content,
        }));
      } catch (err) {
        return [];
      }
    },

    async upload(file) {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 800));
        return {
          id: `doc_${Date.now()}`,
          title: file.name || 'Uploaded_Document.pdf',
          subject: 'General Study',
          pages: 12,
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB',
          uploadedAt: 'Just now',
          status: 'Completed',
          extractedChunksCount: 42,
          summary: 'Successfully extracted concepts and generated semantic vector embeddings.',
          keyConcepts: ['Key Terminology', 'Core Principles'],
          revisionNotes: ['Review Section 1 before tests.'],
          chunks: [],
        };
      }

      try {
        const d = await uploadFile('/documents/upload', file, 'file');
        return {
          id: d.id,
          title: d.filename,
          subject: 'General Study',
          pages: d.page_count || 1,
          size: `${(d.file_size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: 'Just now',
          status: d.processing_status === 'completed' ? 'Completed' : 'Processing',
          extractedChunksCount: d.extracted_chunks_count || 0,
          summary: 'Successfully processed and indexed document with AI.',
          keyConcepts: ['Key Concepts Extracted'],
          revisionNotes: ['Review key definitions before tests.'],
          chunks: [],
        };
      } catch (uploadErr) {
        console.warn('[API] Upload error:', uploadErr.message);
        throw uploadErr;
      }
    },
  },

  // AI Services
  ai: {
    async chat(message, documentId = null, conversationId = null) {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: `Here is a study breakdown for your inquiry on: "${message}"`,
          timestamp: 'Just now',
          sources: [],
        };
      }

      // 1. Get or create active conversation
      let targetConvId = conversationId;
      if (!targetConvId) {
        const newConv = await request('/chat/conversations', {
          method: 'POST',
          body: JSON.stringify({ title: message.slice(0, 36) }),
        });
        targetConvId = newConv.id;
      }

      // 2. Send message
      const res = await request(`/chat/conversations/${targetConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: message,
          document_ids: documentId ? [documentId] : null,
        }),
      });

      return {
        id: res.id,
        conversationId: targetConvId,
        sender: 'ai',
        text: res.content,
        timestamp: new Date(res.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sources: (res.citations || []).map((c) => ({
          documentId: c.document_id,
          docTitle: c.document_title,
          page: c.page_number,
          chunkId: c.chunk_index,
          snippet: c.text_snippet || '',
        })),
      };
    },

    async generateSummary(docId, depth = 'Medium') {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 600));
        const doc = MOCK_DOCUMENTS.find((d) => d.id === docId) || MOCK_DOCUMENTS[0];
        return {
          summary: `[${depth.toUpperCase()} SUMMARY]\n\n${doc.summary}`,
          keyConcepts: doc.keyConcepts,
          revisionNotes: doc.revisionNotes,
        };
      }

      const data = await request(`/documents/${docId}/summaries`, {
        method: 'POST',
        body: JSON.stringify({ summary_type: depth.toLowerCase() }),
      });
      return {
        id: data.id,
        summary: data.content,
        keyConcepts: data.key_concepts || [],
        revisionNotes: data.revision_notes || [],
      };
    },

    async getSummaries(docId) {
      if (USE_MOCK_DATA) return [];
      const summaries = await request(`/documents/${docId}/summaries`);
      return (summaries || []).map((s) => ({
        id: s.id,
        summary: s.content,
        keyConcepts: s.key_concepts || [],
        revisionNotes: s.revision_notes || [],
      }));
    },

    async getQuiz(docId = null, topic = null, numQuestions = 5, difficulty = 'medium') {
      if (USE_MOCK_DATA) {
        return MOCK_QUIZ;
      }
      const data = await request('/quizzes/generate', {
        method: 'POST',
        body: JSON.stringify({
          document_id: docId || undefined,
          topic: topic || undefined,
          num_questions: numQuestions,
          difficulty: difficulty.toLowerCase(),
        }),
      });
      return {
        id: data.id,
        title: data.title,
        difficulty: data.difficulty,
        questions: (data.questions || []).map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          explanation: q.explanation || '',
        })),
      };
    },

    async submitQuiz(quizId, answers) {
      return await request(`/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },

    async getFlashcards(docId = null, topic = null, numCards = 5) {
      if (USE_MOCK_DATA) {
        return MOCK_FLASHCARDS;
      }
      const cards = await request('/flashcards/generate', {
        method: 'POST',
        body: JSON.stringify({
          document_id: docId || undefined,
          topic: topic || undefined,
          num_cards: numCards,
        }),
      });
      return (cards || []).map((c) => ({
        id: c.id,
        deck: topic || 'Course Concepts',
        question: c.question,
        answer: c.answer,
        isKnown: c.review_status === 'known' || c.review_status === 'mastered',
      }));
    },

    async listFlashcards(docId = null) {
      if (USE_MOCK_DATA) return MOCK_FLASHCARDS;
      const endpoint = docId ? `/flashcards?document_id=${docId}` : '/flashcards';
      const cards = await request(endpoint);
      return (cards || []).map((c) => ({
        id: c.id,
        deck: 'Course Concepts',
        question: c.question,
        answer: c.answer,
        isKnown: c.review_status === 'known' || c.review_status === 'mastered',
      }));
    },

    async reviewFlashcard(flashcardId, isKnown) {
      if (USE_MOCK_DATA) return true;
      return await request(`/flashcards/${flashcardId}/review`, {
        method: 'POST',
        body: JSON.stringify({ is_known: isKnown }),
      });
    },
  },

  // Quizzes Resource
  quizzes: {
    async getAll() {
      if (USE_MOCK_DATA) return [];
      try {
        return await request('/quizzes');
      } catch (err) {
        return [];
      }
    },
    async getById(id) {
      return await request(`/quizzes/${id}`);
    },
    async generate(docId = null, topic = null, numQuestions = 5, difficulty = 'medium') {
      return await api.ai.getQuiz(docId, topic, numQuestions, difficulty);
    },
    async submit(quizId, answers) {
      return await api.ai.submitQuiz(quizId, answers);
    },
    async getAttempts(quizId) {
      return await request(`/quizzes/${quizId}/attempts`);
    },
  },

  // Tasks & Planner
  tasks: {
    async getAll() {
      if (USE_MOCK_DATA) {
        return MOCK_TASKS;
      }
      try {
        const tasks = await request('/tasks');
        return tasks.map((t) => ({
          id: t.id,
          title: t.title,
          subject: t.subject,
          description: t.description || '',
          dueTime: t.due_date
            ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Today, 5:00 PM',
          dueDate: t.due_date
            ? new Date(t.due_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          priority: t.priority,
          completed: t.completed,
        }));
      } catch (err) {
        return MOCK_TASKS;
      }
    },

    async create(taskData) {
      const payload = {
        title: taskData.title,
        subject: taskData.subject || 'General Study',
        description: taskData.description || null,
        priority: taskData.priority || 'Medium',
        due_date: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
      };
      try {
        const t = await request('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return {
          id: t.id,
          title: t.title,
          subject: t.subject,
          dueTime: t.due_date
            ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Today, 5:00 PM',
          dueDate: t.due_date
            ? new Date(t.due_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          priority: t.priority,
          completed: t.completed,
        };
      } catch (err) {
        return {
          id: `task_${Date.now()}`,
          title: taskData.title,
          subject: taskData.subject || 'General Study',
          dueTime: taskData.dueTime || 'Today, 5:00 PM',
          dueDate: 'Today',
          priority: taskData.priority || 'Medium',
          completed: false,
        };
      }
    },

    async update(id, updates) {
      const payload = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.subject !== undefined) payload.subject = updates.subject;
      if (updates.completed !== undefined) payload.completed = updates.completed;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.dueDate !== undefined)
        payload.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;

      try {
        const t = await request(`/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        return {
          id: t.id,
          title: t.title,
          subject: t.subject,
          dueTime: t.due_date
            ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Today, 5:00 PM',
          dueDate: t.due_date
            ? new Date(t.due_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          priority: t.priority,
          completed: t.completed,
        };
      } catch (err) {
        return {
          id,
          ...updates,
        };
      }
    },

    async delete(id) {
      try {
        return await request(`/tasks/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        return { success: true };
      }
    },
  },

  // Analytics
  analytics: {
    async getOverview() {
      if (USE_MOCK_DATA) {
        return MOCK_ANALYTICS;
      }
      try {
        return await request('/analytics/overview');
      } catch (err) {
        return MOCK_ANALYTICS;
      }
    },

    async getDashboard() {
      if (USE_MOCK_DATA) {
        return null;
      }
      try {
        return await request('/dashboard');
      } catch (err) {
        return null;
      }
    },
  },

  // Chat History
  chatHistory: {
    async getAll() {
      if (USE_MOCK_DATA) {
        return MOCK_CHAT_HISTORIES;
      }
      try {
        const convs = await request('/chat/conversations');
        return convs.map((c) => ({
          id: c.id,
          title: c.title,
          lastMessage: c.last_message || 'Conversation started',
          date: new Date(c.updated_at).toLocaleDateString(),
          docSubject: 'Study Notes',
        }));
      } catch (err) {
        return MOCK_CHAT_HISTORIES;
      }
    },

    async getById(id) {
      if (USE_MOCK_DATA) {
        return { messages: MOCK_CHAT_MESSAGES };
      }
      try {
        const conv = await request(`/chat/conversations/${id}`);
        return {
          id: conv.id,
          title: conv.title,
          messages: (conv.messages || []).map((m) => ({
            id: m.id,
            sender: m.role === 'assistant' ? 'ai' : 'user',
            text: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            sources: (m.citations || []).map((c) => ({
              documentId: c.document_id,
              docTitle: c.document_title,
              page: c.page_number,
              chunkId: c.chunk_index,
            })),
          })),
        };
      } catch (err) {
        return { messages: MOCK_CHAT_MESSAGES };
      }
    },

    async delete(id) {
      if (USE_MOCK_DATA) return true;
      try {
        return await request(`/chat/conversations/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        return true;
      }
    },
  },

  // Support
  support: {
    async createTicket(ticketData) {
      return await request('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });
    },

    async getTickets() {
      try {
        return await request('/support/tickets');
      } catch (err) {
        return [];
      }
    },
  },
};
