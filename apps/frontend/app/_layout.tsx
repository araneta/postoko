import { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator,Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { configureAPI } from "../lib/api";

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import useStore from '../store/useStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notificationService from '../lib/notifications';
import ErrorBoundary from '../components/ErrorBoundary';
import debugLogger from '../utils/debugLogger';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://512d7a27643ac90973c0cfdfad4e064d@o4509443348365312.ingest.de.sentry.io/4509443351838800',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

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

  // Log app initialization
  useEffect(() => {
    debugLogger.info('AppContent component mounted');
    debugLogger.info('Device info:', {
      platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown',
      isDev: __DEV__,
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        debugLogger.info('Initializing push notifications');
        await notificationService.registerForPushNotificationsAsync();
        debugLogger.info('Push notifications initialized successfully');
      } catch (error) {
        debugLogger.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    // Only initialize store if user is signed in
    debugLogger.info('Auth state changed:', { isLoaded, isSignedIn, hasUser: !!user });
    if (isLoaded && isSignedIn && user) {
      const initializeWithToken = async () => {
        debugLogger.info('Initializing store for signed-in user:', user.id);
        
        initializeStore().finally(() => {
          setInitializing(false);
          debugLogger.info('Store initialization completed');
          // Call framework ready if available (web only)
          if (typeof window !== 'undefined' && window.frameworkReady) {
            window.frameworkReady();
          }
        });
      };
      
      initializeWithToken();
    } else if (isLoaded && !isSignedIn) {
      // User is not signed in, clear store and set initializing to false
      debugLogger.info('User not signed in, clearing store');
      clearStore();
      setInitializing(false);
      // Call framework ready if available (web only)
      if (typeof window !== 'undefined' && window.frameworkReady) {
        window.frameworkReady();
      }
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (getToken) {
      debugLogger.info('Configuring API with authentication token');
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
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </ErrorBoundary>
  );
}
/*
export default Sentry.wrap(function RootLayout() {
  return (
    <ClerkProvider
      publishableKey="pk_test_b24tZ2xvd3dvcm0tOTcuY2xlcmsuYWNjb3VudHMuZGV2JA"
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContent />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ClerkProvider>
  );
});*/
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>CLERK REMOVED TEST</Text>
      </View>
    </GestureHandlerRootView>
  );
}