import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ErrorBoundary from './components/ErrorBoundary';

// Screens
import POSScreen from './screens/POSScreen';
import ProductsScreen from './screens/ProductsScreen';
import OrdersScreen from './screens/OrdersScreen';
import SettingsScreen from './screens/SettingsScreen';

// Store
import {useStore} from './store/useStore';

const Tab = createBottomTabNavigator();

const App = () => {
  const initializeStore = useStore(state => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
            backgroundColor="#ffffff"
          />
          <Tab.Navigator
            screenOptions={({route}) => ({
              tabBarIcon: ({focused, color, size}) => {
                let iconName: string;

                switch (route.name) {
                  case 'POS':
                    iconName = 'storefront';
                    break;
                  case 'Products':
                    iconName = 'grid';
                    break;
                  case 'Orders':
                    iconName = 'receipt';
                    break;
                  case 'Settings':
                    iconName = 'settings';
                    break;
                  default:
                    iconName = 'home';
                }

                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: '#8E8E93',
              tabBarStyle: {
                backgroundColor: '#ffffff',
                borderTopWidth: 1,
                borderTopColor: '#e5e5e5',
                paddingBottom: Platform.OS === 'ios' ? 20 : 5,
                height: Platform.OS === 'ios' ? 85 : 60,
              },
              headerStyle: {
                backgroundColor: '#ffffff',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e5e5',
              },
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
                color: '#000000',
              },
            })}>
            <Tab.Screen
              name="POS"
              component={POSScreen}
              options={{title: 'Point of Sale'}}
            />
            <Tab.Screen
              name="Products"
              component={ProductsScreen}
              options={{title: 'Products'}}
            />
            <Tab.Screen
              name="Orders"
              component={OrdersScreen}
              options={{title: 'Orders'}}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{title: 'Settings'}}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;