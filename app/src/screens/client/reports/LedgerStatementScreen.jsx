import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import TopBar from '../../../components/navigation/TopBar';
import Dropdown from '../../../components/ui/Dropdown';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reportsAPI, accountingAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { FONT_STYLES } from '../../../utils/fonts';
import TableSkeleton from '../../../components/ui/skeletons/TableSkeleton';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getFirstDayOfMonth = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
};

export default function LedgerStatementScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState('');
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getCurrentDate());

  const handleMenuPress = () => {
    openDrawer();
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      const response = await accountingAPI.ledgers.list({ limit: 100 });
      const data = response.data?.data || response.data || [];
      setLedgers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load ledgers'
      });
    }
  };

  const fetchStatement = useCallback(async () => {
    if (!selectedLedger) {
      showNotification({
        type: 'error',
        title: 'Select Ledger',
        message: 'Please select a ledger to view statement'
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await reportsAPI.ledgerStatement({
        ledger_id: selectedLedger,
        from_date: fromDate,
        to_date: toDate,
      });
      setStatementData(response.data);
    } catch (error) {
      console.error('Ledger statement fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load ledger statement'
      });
      setStatementData(null);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [selectedLedger, fromDate, toDate, showNotification]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatement();
    setRefreshing(false);
  }, [fetchStatement]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const selectedLedgerData = ledgers.find(l => l.id === selectedLedger);

  return (
    <View style={styles.container}>
      <TopBar 
        title="Ledger Statement" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterCard}>
            <Text style={styles.filterTitle}>Select Ledger & Date Range</Text>
            
            <View style={styles.formGroup}>
              <Dropdown
                label="Ledger"
                value={selectedLedger}
                onSelect={setSelectedLedger}
                options={ledgers.map(ledger => ({
                  label: `${ledger.ledger_name} ${ledger.ledger_code ? `(${ledger.ledger_code})` : ''}`,
                  value: ledger.id
                }))}
                placeholder="Choose a ledger"
                searchable={true}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <ModernDatePicker
                  label="From Date"
                  value={fromDate}
                  onDateChange={setFromDate}
                  placeholder="Select from date"
                />
              </View>

              <View style={styles.dateGroup}>
                <ModernDatePicker
                  label="To Date"
                  value={toDate}
                  onDateChange={setToDate}
                  placeholder="Select to date"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.generateButton} 
              onPress={fetchStatement}
              disabled={loading || !selectedLedger}
            >
              <Ionicons name="analytics" size={16} color="white" />
              <Text style={styles.generateButtonText}>
                {loading ? 'Loading...' : 'Generate Statement'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statement Display */}
        {loading ? (
          <View style={styles.reportContainer}>
            <TableSkeleton rows={10} columns={4} />
          </View>
        ) : !statementData ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Statement Generated</Text>
            <Text style={styles.emptySubtitle}>
              Select a ledger and date range, then click "Generate Statement"
            </Text>
          </View>
        ) : (
          <>
            {/* Statement Header */}
            <View style={styles.statementHeader}>
              <Text style={styles.ledgerName}>{selectedLedgerData?.ledger_name || 'Ledger Statement'}</Text>
              <Text style={styles.dateRange} numberOfLines={1}>
                {formatDate(fromDate)} to {formatDate(toDate)}
              </Text>
            </View>

            {/* Opening Balance */}
            {statementData.opening_balance && (
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Opening Balance</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: statementData.opening_balance.type === 'Dr' ? '#dc2626' : '#059669' }
                ]}>
                  {formatCurrency(statementData.opening_balance.amount)} {statementData.opening_balance.type}
                </Text>
              </View>
            )}

            {/* Transactions Table */}
            <View style={styles.tableContainer}>
              <ScrollView 
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                style={styles.tableScrollView}
              >
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <View style={[styles.tableHeaderCell, styles.dateColumn]}>
                      <Text style={styles.tableHeaderText}>Date</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.particularColumn]}>
                      <Text style={styles.tableHeaderText}>Particulars</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.amountColumn]}>
                      <Text style={styles.tableHeaderText}>Debit</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.amountColumn]}>
                      <Text style={styles.tableHeaderText}>Credit</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.amountColumn]}>
                      <Text style={styles.tableHeaderText}>Balance</Text>
                    </View>
                  </View>

                  <ScrollView 
                    style={styles.tableBodyScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.tableBody}>
                      {statementData.transactions && statementData.transactions.length > 0 ? (
                        statementData.transactions.map((txn, index) => (
                          <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.dateColumn]}>
                              <Text style={styles.tableCellText} numberOfLines={1}>{formatDate(txn.date)}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.particularColumn]}>
                              <Text style={styles.tableCellText}>{txn.particulars || txn.narration || '-'}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.amountColumn]}>
                              <Text style={[styles.tableCellAmountText, { color: '#dc2626' }]}>
                                {(txn.debit || txn.debit_amount) > 0 ? formatCurrency(txn.debit || txn.debit_amount) : '-'}
                              </Text>
                            </View>
                            <View style={[styles.tableCell, styles.amountColumn]}>
                              <Text style={[styles.tableCellAmountText, { color: '#059669' }]}>
                                {(txn.credit || txn.credit_amount) > 0 ? formatCurrency(txn.credit || txn.credit_amount) : '-'}
                              </Text>
                            </View>
                            <View style={[styles.tableCell, styles.amountColumn]}>
                              <Text style={styles.tableCellAmountText}>
                                {formatCurrency(Math.abs(txn.balance || 0))} {txn.balance_type || ''}
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyRowText}>No transactions found</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>

            {/* Closing Balance */}
            {statementData.closing_balance && (
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Closing Balance</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: statementData.closing_balance.type === 'Dr' ? '#dc2626' : '#059669' }
                ]}>
                  {formatCurrency(statementData.closing_balance.amount)} {statementData.closing_balance.type}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateGroup: {
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  reportContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statementHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ledgerName: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4,
  },
  dateRange: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
  },
  balanceCard: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  balanceValue: {
    ...FONT_STYLES.h4,
    fontWeight: '600',
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tableScrollView: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  table: {
    backgroundColor: 'white',
    minWidth: 700,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    minHeight: 50,
  },
  tableHeaderCell: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'center',
  },
  dateColumn: {
    width: 100,
  },
  particularColumn: {
    width: 250,
  },
  amountColumn: {
    width: 120,
  },
  tableHeaderText: {
    ...FONT_STYLES.label,
    color: '#374151',
    textAlign: 'center',
  },
  tableBodyScrollView: {
    maxHeight: 400,
  },
  tableBody: {
    backgroundColor: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 45,
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    justifyContent: 'center',
  },
  tableCellText: {
    ...FONT_STYLES.bodySmall,
    color: '#374151',
    lineHeight: 18,
  },
  tableCellAmountText: {
    ...FONT_STYLES.bodySmall,
    color: '#111827',
    textAlign: 'right',
    fontWeight: '600',
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRowText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
});
