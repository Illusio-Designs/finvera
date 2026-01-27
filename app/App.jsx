import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from './src/contexts/AuthContext.jsx';
import { NotificationProvider } from './src/contexts/NotificationContext.jsx';
import { DrawerProvider, useDrawer } from './src/contexts/DrawerContext.jsx';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext.jsx';
import CustomDrawer from './src/components/navigation/CustomDrawer.jsx';
import BottomTabBar from './src/components/navigation/BottomTabBar.jsx';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen.jsx';
import SplashScreen from './src/screens/auth/SplashScreen.jsx';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen.jsx';

// Client Screens
import DashboardScreen from './src/screens/client/dashboard/DashboardScreen.jsx';
import VouchersScreen from './src/screens/client/vouchers/VouchersScreen.jsx';
import ReportsScreen from './src/screens/client/reports/ReportsScreen.jsx';
import GSTScreen from './src/screens/client/gst/GSTScreen.jsx';
import MoreScreen from './src/screens/client/profile/MoreScreen.jsx';
import ProfileScreen from './src/screens/client/profile/ProfileScreen.jsx';
import SettingsScreen from './src/screens/client/profile/SettingsScreen.jsx';
import NotificationPreferencesScreen from './src/screens/client/profile/NotificationPreferencesScreen.jsx';
import ChangePasswordScreen from './src/screens/client/profile/ChangePasswordScreen.jsx';
import SubscriptionScreen from './src/screens/client/profile/SubscriptionScreen.jsx';
import PlansScreen from './src/screens/client/profile/PlansScreen.jsx';
import LedgersScreen from './src/screens/client/accounting/LedgersScreen.jsx';
import InventoryScreen from './src/screens/client/inventory/InventoryScreen.jsx';
import SupportScreen from './src/screens/client/business/SupportScreen.jsx';
import CompaniesScreen from './src/screens/client/company/CompaniesScreen.jsx';
import CompanyBranchSelectionScreen from './src/screens/client/company/CompanyBranchSelectionScreen.jsx';
import NotificationsScreen from './src/screens/client/tools/NotificationsScreen.jsx';

// Phase 3: Advanced Inventory Screens
import InventoryItemsScreen from './src/screens/client/inventory/InventoryItemsScreen.jsx';
import InventoryAdjustmentScreen from './src/screens/client/inventory/InventoryAdjustmentScreen.jsx';
import InventoryTransferScreen from './src/screens/client/inventory/InventoryTransferScreen.jsx';
import WarehousesScreen from './src/screens/client/inventory/WarehousesScreen.jsx';
import AttributesScreen from './src/screens/client/inventory/AttributesScreen.jsx';

// Phase 3: Advanced GST Screens
import GSTINsScreen from './src/screens/client/gst/GSTINsScreen.jsx';
import GSTRatesScreen from './src/screens/client/gst/GSTRatesScreen.jsx';
import EInvoiceScreen from './src/screens/client/gst/EInvoiceScreen.jsx';
import EWayBillScreen from './src/screens/client/gst/EWayBillScreen.jsx';

// Phase 4: Tax Management Screens
import IncomeTaxScreen from './src/screens/client/tax/IncomeTaxScreen.jsx';
import TaxCalculatorScreen from './src/screens/client/tax/TaxCalculatorScreen.jsx';
import TDSScreen from './src/screens/client/tax/TDSScreen.jsx';

// Phase 4: Reports Screens
import BalanceSheetScreen from './src/screens/client/reports/BalanceSheetScreen.jsx';
import ProfitLossScreen from './src/screens/client/reports/ProfitLossScreen.jsx';

// Phase 5: Extended Vouchers Screens
import PaymentScreen from './src/screens/client/vouchers/PaymentScreen.jsx';
import ReceiptScreen from './src/screens/client/vouchers/ReceiptScreen.jsx';
import JournalScreen from './src/screens/client/vouchers/JournalScreen.jsx';
import ContraScreen from './src/screens/client/vouchers/ContraScreen.jsx';
import DebitNoteScreen from './src/screens/client/vouchers/DebitNoteScreen.jsx';
import CreditNoteScreen from './src/screens/client/vouchers/CreditNoteScreen.jsx';

// Phase 5: Tools Screens
import TallyImportScreen from './src/screens/client/tools/TallyImportScreen.jsx';
import SubscribeScreen from './src/screens/client/business/SubscribeScreen.jsx';
import ReviewScreen from './src/screens/client/business/ReviewScreen.jsx';
import LoanScreen from './src/screens/client/business/LoanScreen.jsx';
import ReferralScreen from './src/screens/client/business/ReferralScreen.jsx';

// Loading Screen
import LoadingScreen from './src/screens/LoadingScreen.jsx';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { isDrawerOpen, closeDrawer } = useDrawer();

  // Track current route for bottom navigation
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

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
    if (fontsLoaded && !loading) {
      // Show splash screen for 2 seconds after fonts are loaded and auth is checked
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, loading]);

  // Navigation state listener to track current route
  const onNavigationStateChange = (state) => {
    if (state) {
      const currentRouteName = getCurrentRouteName(state);
      setCurrentRoute(currentRouteName);
    }
  };

  // Helper function to get current route name
  const getCurrentRouteName = (navigationState) => {
    if (!navigationState) return 'Dashboard';
    
    const route = navigationState.routes[navigationState.index];
    if (route.state) {
      return getCurrentRouteName(route.state);
    }
    return route.name;
  };

  if (!fontsLoaded || loading || showSplash) {
    return showSplash ? <SplashScreen /> : <LoadingScreen />;
  }

  return (
    <NavigationContainer onStateChange={onNavigationStateChange}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "CompanyBranchSelection" : "Login"}
      >
        {isAuthenticated ? (
          <>
            {/* Post-login Company/Branch Selection */}
            <Stack.Screen name="CompanyBranchSelection" component={CompanyBranchSelectionScreen} />
            
            {/* Main App Screens */}
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Vouchers" component={VouchersScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="GST" component={GSTScreen} />
            <Stack.Screen name="More" component={MoreScreen} />
            
            {/* Profile & Settings */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Plans" component={PlansScreen} />
            
            {/* Business Features */}
            <Stack.Screen name="Ledgers" component={LedgersScreen} />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Companies" component={CompaniesScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            
            {/* Phase 3: Advanced Inventory Screens */}
            <Stack.Screen name="InventoryItems" component={InventoryItemsScreen} />
            <Stack.Screen name="InventoryAdjustment" component={InventoryAdjustmentScreen} />
            <Stack.Screen name="InventoryTransfer" component={InventoryTransferScreen} />
            <Stack.Screen name="Warehouses" component={WarehousesScreen} />
            <Stack.Screen name="Attributes" component={AttributesScreen} />
            
            {/* Phase 3: Advanced GST Screens */}
            <Stack.Screen name="GSTINs" component={GSTINsScreen} />
            <Stack.Screen name="GSTRates" component={GSTRatesScreen} />
            <Stack.Screen name="EInvoice" component={EInvoiceScreen} />
            <Stack.Screen name="EWayBill" component={EWayBillScreen} />
            
            {/* Phase 4: Tax Management Screens */}
            <Stack.Screen name="IncomeTax" component={IncomeTaxScreen} />
            <Stack.Screen name="TaxCalculator" component={TaxCalculatorScreen} />
            <Stack.Screen name="TDS" component={TDSScreen} />
            
            {/* Phase 4: Reports Screens */}
            <Stack.Screen name="BalanceSheet" component={BalanceSheetScreen} />
            <Stack.Screen name="ProfitLoss" component={ProfitLossScreen} />
            
            {/* Phase 5: Extended Vouchers Screens */}
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Receipt" component={ReceiptScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            <Stack.Screen name="Contra" component={ContraScreen} />
            <Stack.Screen name="DebitNote" component={DebitNoteScreen} />
            <Stack.Screen name="CreditNote" component={CreditNoteScreen} />
            
            {/* Phase 5: Tools Screens */}
            <Stack.Screen name="TallyImport" component={TallyImportScreen} />
            
            {/* Phase 6: Business Services Screens */}
            <Stack.Screen name="Subscribe" component={SubscribeScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="Loan" component={LoanScreen} />
            <Stack.Screen name="Referral" component={ReferralScreen} />
          </>
        ) : (
          <>
            {/* Auth Screens */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
      
      {/* Custom Drawer Overlay - Inside NavigationContainer for navigation access */}
      {isAuthenticated && (
        <CustomDrawer 
          visible={isDrawerOpen} 
          onClose={closeDrawer}
        />
      )}

      {/* Sticky Bottom Navigation - Only show for authenticated users */}
      {isAuthenticated && (
        <BottomTabBar currentRoute={currentRoute} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SubscriptionProvider>
          <DrawerProvider>
            <AppNavigator />
          </DrawerProvider>
        </SubscriptionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}