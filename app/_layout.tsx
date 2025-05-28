import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import { View, ActivityIndicator } from 'react-native'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Session } from '@supabase/supabase-js'

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  //const { session, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null)

  const syncWithCloud = useStore(state => state.syncWithCloud);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    window.frameworkReady?.();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, []);

  useEffect(() => {
    async function sync() {
      if (session) {
        try {
          setSyncing(true);
          await syncWithCloud();
        } catch (error) {
          console.error('Failed to sync with cloud:', error);
        } finally {
          setSyncing(false);
        }
      }
    }
    sync();
  }, [session]);

  if (/*authLoading ||*/ syncing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
		<Auth />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
