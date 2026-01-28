import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext.jsx';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen.jsx';
import LoadingScreen from '../screens/LoadingScreen.jsx';
import ClientNavigator from './ClientNavigator.jsx';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Show main app screens - ClientNavigator contains all client screens including dashboard
          <Stack.Screen name="Client" component={ClientNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}