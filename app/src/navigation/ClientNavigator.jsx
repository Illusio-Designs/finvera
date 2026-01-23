import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/client/DashboardScreen.jsx';
import VouchersScreen from '../screens/client/VouchersScreen.jsx';

const Stack = createNativeStackNavigator();

export default function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Vouchers" component={VouchersScreen} />
    </Stack.Navigator>
  );
}