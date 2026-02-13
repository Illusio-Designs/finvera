# Frontend (App) API & UI Development Guide

## 📱 Overview

This document provides comprehensive guidance for developing features in the Finvera mobile app (React Native + Expo), including API integration patterns, UI component usage, and best practices.

---

## 🏗️ Project Structure

```
app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Dropdown, DatePicker, etc.)
│   │   ├── modals/         # Modal components for CRUD operations
│   │   ├── invoice/        # Invoice-specific components
│   │   ├── navigation/     # Navigation components
│   │   └── permissions/    # Permission-related components
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   └── client/        # Client portal screens
│   │       ├── accounting/
│   │       ├── business/
│   │       ├── company/
│   │       ├── dashboard/
│   │       ├── gst/
│   │       ├── inventory/
│   │       ├── profile/
│   │       ├── reports/
│   │       ├── settings/
│   │       ├── tax/
│   │       ├── tools/
│   │       └── vouchers/
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # API client and utilities
│   ├── services/          # Business logic services
│   ├── utils/             # Helper functions
│   └── config/            # Configuration files
├── assets/                # Static assets (images, fonts)
└── scripts/               # Build and setup scripts
```

---

## 🔌 API Integration

### API Client Setup

The app uses a centralized API client (`apiClient.js`) with automatic:
- Token injection from AsyncStorage
- Request/response interceptors
- Error handling and global notifications
- Request deduplication
- Dynamic API URL detection
- Retry logic for failed requests

### Available API Modules

All APIs are exported from `app/src/lib/api.js`:

#### 1. Authentication APIs (`authAPI`)
```javascript
import { authAPI } from '../lib/api';

// Login flow
const response = await authAPI.authenticate(email, password);
const loginResponse = await authAPI.login(email, password, portalType, companyId, userId);

// Profile management
const profile = await authAPI.getProfile();
await authAPI.updateProfile(data);
await authAPI.changePassword({ oldPassword, newPassword });

// Company switching
await authAPI.switchCompany(companyId);
```

#### 2. Company Management APIs (`companyAPI`)
```javascript
import { companyAPI } from '../lib/api';

const companies = await companyAPI.list();
const company = await companyAPI.get(id);
await companyAPI.create(data);
await companyAPI.update(id, data);
await companyAPI.delete(id);
```

#### 3. Branch Management APIs (`branchAPI`)
```javascript
import { branchAPI } from '../lib/api';

const branches = await branchAPI.list(companyId);
const branch = await branchAPI.get(id);
await branchAPI.create(data);
await branchAPI.update(id, data);
```

#### 4. Accounting APIs (`accountingAPI`)
```javascript
import { accountingAPI } from '../lib/api';

// Ledgers
const ledgers = await accountingAPI.ledgers.list({ page: 1, limit: 20 });
await accountingAPI.ledgers.create(data);
const balance = await accountingAPI.ledgers.balance(id, { date: '2024-03-31' });

// Account Groups
const groups = await accountingAPI.accountGroups.list();
const tree = await accountingAPI.accountGroups.tree();

// Numbering Series
const series = await accountingAPI.numberingSeries.list({ voucher_type: 'Sales' });
await accountingAPI.numberingSeries.create(data);

// TDS/TCS
const tdsSections = await accountingAPI.tdsTcs.getTDSSections();
await accountingAPI.tdsTcs.createTDSLedgers();
```

#### 5. Voucher APIs (`voucherAPI`)
```javascript
import { voucherAPI } from '../lib/api';

// Generic vouchers
const vouchers = await voucherAPI.list({ type: 'Sales', page: 1 });
const voucher = await voucherAPI.get(id);
await voucherAPI.create(data);
await voucherAPI.update(id, data);

// Sales Invoice
await voucherAPI.salesInvoice.create(data);
const invoice = await voucherAPI.salesInvoice.get(id);

// Purchase Invoice
await voucherAPI.purchaseInvoice.create(data);

// Payment & Receipt
await voucherAPI.payment.create(data);
await voucherAPI.receipt.create(data);

// Credit/Debit Notes
await voucherAPI.creditNote.create(data);
```

#### 6. Inventory APIs (`inventoryAPI`)
```javascript
import { inventoryAPI } from '../lib/api';

// Items
const items = await inventoryAPI.items.list({ search: 'product' });
await inventoryAPI.items.create(data);

// Stock Adjustments
const adjustments = await inventoryAPI.adjustments.list();
await inventoryAPI.adjustments.create(data);

// Stock Transfers
const transfers = await inventoryAPI.transfers.list();
await inventoryAPI.transfers.create(data);

// Warehouses
const warehouses = await inventoryAPI.warehouses.list();
await inventoryAPI.warehouses.create(data);

// Attributes (for variants)
const attributes = await inventoryAPI.attributes.list();
```

#### 7. GST APIs (`gstAPI`)
```javascript
import { gstAPI } from '../lib/api';

// GSTIN Management
const gstins = await gstAPI.gstins.list();
await gstAPI.gstins.create(data);
await gstAPI.gstins.setDefault(id);

// E-Invoice
await gstAPI.einvoice.generate(data);
const einvoice = await gstAPI.einvoice.getByVoucher(voucherId);
await gstAPI.einvoice.cancel(voucherId, { reason, remarks });

// E-Way Bill
await gstAPI.ewaybill.generate(data);
await gstAPI.ewaybill.updateVehicle(id, { vehicleNumber });

// GST Validation
await gstAPI.validate(gstin);
const details = await gstAPI.details(gstin);

// Analytics
await gstAPI.analytics.gstr2aReconciliation(data);
```

#### 8. Reports APIs (`reportsAPI`)
```javascript
import { reportsAPI } from '../lib/api';

const balanceSheet = await reportsAPI.balanceSheet({ 
  from_date: '2024-04-01', 
  to_date: '2024-03-31' 
});

const profitLoss = await reportsAPI.profitLoss({ from_date, to_date });
const trialBalance = await reportsAPI.trialBalance({ as_on_date: '2024-03-31' });
const ledgerStatement = await reportsAPI.ledgerStatement({ ledger_id: id, from_date, to_date });
const receivables = await reportsAPI.receivables({ as_on_date: '2024-03-31' });
const stockSummary = await reportsAPI.stockSummary({ as_on_date: '2024-03-31' });
```

#### 9. Tax APIs (`taxAPI`)
```javascript
import { taxAPI } from '../lib/api';

// TDS
const tdsRecords = await taxAPI.tds.list({ from_date, to_date });
const calculation = await taxAPI.tds.calculate(data);
await taxAPI.tds.generateReturn(data);
await taxAPI.tds.generateCertificate(id);

// TDS Calculator
const result = await taxAPI.tds.calculateNonSalary({
  amount: 100000,
  section: '194C',
  panAvailable: true
});

// TDS Compliance
await taxAPI.tds.check206AB({ pan: 'ABCDE1234F' });

// Income Tax
const taxCalculation = await taxAPI.incomeTax.calculate(data);
const slabs = await taxAPI.incomeTax.getSlabs({ financial_year: '2024-25' });
```

#### 10. Subscription APIs (`subscriptionAPI`)
```javascript
import { subscriptionAPI } from '../lib/api';

const subscription = await subscriptionAPI.getCurrentSubscription();
await subscriptionAPI.createSubscription(data);
await subscriptionAPI.verifyPayment({ razorpay_payment_id, razorpay_signature });
const history = await subscriptionAPI.getPaymentHistory();
```

#### 11. Notification APIs (`notificationAPI`)
```javascript
import { notificationAPI } from '../lib/api';

const notifications = await notificationAPI.list({ page: 1, limit: 20 });
const unreadCount = await notificationAPI.getUnreadCount();
await notificationAPI.markAsRead(id);
await notificationAPI.markAllAsRead();

// Preferences
const prefs = await notificationAPI.preferences.get();
await notificationAPI.preferences.update(data);
```

#### 12. Support APIs (`clientSupportAPI`)
```javascript
import { clientSupportAPI } from '../lib/api';

const tickets = await clientSupportAPI.tickets.list();
await clientSupportAPI.tickets.create({ subject, description, priority });
const ticket = await clientSupportAPI.tickets.get(id);
const messages = await clientSupportAPI.tickets.messages(id);
await clientSupportAPI.tickets.addMessage(id, { message });
```

#### 13. FinBox APIs (`finboxAPI`) - Loan Integration
```javascript
import { finboxAPI } from '../lib/api';

// Consent management
await finboxAPI.saveConsent(data);
const consent = await finboxAPI.getConsent();

// Credit scoring
const creditScore = await finboxAPI.getCreditScore(data);
const inclusionScore = await finboxAPI.getInclusionScore(customerId);

// Eligibility check
const eligibility = await finboxAPI.checkEligibility(data);

// Bank statement analysis
await finboxAPI.initiateBankStatement(data);
const status = await finboxAPI.getBankStatementStatus(customerId);
const analysis = await finboxAPI.getBankStatementAnalysis(customerId);
```

#### 14. Search APIs (`searchAPI`)
```javascript
import { searchAPI } from '../lib/api';

// Universal search across all entities
const results = await searchAPI.universal({ 
  query: 'customer name',
  types: 'ledger,voucher,item' // optional filter
});
```

#### 15. Referral APIs (`referralAPI`)
```javascript
import { referralAPI } from '../lib/api';

const myCode = await referralAPI.getMyCode();
await referralAPI.verifyCode(code);
const discountConfig = await referralAPI.getCurrentDiscountConfig();
```

---

## 🎨 UI Components Library

### Base UI Components (`app/src/components/ui/`)

#### 1. Dropdown Component
```javascript
import Dropdown from '../components/ui/Dropdown';

<Dropdown
  label="Select Ledger"
  value={selectedLedger}
  onValueChange={setSelectedLedger}
  items={ledgers.map(l => ({ label: l.name, value: l.id }))}
  placeholder="Choose a ledger"
  error={errors.ledger}
/>
```

#### 2. ModernDatePicker
```javascript
import ModernDatePicker from '../components/ui/ModernDatePicker';

<ModernDatePicker
  label="Invoice Date"
  value={date}
  onChange={setDate}
  mode="date"
  error={errors.date}
/>
```

#### 3. SearchBar
```javascript
import SearchBar from '../components/ui/SearchBar';

<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search ledgers..."
  onClear={() => setSearchQuery('')}
/>
```

#### 4. SearchModal (Universal Search)
```javascript
import SearchModal from '../components/ui/SearchModal';

<SearchModal
  visible={showSearch}
  onClose={() => setShowSearch(false)}
  onSelect={(item) => handleSelect(item)}
  searchTypes={['ledger', 'item']} // optional filter
/>
```

#### 5. PhoneInput
```javascript
import PhoneInput from '../components/ui/PhoneInput';

<PhoneInput
  label="Mobile Number"
  value={phone}
  onChangeText={setPhone}
  error={errors.phone}
/>
```

#### 6. ProfileImagePicker
```javascript
import ProfileImagePicker from '../components/ui/ProfileImagePicker';

<ProfileImagePicker
  imageUri={profileImage}
  onImageSelected={setProfileImage}
  size={120}
/>
```

#### 7. SkeletonLoader
```javascript
import SkeletonLoader from '../components/ui/SkeletonLoader';

{loading ? (
  <SkeletonLoader type="list" count={5} />
) : (
  <FlatList data={items} renderItem={renderItem} />
)}
```

#### 8. Toast Notifications
```javascript
import Toast from '../components/ui/Toast';

// Show toast
Toast.show({
  type: 'success', // 'success' | 'error' | 'info' | 'warning'
  title: 'Success',
  message: 'Data saved successfully',
  duration: 3000
});
```

#### 9. CustomConfirmation
```javascript
import { useConfirmation } from '../contexts/ConfirmationContext';

const { showConfirmation } = useConfirmation();

const handleDelete = async () => {
  const confirmed = await showConfirmation({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });
  
  if (confirmed) {
    // Proceed with deletion
  }
};
```

### Modal Components (`app/src/components/modals/`)

Pre-built modal components for common CRUD operations:

- `CreateLedgerModal` - Create/edit ledgers
- `CreateSalesInvoiceModal` - Sales invoice creation
- `CreatePurchaseInvoiceModal` - Purchase invoice creation
- `CreatePaymentModal` - Payment voucher
- `CreateReceiptModal` - Receipt voucher
- `CreateInventoryItemModal` - Inventory item management
- `CreateWarehouseModal` - Warehouse management
- `CreateStockAdjustmentModal` - Stock adjustments
- `CreateStockTransferModal` - Stock transfers
- `CreateCompanyModal` - Company creation
- `CreateBranchModal` - Branch creation

Usage example:
```javascript
import CreateLedgerModal from '../components/modals/CreateLedgerModal';

<CreateLedgerModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(newLedger) => {
    // Handle success
    refreshLedgers();
  }}
  initialData={editingLedger} // optional for edit mode
/>
```

### Invoice Components (`app/src/components/invoice/`)

#### 1. StatusBadge
```javascript
import { StatusBadge } from '../components/invoice';

<StatusBadge status="paid" /> // 'draft' | 'pending' | 'paid' | 'cancelled'
```

#### 2. EInvoiceStatusCard
```javascript
import { EInvoiceStatusCard } from '../components/invoice';

<EInvoiceStatusCard
  voucherId={voucherId}
  onGenerate={handleGenerate}
  onCancel={handleCancel}
/>
```

#### 3. EWayBillStatusCard
```javascript
import { EWayBillStatusCard } from '../components/invoice';

<EWayBillStatusCard
  voucherId={voucherId}
  onGenerate={handleGenerate}
  onUpdateVehicle={handleUpdateVehicle}
/>
```

#### 4. TDSCalculationCard
```javascript
import { TDSCalculationCard } from '../components/invoice';

<TDSCalculationCard
  amount={invoiceAmount}
  section="194C"
  panAvailable={true}
  onCalculate={(tdsAmount) => setTdsAmount(tdsAmount)}
/>
```

#### 5. DocumentActionButtons
```javascript
import { DocumentActionButtons } from '../components/invoice';

<DocumentActionButtons
  voucherId={voucherId}
  voucherType="Sales"
  onPrint={handlePrint}
  onShare={handleShare}
  onEmail={handleEmail}
/>
```

---

## 🔐 Context Providers

### Available Contexts

#### 1. AuthContext
```javascript
import { useAuth } from '../contexts/AuthContext';

const { user, token, login, logout, loading } = useAuth();

// Login
await login(email, password, companyId);

// Logout
await logout();

// Check authentication
if (user) {
  // User is authenticated
}
```

#### 2. SettingsContext
```javascript
import { useSettings } from '../contexts/SettingsContext';

const { settings, updateSettings, loading } = useSettings();

// Access settings
const { company_name, financial_year_start, gst_enabled } = settings;

// Update settings
await updateSettings({ gst_enabled: true });
```

#### 3. NotificationContext
```javascript
import { useNotification } from '../contexts/NotificationContext';

const { showSuccess, showError, showInfo, showWarning } = useNotification();

showSuccess('Data saved successfully');
showError('Failed to save data');
```

#### 4. ConfirmationContext
```javascript
import { useConfirmation } from '../contexts/ConfirmationContext';

const { showConfirmation } = useConfirmation();

const confirmed = await showConfirmation({
  title: 'Confirm Action',
  message: 'Are you sure?',
  confirmText: 'Yes',
  cancelText: 'No'
});
```

#### 5. SearchContext
```javascript
import { useSearch } from '../contexts/SearchContext';

const { searchResults, search, clearSearch, loading } = useSearch();

// Perform search
await search('customer name', ['ledger', 'voucher']);

// Access results
searchResults.forEach(result => {
  console.log(result.type, result.data);
});
```

#### 6. VoucherContext
```javascript
import { useVoucher } from '../contexts/VoucherContext';

const { 
  currentVoucher, 
  saveVoucher, 
  deleteVoucher, 
  loading 
} = useVoucher();

// Save voucher
await saveVoucher(voucherData);
```

#### 7. SubscriptionContext
```javascript
import { useSubscription } from '../contexts/SubscriptionContext';

const { 
  subscription, 
  isActive, 
  isTrial, 
  daysRemaining,
  refreshSubscription 
} = useSubscription();

// Check subscription status
if (!isActive) {
  // Show upgrade prompt
}
```

---

## 🎣 Custom Hooks

### usePermissions Hook
```javascript
import { usePermissions } from '../hooks/usePermissions';

const { hasPermission, checkPermission, loading } = usePermissions();

// Check permission
if (hasPermission('vouchers.create')) {
  // Show create button
}

// Check multiple permissions
const canEdit = checkPermission(['vouchers.edit', 'vouchers.update']);
```

---

## 🎯 Common Development Patterns

### 1. Creating a New Screen with API Integration

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { accountingAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import SearchBar from '../../components/ui/SearchBar';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const LedgersScreen = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchLedgers();
  }, [page, searchQuery]);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const response = await accountingAPI.ledgers.list({
        page,
        limit: 20,
        search: searchQuery
      });
      setLedgers(response.data.data);
    } catch (error) {
      showError('Failed to fetch ledgers');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      className="p-4 bg-white mb-2 rounded-lg"
      onPress={() => navigation.navigate('LedgerDetail', { id: item.id })}
    >
      <Text className="text-lg font-semibold">{item.name}</Text>
      <Text className="text-gray-600">{item.group_name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <SkeletonLoader type="list" count={10} />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search ledgers..."
      />
      <FlatList
        data={ledgers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => setPage(page + 1)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default LedgersScreen;
```

### 2. Form with Validation

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { accountingAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import Dropdown from '../../components/ui/Dropdown';
import ModernDatePicker from '../../components/ui/ModernDatePicker';

const CreateVoucherScreen = () => {
  const [formData, setFormData] = useState({
    voucher_type: '',
    date: new Date(),
    ledger_id: '',
    amount: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const validate = () => {
    const newErrors = {};
    if (!formData.voucher_type) newErrors.voucher_type = 'Required';
    if (!formData.ledger_id) newErrors.ledger_id = 'Required';
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await voucherAPI.create(formData);
      showSuccess('Voucher created successfully');
      navigation.goBack();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-4 bg-white">
      <Dropdown
        label="Voucher Type"
        value={formData.voucher_type}
        onValueChange={(value) => setFormData({ ...formData, voucher_type: value })}
        items={[
          { label: 'Sales', value: 'Sales' },
          { label: 'Purchase', value: 'Purchase' },
          { label: 'Payment', value: 'Payment' },
          { label: 'Receipt', value: 'Receipt' }
        ]}
        error={errors.voucher_type}
      />

      <ModernDatePicker
        label="Date"
        value={formData.date}
        onChange={(date) => setFormData({ ...formData, date })}
        error={errors.date}
      />

      <TouchableOpacity
        className="bg-blue-600 p-4 rounded-lg mt-4"
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Creating...' : 'Create Voucher'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateVoucherScreen;
```

### 3. Using Modals for CRUD Operations

```javascript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import CreateLedgerModal from '../../components/modals/CreateLedgerModal';

const LedgersScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);

  const handleCreate = () => {
    setEditingLedger(null);
    setShowModal(true);
  };

  const handleEdit = (ledger) => {
    setEditingLedger(ledger);
    setShowModal(true);
  };

  const handleSuccess = (newLedger) => {
    setShowModal(false);
    // Refresh list
    fetchLedgers();
  };

  return (
    <View className="flex-1">
      <TouchableOpacity onPress={handleCreate}>
        <Text>Create Ledger</Text>
      </TouchableOpacity>

      <CreateLedgerModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        initialData={editingLedger}
      />
    </View>
  );
};
```

### 4. Implementing Search Functionality

```javascript
import React, { useState } from 'react';
import { View } from 'react-native';
import SearchModal from '../../components/ui/SearchModal';
import { useSearch } from '../../contexts/SearchContext';

const InvoiceScreen = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);

  const handleSelectLedger = (item) => {
    if (item.type === 'ledger') {
      setSelectedLedger(item.data);
      setShowSearch(false);
    }
  };

  return (
    <View className="flex-1">
      <TouchableOpacity onPress={() => setShowSearch(true)}>
        <Text>Select Ledger</Text>
      </TouchableOpacity>

      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSelectLedger}
        searchTypes={['ledger']}
      />
    </View>
  );
};
```

### 5. Handling Permissions

```javascript
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { usePermissions } from '../../hooks/usePermissions';

const VoucherScreen = () => {
  const { hasPermission } = usePermissions();

  return (
    <View className="flex-1">
      {hasPermission('vouchers.create') && (
        <TouchableOpacity onPress={handleCreate}>
          <Text>Create Voucher</Text>
        </TouchableOpacity>
      )}

      {hasPermission('vouchers.edit') && (
        <TouchableOpacity onPress={handleEdit}>
          <Text>Edit Voucher</Text>
        </TouchableOpacity>
      )}

      {hasPermission('vouchers.delete') && (
        <TouchableOpacity onPress={handleDelete}>
          <Text>Delete Voucher</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### 6. Error Handling Best Practices

```javascript
import React, { useState } from 'react';
import { accountingAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';

const MyComponent = () => {
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    try {
      setLoading(true);
      const response = await accountingAPI.ledgers.create(data);
      showSuccess('Ledger created successfully');
      return response.data;
    } catch (error) {
      // API client already shows global error for non-auth endpoints
      // Only show custom error if needed
      if (error.response?.status === 422) {
        // Validation errors
        const validationErrors = error.response.data.errors;
        showError('Please check the form for errors');
      }
      console.error('Error creating ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Component JSX
  );
};
```

### 7. Pagination Implementation

```javascript
import React, { useState, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { accountingAPI } from '../../lib/api';

const PaginatedListScreen = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async (pageNum) => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const response = await accountingAPI.ledgers.list({
        page: pageNum,
        limit: 20
      });

      const newData = response.data.data;
      const pagination = response.data.pagination;

      setData(prev => pageNum === 1 ? newData : [...prev, ...newData]);
      setHasMore(pagination.page < pagination.totalPages);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size="large" color="#3e60ab" />;
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};
```

### 8. Pull-to-Refresh Pattern

```javascript
import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { accountingAPI } from '../../lib/api';

const RefreshableListScreen = () => {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await accountingAPI.ledgers.list();
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3e60ab']}
        />
      }
    />
  );
};
```

---

## 📋 Styling Guidelines

### Using NativeWind (Tailwind CSS)

The app uses NativeWind for styling. All Tailwind classes work with the `className` prop:

```javascript
// Container
<View className="flex-1 bg-gray-50 p-4">

// Card
<View className="bg-white rounded-lg shadow-md p-4 mb-4">

// Button
<TouchableOpacity className="bg-blue-600 py-3 px-6 rounded-lg">
  <Text className="text-white font-semibold text-center">Submit</Text>
</TouchableOpacity>

// Input-like styling
<View className="border border-gray-300 rounded-lg p-3 mb-4">
  <TextInput className="text-base" />
</View>

// Flex layouts
<View className="flex-row justify-between items-center">
  <Text>Label</Text>
  <Text>Value</Text>
</View>
```

### Color Palette

```javascript
// Primary colors
bg-blue-600    // Primary button, active states
bg-blue-50     // Light backgrounds

// Status colors
bg-green-600   // Success
bg-red-600     // Error, danger
bg-yellow-600  // Warning
bg-gray-600    // Neutral

// Text colors
text-gray-900  // Primary text
text-gray-600  // Secondary text
text-gray-400  // Disabled text

// Background colors
bg-white       // Cards, modals
bg-gray-50     // Screen backgrounds
bg-gray-100    // Subtle backgrounds
```

---

## 🔧 Configuration & Environment

### Environment Variables

Located in `app/src/config/env.js`:

```javascript
import { API_CONFIG, APP_CONFIG, FEATURE_FLAGS } from '../config/env';

// API Configuration
API_CONFIG.API_URL          // Base API URL
API_CONFIG.TIMEOUT          // Request timeout
API_CONFIG.BASE_URL         // Base URL without /api

// App Configuration
APP_CONFIG.NAME             // App name
APP_CONFIG.VERSION          // App version
APP_CONFIG.ENVIRONMENT      // 'development' | 'production'

// Feature Flags
FEATURE_FLAGS.ENABLE_BIOMETRIC_AUTH
FEATURE_FLAGS.ENABLE_PUSH_NOTIFICATIONS
FEATURE_FLAGS.ENABLE_DEBUG_MODE
```

### Storage Keys

```javascript
import { STORAGE_CONFIG, buildStorageKey } from '../config/env';

// Build storage keys with prefix
const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
const userKey = buildStorageKey(STORAGE_CONFIG.USER_DATA_KEY);

// Store data
await AsyncStorage.setItem(tokenKey, token);

// Retrieve data
const token = await AsyncStorage.getItem(tokenKey);
```

---

## 🚀 Best Practices

### 1. API Calls
- Always use try-catch blocks
- Show loading states during API calls
- Handle errors gracefully
- Use the notification context for user feedback
- Avoid duplicate API calls (handled by apiClient)

### 2. State Management
- Use React Context for global state
- Use local state for component-specific data
- Avoid prop drilling - use contexts instead
- Keep state as close to where it's used as possible

### 3. Performance
- Use FlatList for long lists (not ScrollView)
- Implement pagination for large datasets
- Use SkeletonLoader for loading states
- Memoize expensive computations with useMemo
- Use useCallback for event handlers passed to children

### 4. Code Organization
- One component per file
- Group related components in folders
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful variable and function names

### 5. Error Handling
- Always handle API errors
- Provide user-friendly error messages
- Log errors for debugging
- Don't expose technical details to users
- Use global error handling for common errors

### 6. Security
- Never store sensitive data in plain text
- Use secure storage for tokens
- Validate all user inputs
- Sanitize data before display
- Check permissions before showing UI elements

### 7. Accessibility
- Use semantic component names
- Provide accessible labels
- Ensure sufficient color contrast
- Support screen readers
- Make touch targets at least 44x44 points

---

## 📱 Navigation

### Navigation Structure

```javascript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();

  // Navigate to screen
  navigation.navigate('ScreenName', { param1: 'value' });

  // Go back
  navigation.goBack();

  // Replace current screen
  navigation.replace('ScreenName');

  // Reset navigation stack
  navigation.reset({
    index: 0,
    routes: [{ name: 'Home' }],
  });
};
```

### Accessing Route Parameters

```javascript
import { useRoute } from '@react-navigation/native';

const DetailScreen = () => {
  const route = useRoute();
  const { id, name } = route.params;

  return (
    <View>
      <Text>ID: {id}</Text>
      <Text>Name: {name}</Text>
    </View>
  );
};
```

---

## 🧪 Testing Patterns

### Testing API Integration

```javascript
// Mock API response
jest.mock('../../lib/api', () => ({
  accountingAPI: {
    ledgers: {
      list: jest.fn(() => Promise.resolve({
        data: {
          data: [{ id: 1, name: 'Test Ledger' }],
          pagination: { page: 1, total: 1 }
        }
      }))
    }
  }
}));

// Test component
test('fetches and displays ledgers', async () => {
  render(<LedgersScreen />);
  
  await waitFor(() => {
    expect(screen.getByText('Test Ledger')).toBeTruthy();
  });
});
```

---

## 📦 Common Utilities

### Date Formatting

```javascript
import { formatDate, formatDateTime } from '../utils/formatters';

const formattedDate = formatDate(new Date()); // "31-03-2024"
const formattedDateTime = formatDateTime(new Date()); // "31-03-2024 10:30 AM"
```

### Number Formatting

```javascript
import { formatCurrency, formatNumber } from '../utils/formatters';

const amount = formatCurrency(1234.56); // "₹1,234.56"
const number = formatNumber(1234567); // "12,34,567"
```

### Business Logic Helpers

```javascript
import { 
  calculateGST, 
  calculateTDS, 
  getFinancialYear 
} from '../utils/businessLogic';

const gstAmount = calculateGST(1000, 18); // 180
const tdsAmount = calculateTDS(10000, '194C', true); // 100
const fy = getFinancialYear(new Date()); // "2024-25"
```

---

## 🎯 Feature Implementation Checklist

When implementing a new feature, follow this checklist:

### Planning Phase
- [ ] Review backend API endpoints available
- [ ] Identify required permissions
- [ ] Design UI mockup/wireframe
- [ ] List required components (existing vs new)
- [ ] Plan state management approach

### Development Phase
- [ ] Create/update API functions in `api.js`
- [ ] Create screen component
- [ ] Implement data fetching with loading states
- [ ] Add error handling
- [ ] Implement form validation (if applicable)
- [ ] Add permission checks
- [ ] Style with NativeWind classes
- [ ] Add navigation integration

### Testing Phase
- [ ] Test happy path
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test with slow network
- [ ] Test with no network
- [ ] Test permission restrictions
- [ ] Test on different screen sizes

### Polish Phase
- [ ] Add skeleton loaders
- [ ] Implement pull-to-refresh
- [ ] Add pagination (if needed)
- [ ] Optimize performance
- [ ] Add accessibility labels
- [ ] Review code for best practices

---

## 📚 Quick Reference

### Most Used APIs

```javascript
// Authentication
authAPI.login(email, password, portalType, companyId, userId)
authAPI.getProfile()
authAPI.switchCompany(companyId)

// Ledgers
accountingAPI.ledgers.list({ search, page, limit })
accountingAPI.ledgers.create(data)
accountingAPI.ledgers.get(id)

// Vouchers
voucherAPI.list({ type, from_date, to_date })
voucherAPI.salesInvoice.create(data)
voucherAPI.payment.create(data)

// Inventory
inventoryAPI.items.list({ search })
inventoryAPI.warehouses.list()

// GST
gstAPI.gstins.list()
gstAPI.einvoice.generate(data)
gstAPI.ewaybill.generate(data)

// Reports
reportsAPI.balanceSheet({ from_date, to_date })
reportsAPI.profitLoss({ from_date, to_date })
```

### Most Used Components

```javascript
// UI Components
<Dropdown />
<ModernDatePicker />
<SearchBar />
<SearchModal />
<SkeletonLoader />
<PhoneInput />

// Modals
<CreateLedgerModal />
<CreateSalesInvoiceModal />
<CreatePaymentModal />

// Invoice Components
<StatusBadge />
<EInvoiceStatusCard />
<TDSCalculationCard />
```

### Most Used Contexts

```javascript
useAuth()           // Authentication
useSettings()       // App settings
useNotification()   // Toast notifications
useConfirmation()   // Confirmation dialogs
usePermissions()    // Permission checks
useSubscription()   // Subscription status
```

---

## 🆘 Troubleshooting

### Common Issues

#### API calls failing
- Check network connectivity
- Verify API_URL in env config
- Check authentication token
- Review backend logs
- Verify request payload format

#### Components not rendering
- Check for JavaScript errors in console
- Verify data structure matches expected format
- Check conditional rendering logic
- Ensure proper key props in lists

#### Styling issues
- Verify NativeWind is properly configured
- Check tailwind.config.js
- Ensure className prop is used (not style)
- Clear Metro bundler cache: `npm start -- --reset-cache`

#### Navigation issues
- Verify screen is registered in navigator
- Check navigation params
- Ensure proper navigation stack structure
- Review navigation service setup

---

## 📞 Support & Resources

### Documentation
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- NativeWind: https://www.nativewind.dev/

### Internal Resources
- Backend API Documentation: `backend/docs/`
- Component Library: `app/src/components/`
- API Client: `app/src/lib/api.js`
- Configuration: `app/src/config/env.js`

---

## 🔄 Version History

- **v1.0.0** - Initial documentation
- Created: 2024
- Last Updated: 2024

---

**Happy Coding! 🚀**
