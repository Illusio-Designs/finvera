import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reportsAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import { FONT_STYLES } from '../../../utils/fonts';
import TableSkeleton from '../../../components/ui/skeletons/TableSkeleton';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function ReceivablesScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [receivablesData, setReceivablesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [asOnDate, setAsOnDate] = useState(getCurrentDate());

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchReceivables = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await reportsAPI.receivables({ 
        as_on_date: asOnDate,
        include_zero_balance: false
      });
      setReceivablesData(response.data);
    } catch (error) {
      console.error('Receivables fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load receivables report'
      });
      setReceivablesData(null);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [asOnDate, showNotification]);

  const handleAsOnDateChange = (date) => {
    setAsOnDate(date);
  };

  const formatDateToDDMMYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReceivables();
    setRefreshing(false);
  }, [fetchReceivables]);

  const generatePDF = async () => {
    if (!receivablesData) {
      showNotification({
        type: 'error',
        title: 'No Data',
        message: 'No receivables data available to export'
      });
      return;
    }

    try {
      const htmlContent = generateReceivablesHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receivables Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        showNotification({
          type: 'success',
          title: 'PDF Generated',
          message: 'PDF saved successfully'
        });
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate PDF'
      });
    }
  };

  const generateReceivablesHTML = () => {
    const { receivables, summary, as_on_date } = receivablesData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receivables Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            font-size: 12px; 
            background-color: #f0f8f0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            background-color: #2d5a2d;
            color: white;
            padding: 10px;
            font-weight: bold;
          }
          .company-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .report-title { 
            font-size: 14px; 
            font-weight: bold; 
          }
          .summary-box {
            background-color: #e8f5e8;
            padding: 15px;
            margin-bottom: 20px;
            border: 2px solid #2d5a2d;
            border-radius: 5px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .tally-table { 
            width: 100%; 
            border-collapse: collapse; 
            background-color: #f0f8f0;
            border: 2px solid #2d5a2d;
          }
          .tally-table th { 
            background-color: #2d5a2d; 
            color: white; 
            font-weight: bold; 
            text-align: left; 
            padding: 8px;
            border: 1px solid #2d5a2d;
          }
          .tally-table td { 
            padding: 6px 8px; 
            border: 1px solid #2d5a2d;
            vertical-align: top;
          }
          .amount { 
            text-align: right; 
            font-family: monospace;
          }
          .total-row { 
            font-weight: bold; 
            background-color: #e8f5e8;
            border-top: 2px solid #2d5a2d;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Company Name</div>
          <div class="report-title">Receivables Report (Sundry Debtors)</div>
          <div style="font-size: 12px;">As on ${formatDateToDDMMYY(as_on_date)}</div>
        </div>
        
        <div class="summary-box">
          <div class="summary-item">
            <span><strong>Total Customers:</strong></span>
            <span>${summary?.total_customers || 0}</span>
          </div>
          <div class="summary-item">
            <span><strong>Total Receivable:</strong></span>
            <span>${formatCurrency(summary?.total_receivable || 0)}</span>
          </div>
          <div class="summary-item">
            <span><strong>Average per Customer:</strong></span>
            <span>${formatCurrency(summary?.average_receivable || 0)}</span>
          </div>
        </div>
        
        <table class="tally-table">
          <thead>
            <tr>
              <th style="width: 60%;">Customer Name</th>
              <th style="width: 40%;">Amount Receivable</th>
            </tr>
          </thead>
          <tbody>
            ${generateReceivablesRows(receivables)}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="amount"><strong>${formatCurrency(summary?.total_receivable || 0)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateReceivablesRows = (receivables) => {
    if (!receivables || receivables.length === 0) return '<tr><td colspan="2" style="text-align: center;">No receivables found</td></tr>';
    
    let rows = '';
    receivables.forEach(item => {
      rows += `
        <tr>
          <td>${item.ledger_name}</td>
          <td class="amount">${formatCurrency(item.closing_balance)}</td>
        </tr>
      `;
    });
    
    return rows;
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Receivables Report" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerActions}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.exportButton} onPress={generatePDF}>
              <Ionicons name="download" size={16} color="white" />
              <Text style={styles.exportButtonText}>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color="#3e60ab" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerRow}>
            <View style={styles.datePickerContainer}>
              <ModernDatePicker
                label="As On Date"
                value={asOnDate}
                onDateChange={handleAsOnDateChange}
                placeholder="Select date"
              />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.reportContainer}>
            <TableSkeleton rows={10} columns={2} />
          </View>
        ) : !receivablesData ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>
              No receivables data available for the selected date
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Receivables Report</Text>
              <Text style={styles.reportSubtitle}>Sundry Debtors (Accounts Receivable)</Text>
              <Text style={styles.reportDate}>As on {formatDateToDDMMYY(receivablesData.as_on_date)}</Text>
            </View>

            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Ionicons name="people" size={24} color="#3e60ab" />
                <Text style={styles.summaryValue}>{receivablesData.summary?.total_customers || 0}</Text>
                <Text style={styles.summaryLabel}>Total Customers</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="cash" size={24} color="#059669" />
                <Text style={styles.summaryValue}>{formatCurrency(receivablesData.summary?.total_receivable || 0)}</Text>
                <Text style={styles.summaryLabel}>Total Receivable</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="stats-chart" size={24} color="#f59e0b" />
                <Text style={styles.summaryValue}>{formatCurrency(receivablesData.summary?.average_receivable || 0)}</Text>
                <Text style={styles.summaryLabel}>Average per Customer</Text>
              </View>
            </View>

            <View style={styles.tableContainer}>
              <Text style={styles.tableTitle}>Customer Balances</Text>
              <ScrollView 
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                style={styles.tableScrollView}
              >
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <View style={[styles.tableHeaderCell, styles.nameColumn]}>
                      <Text style={styles.tableHeaderText}>Customer Name</Text>
                    </View>
                    <View style={styles.tableHeaderAmount}>
                      <Text style={styles.tableHeaderText}>Amount Receivable</Text>
                    </View>
                  </View>

                  <ScrollView 
                    style={styles.tableBodyScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.tableBody}>
                      {receivablesData.receivables && receivablesData.receivables.length > 0 ? (
                        receivablesData.receivables.map((item, index) => (
                          <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.nameColumn]}>
                              <Text style={styles.tableCellText}>{item.ledger_name}</Text>
                              {item.ledger_code && (
                                <Text style={styles.detailText}>Code: {item.ledger_code}</Text>
                              )}
                            </View>
                            <View style={styles.tableCellAmount}>
                              <Text style={styles.tableCellAmountText}>
                                {formatCurrency(item.closing_balance)}
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyRowText}>No receivables found</Text>
                        </View>
                      )}
                      
                      <View style={[styles.tableRow, styles.totalRow]}>
                        <View style={[styles.tableCell, styles.nameColumn]}>
                          <Text style={styles.totalText}>Total</Text>
                        </View>
                        <View style={styles.tableCellAmount}>
                          <Text style={styles.totalAmount}>
                            {formatCurrency(receivablesData.summary?.total_receivable || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>

            {receivablesData.aging_analysis && (
              <View style={styles.agingContainer}>
                <Text style={styles.agingTitle}>Aging Analysis</Text>
                <View style={styles.agingCards}>
                  <View style={styles.agingCard}>
                    <Text style={styles.agingLabel}>Current (0-30 days)</Text>
                    <Text style={styles.agingValue}>
                      {formatCurrency(receivablesData.aging_analysis.current?.amount || 0)}
                    </Text>
                    <Text style={styles.agingCount}>
                      {receivablesData.aging_analysis.current?.count || 0} customers
                    </Text>
                  </View>
                  <View style={styles.agingCard}>
                    <Text style={styles.agingLabel}>31-60 days</Text>
                    <Text style={[styles.agingValue, { color: '#f59e0b' }]}>
                      {formatCurrency(receivablesData.aging_analysis.days_31_60?.amount || 0)}
                    </Text>
                    <Text style={styles.agingCount}>
                      {receivablesData.aging_analysis.days_31_60?.count || 0} customers
                    </Text>
                  </View>
                  <View style={styles.agingCard}>
                    <Text style={styles.agingLabel}>61-90 days</Text>
                    <Text style={[styles.agingValue, { color: '#f97316' }]}>
                      {formatCurrency(receivablesData.aging_analysis.days_61_90?.amount || 0)}
                    </Text>
                    <Text style={styles.agingCount}>
                      {receivablesData.aging_analysis.days_61_90?.count || 0} customers
                    </Text>
                  </View>
                  <View style={styles.agingCard}>
                    <Text style={styles.agingLabel}>Over 90 days</Text>
                    <Text style={[styles.agingValue, { color: '#dc2626' }]}>
                      {formatCurrency(receivablesData.aging_analysis.over_90?.amount || 0)}
                    </Text>
                    <Text style={styles.agingCount}>
                      {receivablesData.aging_analysis.over_90?.count || 0} customers
                    </Text>
                  </View>
                </View>
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
  headerActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerContainer: {
    flex: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
    gap: 8,
  },
  refreshButtonText: {
    ...FONT_STYLES.button,
    color: '#3e60ab',
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
  reportHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  reportTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  reportSubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    marginBottom: 4,
  },
  reportDate: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
  },
  reportContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'center',
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tableTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  tableScrollView: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  table: {
    backgroundColor: 'white',
    minWidth: 400,
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
  tableHeaderAmount: {
    width: 150,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameColumn: {
    width: 250,
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
  totalRow: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    borderBottomWidth: 0,
    minHeight: 55,
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    justifyContent: 'center',
  },
  tableCellAmount: {
    width: 150,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  tableCellText: {
    ...FONT_STYLES.bodySmall,
    color: '#374151',
    lineHeight: 18,
  },
  tableCellAmountText: {
    ...FONT_STYLES.bodySmall,
    color: '#059669',
    textAlign: 'right',
    fontWeight: '600',
  },
  totalText: {
    ...FONT_STYLES.label,
    color: '#111827',
  },
  totalAmount: {
    ...FONT_STYLES.label,
    color: '#111827',
    textAlign: 'right',
  },
  detailText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRowText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  agingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  agingTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  agingCards: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  agingCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  agingLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  agingValue: {
    ...FONT_STYLES.h5,
    color: '#059669',
    marginBottom: 4,
  },
  agingCount: {
    ...FONT_STYLES.captionSmall,
    color: '#9ca3af',
  },
});
