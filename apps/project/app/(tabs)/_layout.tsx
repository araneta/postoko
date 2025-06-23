import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import useStore from '@/store/useStore';
import { useEffect } from 'react';

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const initializeStore = useStore(state => state.initializeStore);
  const settings = useStore(state => state.settings);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      initializeStore();
    }
  }, [isLoaded, isSignedIn]);

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return null;
  }

  // Redirect to home if not signed in
  if (!isSignedIn) {
    return <Redirect href="/(home)" />;
  }

  // Redirect to settings if storeInfo is missing or empty
  if (!settings?.storeInfo || !settings.storeInfo.name) {
    return <Redirect href="/settings" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Point of Sale',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}