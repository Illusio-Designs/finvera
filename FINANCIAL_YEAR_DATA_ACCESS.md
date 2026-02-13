# Financial Year Data Access - Current Implementation & Gaps

## Overview
This document explains how users can access previous financial year data across the application, what's currently working, and what needs to be implemented.

---

## Table of Contents
1. [Current Financial Year Implementation](#current-financial-year-implementation)
2. [Data Access by Screen](#data-access-by-screen)
3. [What Works](#what-works)
4. [What Doesn't Work](#what-doesnt-work)
5. [Backend API Support](#backend-api-support)
6. [Recommended Improvements](#recommended-improvements)
7. [Implementation Guide](#implementation-guide)

---

## Current Financial Year Implementation

### Backend Approach

#### 1. Company-Level Storage
**Location:** `backend/src/models/masterModels.js` (Company model)

**Fields:**
- `financial_year_start` (DATEONLY) - Start date of financial year
- `financial_year_end` (DATEONLY) - End date of financial year
- `books_beginning_date` (DATEONLY) - When books started

#### 2. Automatic Financial Year Calculation
The backend has **hardcoded Indian financial year logic** (April 1 to March 31):

**In `voucherService.js`:**
```javascript
getCurrentFinancialYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based
  
  if (currentMonth >= 3) { // April onwards
    fyStart = new Date(currentYear, 3, 1); // April 1st
    fyEnd = new Date(currentYear + 1, 2, 31); // March 31st next year
  } else { // January to March
    fyStart = new Date(currentYear - 1, 3, 1); // April 1st previous year
    fyEnd = new Date(currentYear, 2, 31); // March 31st current year
  }
  
  return { start: fyStart, end: fyEnd };
}
```

**In `tdsService.js`:**
```javascript
function getFinancialYear(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${year + 1}`; // e.g., "2024-2025"
  } else {
    return `${year - 1}-${year}`;
  }
}
```

#### 3. Financial Year Validation
- **Voucher dates** are validated to be within current or previous financial year
- **TDS calculations** automatically determine quarter and financial year based on payment date
- **Reports** use financial year for filtering and grouping

#### 4. TDS/Tax Records
- Store `financial_year` as string (e.g., "2024-25")
- Store `quarter` (Q1, Q2, Q3, Q4)
- Indexed by `tenant_id`, `quarter`, and `financial_year`

### Frontend Approach

#### 1. Company Creation/Edit
**Location:** `app/src/components/modals/CreateCompanyModal.jsx`

Users can set:
- `financial_year_start` - Start date
- `financial_year_end` - End date
- `books_beginning_date` - When accounting started

#### 2. Configuration
**Location:** `app/src/config/env.js`

Has constant: `FINANCIAL_YEAR_START_MONTH: 4` (April)

#### 3. No Active Financial Year Selector
- Currently, there's **NO UI** to switch between financial years
- No context or state management for "active financial year"
- Reports and screens use **current date** to determine financial year automatically

---

## Data Access by Screen

### ✅ Full Support (Can View Previous Year Data)

| Screen | Date Filter Type | Parameters | Status |
|--------|-----------------|------------|---------|
| **Balance Sheet** | As On Date | `as_on_date` | ✅ Working |
| **Profit & Loss** | Date Range | `from_date`, `to_date` | ✅ Working |
| **Receivables** | As On Date | `as_on_date` | ✅ Working |
| **Payables** | As On Date | `as_on_date` | ✅ Working |
| **Ledger Statement** | Date Range | `from_date`, `to_date` | ✅ Working |
| **TDS Report** | Date Range | `from_date`, `to_date` | ✅ Working |
| **TCS Report** | Date Range | `from_date`, `to_date` | ✅ Working |
| **Trial Balance** | As On Date + From | `as_on_date`, `from_date` | ✅ Working |

### ⚠️ Partial Support

| Screen | What Works | What's Missing |
|--------|-----------|----------------|
| **Ledgers Screen** | Ledger Statement modal has date filters | Main list has no date filter |

### ❌ No Support (Cannot View Previous Year Data)

| Screen | Issue | Impact |
|--------|-------|--------|
| **Vouchers Screen** | No date filter in UI | Cannot filter vouchers by date range |
| **Inventory Items** | No date filter | Cannot view historical inventory |
| **Stock Adjustments** | No date filter | Cannot view past adjustments |
| **Inventory Transfers** | No date filter | Cannot view past transfers |
| **Dashboard** | Always current period | Cannot view previous year dashboard |
| **E-Invoice** | No date filter | Cannot filter by date |
| **E-Way Bill** | No date filter | Cannot filter by date |
| **GST Management** | No date filter | Cannot view historical GST data |

---

## What Works

### ✅ Reports - Full Date Filtering

#### Example: View FY 2023-24 Profit & Loss
1. Open Profit & Loss Report
2. Set **From Date**: `01-04-2023`
3. Set **To Date**: `31-03-2024`
4. Generate Report
5. ✅ Shows complete FY 2023-24 data

#### Example: View Balance Sheet as of Last Year End
1. Open Balance Sheet Report
2. Set **As On Date**: `31-03-2024`
3. Generate Report
4. ✅ Shows balance sheet as of 31st March 2024

### ✅ Ledger Statement - Date Range Filter

**Location:** `app/src/screens/client/accounting/LedgersScreen.jsx`

Features:
- Date range picker (from_date, to_date)
- Quick date buttons (This Month, Last Month, This Quarter, etc.)
- Backend API supports date filtering
- Users can view ledger transactions for any historical period

**Code Example:**
```javascript
// Ledger Statement Modal has date filters
const [dateRange, setDateRange] = useState({
  fromDate: '',
  toDate: ''
});

// API call with date parameters
const response = await accountingAPI.ledgers.statement(ledger.id, {
  from_date: dateRange.fromDate,
  to_date: dateRange.toDate
});
```

---

## What Doesn't Work

### ❌ Vouchers Screen - No Date Filter

**Location:** `app/src/screens/client/vouchers/VouchersScreen.jsx`

**Current Implementation:**
```javascript
// Only fetches recent 50 vouchers
const response = await voucherAPI.list({ 
  limit: 50,
  sort: 'created_at',
  order: 'desc'
});
```

**Issues:**
- No date range filter in UI
- Users cannot select date range
- Only shows most recent 50 vouchers
- Cannot view previous year vouchers easily

**Backend Support:**
```javascript
// Backend DOES support date filtering
// backend/src/controllers/voucherController.js
if (startDate && endDate) {
  where.voucher_date = { [Op.between]: [startDate, endDate] };
}
```

### ❌ Inventory Screens - No Date Filters

**Affected Screens:**
- `app/src/screens/client/inventory/InventoryItemsScreen.jsx`
- `app/src/screens/client/inventory/InventoryAdjustmentScreen.jsx`
- `app/src/screens/client/inventory/InventoryTransferScreen.jsx`

**Issues:**
- No date filters in any inventory screen
- Cannot view historical inventory data
- Cannot filter adjustments or transfers by date

### ❌ Dashboard - Current Period Only

**Location:** `app/src/screens/client/dashboard/DashboardScreen.jsx`

**Issues:**
- Always shows current period data
- No way to view previous year dashboard
- No financial year selector

### ❌ GST Screens - No Date Filters

**Affected Screens:**
- `app/src/screens/client/gst/EInvoiceScreen.jsx`
- `app/src/screens/client/gst/EWayBillScreen.jsx`

**Issues:**
- No date range filters
- Cannot view historical e-invoices or e-way bills by date

---

## Backend API Support

### APIs That Support Date Filtering

#### 1. Reports API
```javascript
// All report APIs support date parameters
reportsAPI.balanceSheet({ as_on_date: '2024-03-31' })
reportsAPI.profitLoss({ from_date: '2023-04-01', to_date: '2024-03-31' })
reportsAPI.receivables({ as_on_date: '2024-03-31' })
reportsAPI.payables({ as_on_date: '2024-03-31' })
reportsAPI.ledgerStatement({ from_date: '2023-04-01', to_date: '2024-03-31' })
reportsAPI.trialBalance({ as_on_date: '2024-03-31', from_date: '2023-04-01' })
```

#### 2. Tax Reports API
```javascript
taxAPI.tds.report({ from_date: '2023-04-01', to_date: '2024-03-31' })
taxAPI.tcs.report({ from_date: '2023-04-01', to_date: '2024-03-31' })
```

#### 3. Voucher API (Backend Support, Frontend Not Using)
```javascript
// Backend controller supports these parameters
voucherAPI.list({ 
  startDate: '2023-04-01',
  endDate: '2024-03-31',
  limit: 100
})
```

#### 4. Ledger API
```javascript
accountingAPI.ledgers.statement(ledgerId, {
  from_date: '2023-04-01',
  to_date: '2024-03-31'
})
```

---

## Recommended Improvements

### Priority 1: Add Date Filters to Vouchers Screen 🔴

**Impact:** HIGH - Users need to view historical vouchers

**Implementation:**
1. Add date range picker to VouchersScreen.jsx
2. Add quick date buttons (This Month, Last Month, This FY, Last FY)
3. Update API call to include date parameters
4. Add "Clear Filters" button

**Code Changes:**
```javascript
// Add state for date range
const [dateRange, setDateRange] = useState({
  from_date: '',
  to_date: ''
});

// Update API call
const response = await voucherAPI.list({ 
  limit: 100,
  from_date: dateRange.from_date,
  to_date: dateRange.to_date,
  sort: 'voucher_date',
  order: 'desc'
});
```

### Priority 2: Add Date Filters to Inventory Screens 🟡

**Impact:** MEDIUM - Users need to view historical inventory transactions

**Screens to Update:**
1. Inventory Items Screen - Filter by creation/update date
2. Stock Adjustments Screen - Filter by adjustment date
3. Inventory Transfers Screen - Filter by transfer date

### Priority 3: Global Financial Year Selector 🟢

**Impact:** HIGH - Improves user experience across all screens

**Implementation:**
1. Create FinancialYearContext.jsx
2. Add FY selector dropdown in TopBar or Settings
3. Store selected FY in AsyncStorage
4. Auto-populate date ranges across all screens

**Context Structure:**
```javascript
const FinancialYearContext = createContext();

export const FinancialYearProvider = ({ children }) => {
  const [currentFY, setCurrentFY] = useState('2024-25');
  const [availableFYs, setAvailableFYs] = useState([
    '2024-25',
    '2023-24',
    '2022-23',
    '2021-22'
  ]);
  
  const getFYDates = (fy) => {
    const [startYear, endYear] = fy.split('-');
    return {
      from_date: `20${startYear}-04-01`,
      to_date: `20${endYear}-03-31`
    };
  };
  
  return (
    <FinancialYearContext.Provider value={{ 
      currentFY, 
      setCurrentFY, 
      availableFYs,
      getFYDates
    }}>
      {children}
    </FinancialYearContext.Provider>
  );
};
```

### Priority 4: Dashboard FY Filter 🟢

**Impact:** MEDIUM - Users want to view previous year dashboard

**Implementation:**
1. Add FY selector to Dashboard
2. Update all dashboard API calls to use selected FY dates
3. Show comparison with previous FY

### Priority 5: Year-End Closing Process 🔵

**Impact:** LOW - Nice to have for data integrity

**Features:**
1. Lock previous financial years
2. Prevent editing of closed years
3. Allow reopening with admin permission
4. Generate year-end reports

---

## Implementation Guide

### Step 1: Add Date Filter to Vouchers Screen

**File:** `app/src/screens/client/vouchers/VouchersScreen.jsx`

```javascript
import ModernDatePicker from '../../../components/ui/ModernDatePicker';

// Add state
const [dateRange, setDateRange] = useState({
  from_date: '',
  to_date: ''
});
const [showDateFilter, setShowDateFilter] = useState(false);

// Update fetchVouchers
const fetchVouchers = useCallback(async () => {
  setLoading(true);
  const startTime = Date.now();
  
  try {
    const params = { 
      limit: 100,
      sort: 'voucher_date',
      order: 'desc'
    };
    
    if (dateRange.from_date) params.from_date = dateRange.from_date;
    if (dateRange.to_date) params.to_date = dateRange.to_date;
    
    const response = await voucherAPI.list(params);
    const data = response.data?.data || response.data || [];
    setVouchers(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Vouchers fetch error:', error);
    showNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to load vouchers'
    });
    setVouchers([]);
  } finally {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 3000 - elapsedTime);
    setTimeout(() => setLoading(false), remainingTime);
  }
}, [dateRange, showNotification]);

// Add UI for date filter
<View style={styles.filterSection}>
  <TouchableOpacity 
    style={styles.filterButton}
    onPress={() => setShowDateFilter(!showDateFilter)}
  >
    <Ionicons name="calendar-outline" size={20} color="#3e60ab" />
    <Text style={styles.filterButtonText}>Filter by Date</Text>
  </TouchableOpacity>
  
  {showDateFilter && (
    <View style={styles.dateFilterContainer}>
      <View style={styles.datePickersRow}>
        <View style={styles.dateInputGroup}>
          <ModernDatePicker
            label="From Date"
            value={dateRange.from_date}
            onDateChange={(date) => setDateRange(prev => ({ ...prev, from_date: date }))}
            placeholder="Select from date"
          />
        </View>
        <View style={styles.dateInputGroup}>
          <ModernDatePicker
            label="To Date"
            value={dateRange.to_date}
            onDateChange={(date) => setDateRange(prev => ({ ...prev, to_date: date }))}
            placeholder="Select to date"
          />
        </View>
      </View>
      
      <View style={styles.quickDateButtons}>
        <TouchableOpacity 
          style={styles.quickDateButton}
          onPress={() => setDateRange({
            from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            to_date: new Date().toISOString().split('T')[0]
          })}
        >
          <Text style={styles.quickDateButtonText}>This Month</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickDateButton}
          onPress={() => {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            setDateRange({
              from_date: lastMonth.toISOString().split('T')[0],
              to_date: lastMonthEnd.toISOString().split('T')[0]
            });
          }}
        >
          <Text style={styles.quickDateButtonText}>Last Month</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickDateButton}
          onPress={() => {
            const now = new Date();
            const fyStart = now.getMonth() >= 3 
              ? new Date(now.getFullYear(), 3, 1)
              : new Date(now.getFullYear() - 1, 3, 1);
            setDateRange({
              from_date: fyStart.toISOString().split('T')[0],
              to_date: new Date().toISOString().split('T')[0]
            });
          }}
        >
          <Text style={styles.quickDateButtonText}>This FY</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickDateButton}
          onPress={() => {
            const now = new Date();
            const lastFYStart = now.getMonth() >= 3 
              ? new Date(now.getFullYear() - 1, 3, 1)
              : new Date(now.getFullYear() - 2, 3, 1);
            const lastFYEnd = new Date(lastFYStart.getFullYear() + 1, 2, 31);
            setDateRange({
              from_date: lastFYStart.toISOString().split('T')[0],
              to_date: lastFYEnd.toISOString().split('T')[0]
            });
          }}
        >
          <Text style={styles.quickDateButtonText}>Last FY</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickDateButton, styles.clearButton]}
          onPress={() => setDateRange({ from_date: '', to_date: '' })}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</View>
```

### Step 2: Update Backend Voucher Controller

**File:** `backend/src/controllers/voucherController.js`

Ensure the list endpoint properly handles date parameters:

```javascript
async list(req, res, next) {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      voucher_type, 
      status,
      from_date,
      to_date,
      sort = 'voucher_date',
      order = 'DESC'
    } = req.query;

    const where = { tenant_id: req.tenantId };
    
    if (voucher_type) where.voucher_type = voucher_type;
    if (status) where.status = status;
    
    // Add date range filter
    if (from_date && to_date) {
      where.voucher_date = { 
        [Op.between]: [new Date(from_date), new Date(to_date)] 
      };
    } else if (from_date) {
      where.voucher_date = { [Op.gte]: new Date(from_date) };
    } else if (to_date) {
      where.voucher_date = { [Op.lte]: new Date(to_date) };
    }

    const vouchers = await req.tenantModels.Voucher.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[sort, order]],
    });

    res.json({
      success: true,
      data: vouchers.rows,
      total: vouchers.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (err) {
    next(err);
  }
}
```

### Step 3: Create Financial Year Context

**File:** `app/src/contexts/FinancialYearContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildStorageKey } from '../config/env';

const FinancialYearContext = createContext();

export const useFinancialYear = () => {
  const context = useContext(FinancialYearContext);
  if (!context) {
    throw new Error('useFinancialYear must be used within a FinancialYearProvider');
  }
  return context;
};

export const FinancialYearProvider = ({ children }) => {
  const [currentFY, setCurrentFY] = useState(null);
  const [availableFYs, setAvailableFYs] = useState([]);

  useEffect(() => {
    loadFinancialYear();
    generateAvailableFYs();
  }, []);

  const loadFinancialYear = async () => {
    try {
      const storageKey = buildStorageKey('selected_financial_year');
      const savedFY = await AsyncStorage.getItem(storageKey);
      if (savedFY) {
        setCurrentFY(savedFY);
      } else {
        const defaultFY = getCurrentFinancialYear();
        setCurrentFY(defaultFY);
      }
    } catch (error) {
      console.error('Error loading financial year:', error);
      setCurrentFY(getCurrentFinancialYear());
    }
  };

  const saveFinancialYear = async (fy) => {
    try {
      const storageKey = buildStorageKey('selected_financial_year');
      await AsyncStorage.setItem(storageKey, fy);
      setCurrentFY(fy);
    } catch (error) {
      console.error('Error saving financial year:', error);
    }
  };

  const getCurrentFinancialYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    if (currentMonth >= 3) { // April onwards
      return `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    } else {
      return `${currentYear - 1}-${String(currentYear).slice(-2)}`;
    }
  };

  const generateAvailableFYs = () => {
    const currentFY = getCurrentFinancialYear();
    const [startYear] = currentFY.split('-').map(y => parseInt(y.length === 2 ? `20${y}` : y));
    
    const fys = [];
    for (let i = 0; i < 5; i++) {
      const year = startYear - i;
      fys.push(`${year}-${String(year + 1).slice(-2)}`);
    }
    
    setAvailableFYs(fys);
  };

  const getFYDates = (fy) => {
    if (!fy) return { from_date: '', to_date: '' };
    
    const [startYear, endYear] = fy.split('-');
    const fullStartYear = startYear.length === 2 ? `20${startYear}` : startYear;
    const fullEndYear = endYear.length === 2 ? `20${endYear}` : endYear;
    
    return {
      from_date: `${fullStartYear}-04-01`,
      to_date: `${fullEndYear}-03-31`
    };
  };

  const value = {
    currentFY,
    setCurrentFY: saveFinancialYear,
    availableFYs,
    getFYDates,
    getCurrentFinancialYear,
  };

  return (
    <FinancialYearContext.Provider value={value}>
      {children}
    </FinancialYearContext.Provider>
  );
};
```

### Step 4: Add FY Selector to TopBar

**File:** `app/src/components/navigation/TopBar.jsx`

```javascript
import { useFinancialYear } from '../../contexts/FinancialYearContext';

// Add FY selector
const { currentFY, availableFYs, setCurrentFY } = useFinancialYear();
const [showFYPicker, setShowFYPicker] = useState(false);

// Add to TopBar UI
<TouchableOpacity 
  style={styles.fySelector}
  onPress={() => setShowFYPicker(true)}
>
  <Text style={styles.fySelectorText}>FY {currentFY}</Text>
  <Ionicons name="chevron-down" size={16} color="#64748b" />
</TouchableOpacity>

{/* FY Picker Modal */}
<Modal visible={showFYPicker} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.fyPickerModal}>
      <Text style={styles.fyPickerTitle}>Select Financial Year</Text>
      {availableFYs.map((fy) => (
        <TouchableOpacity
          key={fy}
          style={[
            styles.fyOption,
            currentFY === fy && styles.fyOptionActive
          ]}
          onPress={() => {
            setCurrentFY(fy);
            setShowFYPicker(false);
          }}
        >
          <Text style={[
            styles.fyOptionText,
            currentFY === fy && styles.fyOptionTextActive
          ]}>
            FY {fy}
          </Text>
          {currentFY === fy && (
            <Ionicons name="checkmark" size={20} color="#3e60ab" />
          )}
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.fyPickerClose}
        onPress={() => setShowFYPicker(false)}
      >
        <Text style={styles.fyPickerCloseText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## Summary

### Current Limitations

1. ❌ **No way to view previous financial year data in Vouchers screen**
2. ❌ **No date filters in Inventory screens**
3. ❌ **Hardcoded April-March** - Doesn't respect company's custom financial year dates
4. ❌ **No financial year selector** in reports or dashboard
5. ❌ **No year-end closing process** - No way to lock previous years
6. ❌ **No comparative reports** - Can't compare FY 2024-25 vs FY 2023-24

### What Works

✅ **All Reports** support date filtering and can show previous year data
✅ **Ledger Statement** has date range filter
✅ **Backend APIs** support date parameters
✅ **Data is preserved** - Historical data is stored and accessible

### Next Steps

1. **Immediate:** Add date filters to Vouchers screen
2. **Short-term:** Add date filters to Inventory screens
3. **Medium-term:** Implement global Financial Year selector
4. **Long-term:** Add year-end closing and comparative reports

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** Development Team
