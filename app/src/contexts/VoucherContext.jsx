import React, { createContext, useContext, useState, useCallback } from 'react';
import { voucherAPI, eInvoiceAPI, eWayBillAPI, tdsAPI } from '../lib/api';

const VoucherContext = createContext();

export const useVoucher = () => {
  const context = useContext(VoucherContext);
  if (!context) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
};

export const VoucherProvider = ({ children }) => {
  const [voucher, setVoucher] = useState(null);
  const [eInvoiceStatus, setEInvoiceStatus] = useState(null);
  const [eWayBillStatus, setEWayBillStatus] = useState(null);
  const [tdsDetails, setTdsDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update voucher data
  const updateVoucher = useCallback((data) => {
    setVoucher((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  // Refresh all voucher-related data from backend
  const refreshVoucherData = useCallback(async (voucherId) => {
    if (!voucherId) {
      setError('Voucher ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch voucher data
      const voucherResponse = await voucherAPI.get(voucherId);
      const voucherData = voucherResponse.data?.data || voucherResponse.data;
      setVoucher(voucherData);

      // Fetch e-invoice status
      try {
        const eInvoiceResponse = await eInvoiceAPI.getStatus(voucherId);
        const eInvoiceData = eInvoiceResponse.data?.data || eInvoiceResponse.data;
        setEInvoiceStatus(eInvoiceData);
      } catch (eInvoiceError) {
        // E-invoice might not exist for this voucher, which is okay
        if (eInvoiceError.response?.status !== 404) {
          console.warn('Error fetching e-invoice status:', eInvoiceError);
        }
        setEInvoiceStatus(null);
      }

      // Fetch e-way bill status
      try {
        const eWayBillResponse = await eWayBillAPI.getStatus(voucherId);
        const eWayBillData = eWayBillResponse.data?.data || eWayBillResponse.data;
        setEWayBillStatus(eWayBillData);
      } catch (eWayBillError) {
        // E-way bill might not exist for this voucher, which is okay
        if (eWayBillError.response?.status !== 404) {
          console.warn('Error fetching e-way bill status:', eWayBillError);
        }
        setEWayBillStatus(null);
      }

      // Fetch TDS details
      try {
        const tdsResponse = await tdsAPI.getDetails(voucherId);
        const tdsData = tdsResponse.data?.data || tdsResponse.data;
        // Handle array response (filter for this voucher)
        if (Array.isArray(tdsData)) {
          const voucherTds = tdsData.find(tds => tds.voucher_id === voucherId);
          setTdsDetails(voucherTds || null);
        } else {
          setTdsDetails(tdsData);
        }
      } catch (tdsError) {
        // TDS might not exist for this voucher, which is okay
        if (tdsError.response?.status !== 404) {
          console.warn('Error fetching TDS details:', tdsError);
        }
        setTdsDetails(null);
      }
    } catch (err) {
      console.error('Error refreshing voucher data:', err);
      setError(err.message || 'Failed to refresh voucher data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update e-invoice status
  const updateEInvoiceStatus = useCallback((status) => {
    setEInvoiceStatus((prev) => ({
      ...prev,
      ...status,
    }));
  }, []);

  // Update e-way bill status
  const updateEWayBillStatus = useCallback((status) => {
    setEWayBillStatus((prev) => ({
      ...prev,
      ...status,
    }));
  }, []);

  // Update TDS details
  const updateTdsDetails = useCallback((details) => {
    setTdsDetails((prev) => ({
      ...prev,
      ...details,
    }));
  }, []);

  // Clear all voucher data
  const clearVoucherData = useCallback(() => {
    setVoucher(null);
    setEInvoiceStatus(null);
    setEWayBillStatus(null);
    setTdsDetails(null);
    setError(null);
  }, []);

  const value = {
    // State
    voucher,
    eInvoiceStatus,
    eWayBillStatus,
    tdsDetails,
    loading,
    error,
    // Actions
    updateVoucher,
    refreshVoucherData,
    updateEInvoiceStatus,
    updateEWayBillStatus,
    updateTdsDetails,
    clearVoucherData,
  };

  return (
    <VoucherContext.Provider value={value}>
      {children}
    </VoucherContext.Provider>
  );
};
