import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { configureAPI } from "../lib/api";

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import useStore from '../store/useStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import notificationService from '../lib/notifications';

Sentry.init({
  dsn: 'https://512d7a27643ac90973c0cfdfad4e064d@o4509443348365312.ingest.de.sentry.io/4509443351838800',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function AppContent() {
  useFrameworkReady();
  const initializeStore = useStore(state => state.initializeStore);
  const clearStore = useStore(state => state.clearStore);
  const [initializing, setInitializing] = useState(true);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        await notificationService.registerForPushNotificationsAsync();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    // Only initialize store if user is signed in
    console.log('isLoaded:', isLoaded, 'isSignedIn:', isSignedIn, 'user:', user);
    if (isLoaded && isSignedIn && user) {
      const initializeWithToken = async () => {
        //const token = await getToken();
        
        initializeStore().finally(() => {
          setInitializing(false);
          window.frameworkReady?.();
        });
      };
      
      //initializeWithToken();
    } else if (isLoaded && !isSignedIn) {
      // User is not signed in, clear store and set initializing to false
      clearStore();
      setInitializing(false);
      window.frameworkReady?.();
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (getToken) {
      configureAPI(getToken);
    }
  }, [getToken]);

  if (initializing || !isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(home)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContent />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ClerkProvider>
  );
});
