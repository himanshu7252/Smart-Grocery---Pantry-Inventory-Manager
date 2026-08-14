import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '../hooks/redux';
import { THEME } from '../constants';
import SvgIcon from '../components/SvgIcon';

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
import ScannerScreen from '../screens/ScannerScreen';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: THEME.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 2,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '800',
          color: THEME.text
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
        options={{ title: 'Pantry Stock', headerTitle: 'Grocery Inventory' }}
      />
      <Tab.Screen
        name="ShoppingListTab"
        component={ShoppingListScreen}
        options={{ title: 'Shopping List', headerTitle: 'Smart Buy List' }}
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
  const { isAuthenticated, isRestoring } = useAppSelector((state) => state.auth);

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
          <Stack.Screen name="Scanner" component={ScannerScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
