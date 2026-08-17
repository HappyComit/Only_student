import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';
import { AppModeProvider } from '@/constants/appMode';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Prevent native Expo launcher screen from flashing before React mounts
SplashScreen.preventAutoHideAsync().catch(() => {});

export { ErrorBoundary };

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppModeProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              headerStyle: { backgroundColor: Colors.white },
              headerTintColor: Colors.text,
              headerTitleStyle: { color: Colors.text, fontWeight: '700', fontSize: 18 },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="marketplace/[id]"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="communities/[id]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerTransparent: true,
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="events/[id]"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="chats/[id]"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: true,
                headerTitle: 'Notifications',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="earnings"
              options={{
                headerShown: true,
                headerTitle: 'My Earnings',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="post-service"
              options={{
                headerShown: true,
                headerTitle: 'Post a Service',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="create-event"
              options={{
                headerShown: true,
                headerTitle: 'Create Event',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="admin"
              options={{
                headerShown: true,
                headerTitle: 'Admin Panel',
                headerBackTitle: '',
              }}
            />
          </Stack>
        </GestureHandlerRootView>
      </AppModeProvider>
    </ErrorBoundary>
  );
}
