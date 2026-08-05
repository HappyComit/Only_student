import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV_URL = typeof window !== 'undefined' && window.location?.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'http://10.208.44.27:5000/api';
// Hosted production cloud server domain on Render
const PROD_URL = 'https://only-student.onrender.com/api'; 

export const API_BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

/**
 * Saves the authentication JWT token locally on the device.
 */
export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.removeItem('isGuestMode');
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Retrieves the local authentication JWT token.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
};

/**
 * Sets guest mode status.
 */
export const setGuestMode = async (enabled: boolean = true) => {
  try {
    if (enabled) {
      await AsyncStorage.setItem('isGuestMode', 'true');
      await AsyncStorage.removeItem('authToken');
    } else {
      await AsyncStorage.removeItem('isGuestMode');
    }
  } catch (error) {
    console.error('Error setting guest mode:', error);
  }
};

/**
 * Checks if the user is currently browsing in Guest Mode.
 */
export const isGuestUser = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) return false;
    const guestFlag = await AsyncStorage.getItem('isGuestMode');
    return guestFlag === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Removes the local authentication JWT token (Logs user out).
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('isGuestMode');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Helper delay function for exponential backoff
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Centralized fetch helper that handles request headers, authorization tokens,
 * automatic retry logic (with exponential backoff for network/5xx glitches),
 * timeout guards, and response parsing.
 */
export async function apiFetch<T = any>(
  path: string, 
  options: RequestInit = {}, 
  retries: number = 2
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 15-second timeout guard to prevent requests hanging indefinitely on slow mobile networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse JSON or text response
      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { text: await response.text() };
      }

      if (!response.ok) {
        const isServerError = response.status >= 500 && response.status < 600;
        // Retry on 5xx server glitches if retries remain
        if (isServerError && attempt < retries) {
          console.warn(`⚠️ [API] Server ${response.status} error on ${path}. Retrying (${attempt + 1}/${retries})...`);
          await delay(1000 * Math.pow(2, attempt)); // 1s, 2s backoff
          continue;
        }
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      return data as T;
    } catch (error: any) {
      lastError = error;

      // Handle aborted/timed-out requests or network drops
      const isNetworkError = error.name === 'AbortError' || error.message?.includes('Network') || error.message?.includes('Failed to fetch');

      if (isNetworkError && attempt < retries) {
        console.warn(`⚠️ [API] Network error on ${path} (${error.message}). Retrying (${attempt + 1}/${retries})...`);
        await delay(1000 * Math.pow(2, attempt)); // 1s, 2s backoff
        continue;
      }

      // If no retries left or non-retryable error (e.g. 400 Bad Request)
      if (isNetworkError) {
        throw new Error('Network connection unavailable. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  throw lastError || new Error('Network request failed.');
}

/**
 * Uploads an image file to Supabase Cloud Storage via the Backend API.
 * Accepts a local image file URI (e.g. from expo-image-picker).
 * Returns the public HTTPS URL of the uploaded image on Supabase.
 */
export async function uploadImage(
  localUri: string, 
  bucket: 'avatars' | 'gig-images' | 'events' = 'avatars'
): Promise<string> {
  const token = await getToken();

  // Infer file name and mime type from URI
  const filename = localUri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();

  // Cross-platform handling: Convert blob URI to File object when running on Web
  if (typeof window !== 'undefined' && localUri.startsWith('blob:')) {
    try {
      const blobResp = await fetch(localUri);
      const blob = await blobResp.blob();
      const file = new File([blob], filename, { type: type || blob.type || 'image/jpeg' });
      formData.append('file', file);
    } catch (blobErr) {
      console.warn('Blob conversion fallback:', blobErr);
      formData.append('file', { uri: localUri, name: filename, type: type } as any);
    }
  } else {
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: type,
    } as any);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/upload?bucket=${bucket}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    let data: any = {};
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.error || data.details || `Upload failed with status ${response.status}`);
    }

    if (!data.url) {
      throw new Error('Server did not return a valid public image URL');
    }

    return data.url;
  } catch (error: any) {
    console.error(`uploadImage error:`, error);
    throw error;
  }
}
