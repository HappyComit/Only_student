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
 * Centralized fetch helper that handles request headers, authorization tokens,
 * JSON serialization, and responses.
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
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

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);

    // Check if the response is JSON or empty
    const contentType = response.headers.get('content-type');
    let data: any = {};
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! Status: ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    throw error;
  }
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
