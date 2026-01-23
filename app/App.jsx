import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext.jsx';
import AppNavigator from './src/navigation/AppNavigator.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}