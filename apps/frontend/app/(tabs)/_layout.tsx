import { Tabs, Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth,useUser } from '@clerk/clerk-expo';
import useStore from '@/store/useStore';
import { login, configureAPI , getSettings, getEmployees} from '../../lib/api'
import { useEffect, useState } from 'react';
import { Employee } from '../../types';

export default function TabLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const authenticatedEmployee = useStore(state => state.authenticatedEmployee);

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

  // Fetch employee data to determine role
  useEffect(() => {
    const fetchEmployee = async () => {
      if (email) {
        try {
          const employees = await getEmployees();
          console.log('All employees:', employees);
          console.log('Looking for email:', email);
          const employee = employees.find(emp => emp.email === email);
          console.log('Found employee:', employee);
          console.log('Employee role:', employee?.role?.name);
          console.log('Employee roleId:', employee?.roleId);
          setCurrentEmployee(employee || null);
        } catch (error) {
          console.error('Failed to fetch employee:', error);
        }
      }
    };
    fetchEmployee();
  }, [email]);

  // Define menu access based on role
  const getAllowedTabs = (roleName?: string) => {
    const roleMenus = {
      staff: ['dashboard', 'index', 'products', 'alerts'],
      cashier: ['dashboard', 'index', 'orders', 'customers'],
      manager: ['dashboard', 'index', 'products', 'alerts', 'orders', 'analytics', 'customers', 'employees'],
      admin: ['dashboard', 'index', 'products', 'alerts', 'orders', 'analytics', 'customers', 'employees', 'settings']
    };

    return roleMenus[roleName as keyof typeof roleMenus] || ['dashboard', 'index'];
  };

  // Use authenticated employee if available, otherwise fall back to current employee from email
  const effectiveEmployee = authenticatedEmployee || currentEmployee;
  const allowedTabs = getAllowedTabs(effectiveEmployee?.role?.name);
  console.log('Current employee:', currentEmployee);
  console.log('Authenticated employee:', authenticatedEmployee);
  console.log('Effective employee:', effectiveEmployee);
  console.log('Allowed tabs:', allowedTabs);


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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          href: allowedTabs.includes('dashboard') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Point of Sale',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          href: allowedTabs.includes('index') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
          href: allowedTabs.includes('products') ? undefined : null,
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
          href: allowedTabs.includes('alerts') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
          href: allowedTabs.includes('orders') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
          href: allowedTabs.includes('analytics') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          href: allowedTabs.includes('customers') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Employees',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          href: allowedTabs.includes('employees') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          href: allowedTabs.includes('settings') ? undefined : null,
        }}
      />
    </Tabs>
  );
}