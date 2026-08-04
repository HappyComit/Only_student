import { Alert } from 'react-native';
import { router } from 'expo-router';
import { getToken } from '@/constants/api';

/**
 * Checks if the user is authenticated. If not (browsing as guest), 
 * pops up an alert prompting them to sign in or create an account.
 * Returns true if user is logged in, false if prompt was shown.
 */
export async function requireAuthOrPromptGuest(
  actionName: string,
  onAuthorized?: () => void
): Promise<boolean> {
  const token = await getToken();

  if (token) {
    if (onAuthorized) onAuthorized();
    return true;
  }

  Alert.alert(
    'Sign In Required 🔒',
    `To ${actionName}, please sign in or create your student account.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log In / Sign Up',
        onPress: () => {
          router.push('/(auth)/auth');
        },
      },
    ]
  );

  return false;
}
