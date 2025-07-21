import { Tabs, Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth,useUser } from '@clerk/clerk-expo';
import useStore from '@/store/useStore';
import { login, configureAPI , getSettings} from '../../lib/api'
import { useEffect } from 'react';

export default function TabLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  const settings = useStore(state => state.settings);
  const unreadAlertCount = useStore(state => state.getUnreadAlertCount());

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return null;
  }

  // Redirect to home if not signed in
  if (!isSignedIn) {
    return <Redirect href="/(home)" />;
  }
  let email = '';
  if (isLoaded && user) {
    let primaryEmail = user.primaryEmailAddress;
    const allEmails = user.emailAddresses;

    if (primaryEmail) {
      email = primaryEmail.emailAddress;
      console.log("Primary Email:", email);
    }

    if (allEmails && allEmails.length > 0) {
      console.log("All Email Addresses:");
      allEmails.forEach(email => {
        console.log(email.emailAddress);
      });
    }
  }

  // Use useEffect to handle async operations
  useEffect(() => {
    const handleLogin = async () => {
      // Redirect to settings if storeInfo is missing or empty
      if (!settings?.storeInfo || !settings.storeInfo.name) {
        if(email){
          try {
            
            // Configure the API client with the returned credentials
            //if (token) {              
              configureAPI(getToken);
              const { id } = await login(email)
              console.log('id', id)  
              const storeInfo = await getSettings();
              console.log('settings', storeInfo);
              if(!storeInfo){
                router.replace('/(tabs)/settings')
                return;
              }
              
            //}else{
            //  console.log('Failed to get token or user ID')
            //}
            
            
          } catch (apiError) {
            console.error('Backend login failed:', apiError)
            // Continue with the flow even if backend login fails
            // The user is still authenticated with Clerk
          }
        }
        //return <Redirect href="/settings" />;
      }
    };

    handleLogin();
  }, [email, settings, getToken]);

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
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          tabBarBadge: unreadAlertCount > 0 ? unreadAlertCount : undefined,
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
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Employees',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
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