import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/client/DashboardScreen.jsx';

// Auth screens
import ForgotPasswordScreen from '../screens/client/auth/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from '../screens/client/auth/ResetPasswordScreen.jsx';

// Profile screens
import ProfileScreen from '../screens/client/profile/ProfileScreen.jsx';
import SettingsScreen from '../screens/client/profile/SettingsScreen.jsx';

// Company screens
import CompaniesScreen from '../screens/client/company/CompaniesScreen.jsx';
import BranchesScreen from '../screens/client/company/BranchesScreen.jsx';

// Accounting screens
import LedgersScreen from '../screens/client/accounting/LedgersScreen.jsx';
import LedgerDetailsScreen from '../screens/client/accounting/LedgerDetailsScreen.jsx';

// Inventory screens
import InventoryScreen from '../screens/client/inventory/InventoryScreen.jsx';

// Voucher screens
import VouchersScreen from '../screens/client/vouchers/VouchersScreen.jsx';
import SalesInvoiceScreen from '../screens/client/vouchers/SalesInvoiceScreen.jsx';
import PurchaseInvoiceScreen from '../screens/client/vouchers/PurchaseInvoiceScreen.jsx';

// GST screens
import GSTINsScreen from '../screens/client/gst/GSTINsScreen.jsx';

// Reports screens
import ReportsScreen from '../screens/client/reports/ReportsScreen.jsx';

const Stack = createNativeStackNavigator();

export default function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      
      {/* Auth Screens */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      
      {/* Profile Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      
      {/* Company Screens */}
      <Stack.Screen name="Companies" component={CompaniesScreen} />
      <Stack.Screen name="Branches" component={BranchesScreen} />
      
      {/* Accounting Screens */}
      <Stack.Screen name="Ledgers" component={LedgersScreen} />
      <Stack.Screen name="LedgerDetails" component={LedgerDetailsScreen} />
      
      {/* Inventory Screens */}
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      
      {/* Voucher Screens */}
      <Stack.Screen name="Vouchers" component={VouchersScreen} />
      <Stack.Screen name="SalesInvoice" component={SalesInvoiceScreen} />
      <Stack.Screen name="PurchaseInvoice" component={PurchaseInvoiceScreen} />
      
      {/* GST Screens */}
      <Stack.Screen name="GSTINs" component={GSTINsScreen} />
      
      {/* Reports Screens */}
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}