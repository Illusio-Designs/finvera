import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { AuthProvider } from './src/contexts/AuthContext.jsx';
import { NotificationProvider } from './src/contexts/NotificationContext.jsx';
import LoginScreen from './src/screens/auth/LoginScreen.jsx';
import RegisterScreen from './src/screens/client/auth/RegisterScreen.jsx';
import ForgotPasswordScreen from './src/screens/client/auth/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from './src/screens/client/auth/ResetPasswordScreen.jsx';
import CreateCompanyScreen from './src/screens/client/company/CreateCompanyScreen.jsx';
import CompanyProvisioningScreen from './src/screens/client/company/CompanyProvisioningScreen.jsx';
import DashboardScreen from './src/screens/client/DashboardScreen.jsx';
import SplashScreen from './src/screens/auth/SplashScreen.jsx';
import LoadingScreen from './src/screens/LoadingScreen.jsx';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'Agency': require('./assets/fonts/agency.otf'),
      });
      console.log('Fonts loaded successfully');
      setFontsLoaded(true);
    } catch (error) {
      console.warn('Error loading fonts:', error);
      setFontsLoaded(true); // Continue without custom fonts
    }
  };

  useEffect(() => {
    if (fontsLoaded) {
      // Show splash screen for 3 seconds after fonts are loaded
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || showSplash) {
    return showSplash ? <SplashScreen /> : <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
        <Stack.Screen name="CompanyProvisioning" component={CompanyProvisioningScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
}