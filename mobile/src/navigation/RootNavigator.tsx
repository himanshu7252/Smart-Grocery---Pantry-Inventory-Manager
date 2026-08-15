import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import SvgIcon from '../components/SvgIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { setDarkMode, setOfflineCaching } from '../store/settingsSlice';

// Screen Imports
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AddGroceryScreen from '../screens/AddGroceryScreen';
import GroceryDetailsScreen from '../screens/GroceryDetailsScreen';
import EditGroceryScreen from '../screens/EditGroceryScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Types
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList
} from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Flow Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Bottom Tab Navigator
const MainTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'dashboard';
          if (route.name === 'DashboardTab') {
            iconName = 'dashboard';
          } else if (route.name === 'InventoryTab') {
            iconName = 'inventory';
          } else if (route.name === 'ShoppingListTab') {
            iconName = 'shopping-list';
          } else if (route.name === 'AnalyticsTab') {
            iconName = 'analytics';
          } else if (route.name === 'ProfileTab') {
            iconName = 'profile';
          }
          return <SvgIcon name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        },
        headerStyle: {
          backgroundColor: theme.card,
          elevation: 2,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '800',
          color: theme.text
        }
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerTitle: 'Pantry Dashboard' }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ title: 'Stock', headerTitle: 'Grocery Inventory' }}
      />
      <Tab.Screen
        name="ShoppingListTab"
        component={ShoppingListScreen}
        options={{ title: 'List', headerTitle: 'Smart Buy List' }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{ title: 'Analytics', headerTitle: 'Pantry Insights' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', headerTitle: 'My Account' }}
      />
    </Tab.Navigator>
  );
};

// Root Switch Navigator
export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isRestoring } = useAppSelector((state) => state.auth);

  React.useEffect(() => {
    const initSettings = async () => {
      try {
        const dm = await AsyncStorage.getItem('pref_dark_mode');
        const oc = await AsyncStorage.getItem('pref_offline_caching');
        if (dm !== null) {
          dispatch(setDarkMode(dm === 'true'));
        }
        if (oc !== null) {
          dispatch(setOfflineCaching(oc === 'true'));
        }
      } catch (err) {
        console.error('Failed to load storage preferences:', err);
      }
    };
    initSettings();
  }, [dispatch]);

  if (isRestoring) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          {/* Main Tab Screen */}
          <Stack.Screen name="Main" component={MainTabNavigator} />

          {/* Action Screens in Stack */}
          <Stack.Screen name="AddGrocery" component={AddGroceryScreen} />
          <Stack.Screen name="GroceryDetails" component={GroceryDetailsScreen} />
          <Stack.Screen name="EditGrocery" component={EditGroceryScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
