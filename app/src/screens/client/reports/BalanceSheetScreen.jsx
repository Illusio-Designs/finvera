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

export default function BalanceSheetScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchBalanceSheet = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await reportsAPI.balanceSheet({ 
        as_on_date: getCurrentDate()
      });
      setBalanceSheetData(response.data);
    } catch (error) {
      console.error('Balance sheet fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load balance sheet'
      });
      setBalanceSheetData(null);
    } finally {
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [showNotification]);

  const formatDateToDDMMYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [fetchBalanceSheet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBalanceSheet();
    setRefreshing(false);
  }, [fetchBalanceSheet]);

  const generatePDF = async () => {
    if (!balanceSheetData) {
      showNotification({
        type: 'error',
        title: 'No Data',
        message: 'No balance sheet data available to export'
      });
      return;
    }

    try {
      const htmlContent = generateBSHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Balance Sheet',
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

  const generateBSHTML = () => {
    const { balance_sheet, totals, as_on_date } = balanceSheetData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Balance Sheet</title>
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
            text-align: center; 
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
          .section-header { 
            font-weight: bold; 
            background-color: #e8f5e8;
          }
          .indent { 
            padding-left: 20px; 
            font-size: 11px;
          }
          .group-total {
            font-weight: bold;
            border-top: 1px solid #666;
            background-color: #f8fcf8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Company Name</div>
          <div class="report-title">Balance Sheet as on ${formatDateToDDMMYY(as_on_date)}</div>
        </div>
        
        <table class="tally-table">
          <thead>
            <tr>
              <th style="width: 40%;">Liabilities</th>
              <th style="width: 10%;">Amount</th>
              <th style="width: 40%;">Assets</th>
              <th style="width: 10%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${generateBalanceSheetRows(balance_sheet)}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="amount"><strong>${formatCurrency(totals?.total_liabilities || 0)}</strong></td>
              <td><strong>Total</strong></td>
              <td class="amount"><strong>${formatCurrency(totals?.total_assets || 0)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
          <p><strong>Note:</strong> This Balance Sheet follows Tally format</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateBalanceSheetRows = (balanceSheet) => {
    if (!balanceSheet) return '';
    
    const liabilities = balanceSheet.liabilities || [];
    const assets = balanceSheet.assets || [];
    const maxRows = Math.max(liabilities.length, assets.length);
    
    let rows = '';
    for (let i = 0; i < maxRows; i++) {
      const liability = liabilities[i];
      const asset = assets[i];
      
      rows += `
        <tr>
          <td>${liability ? liability.group_name : ''}</td>
          <td class="amount">${liability ? formatCurrency(liability.amount) : ''}</td>
          <td>${asset ? asset.group_name : ''}</td>
          <td class="amount">${asset ? formatCurrency(asset.amount) : ''}</td>
        </tr>
      `;
    }
    
    return rows;
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Balance Sheet" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Actions - Same as LedgersScreen */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.exportButton} onPress={generatePDF}>
            <Ionicons name="download" size={16} color="white" />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={16} color="#3e60ab" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.balanceSheetContainer}>
            <TableSkeleton rows={10} columns={4} />
          </View>
        ) : !balanceSheetData ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>
              Balance sheet data is not available for the selected period
            </Text>
          </View>
        ) : (
          <>
            {/* Clean Report Header */}
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Balance Sheet</Text>
              <Text style={styles.reportDate}>As on {formatDateToDDMMYY(balanceSheetData.as_on_date)}</Text>
              <View style={styles.reportSummary}>
                <Text style={styles.summaryText}>
                  Total Assets: <Text style={[styles.summaryAmount, { color: '#059669' }]}>
                    {formatCurrency(balanceSheetData.totals?.total_assets || 0)}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Scrollable Balance Sheet Table */}
            <View style={styles.balanceSheetContainer}>
              {/* Scroll Hint */}
              <View style={styles.scrollHint}>
                <Ionicons name="swap-horizontal" size={16} color="#6b7280" />
                <Text style={styles.scrollHintText}>Swipe horizontally to view full table</Text>
              </View>
              
              <ScrollView 
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                style={styles.tableScrollView}
                contentContainerStyle={styles.tableScrollContent}
              >
                <View style={styles.tallyTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={[styles.tableHeaderCell, styles.leftColumn]}>
                      <Text style={styles.tableHeaderText}>Liabilities</Text>
                    </View>
                    <View style={styles.tableHeaderAmount}>
                      <Text style={styles.tableHeaderText}>Amount</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.rightColumn]}>
                      <Text style={styles.tableHeaderText}>Assets</Text>
                    </View>
                    <View style={styles.tableHeaderAmount}>
                      <Text style={styles.tableHeaderText}>Amount</Text>
                    </View>
                  </View>

                  {/* Scrollable Table Body */}
                  <ScrollView 
                    style={styles.tableBodyScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.tableBody}>
                      {balanceSheetData.assets && balanceSheetData.liabilities_and_capital && 
                        renderBalanceSheetRows(balanceSheetData)
                      }
                      
                      {/* Total Row */}
                      <View style={[styles.tableRow, styles.totalRow]}>
                        <View style={[styles.tableCell, styles.leftColumn]}>
                          <Text style={styles.totalText}>Total</Text>
                        </View>
                        <View style={styles.tableCellAmount}>
                          <Text style={styles.totalAmount}>
                            {formatCurrency(balanceSheetData.totals?.total_liabilities || 0)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.rightColumn]}>
                          <Text style={styles.totalText}>Total</Text>
                        </View>
                        <View style={styles.tableCellAmount}>
                          <Text style={styles.totalAmount}>
                            {formatCurrency(balanceSheetData.totals?.total_assets || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>

          </>
        )}
      </ScrollView>
    </View>
  );

  function renderBalanceSheetRows(balanceSheetData) {
    if (!balanceSheetData) return [];
    
    const { assets, liabilities_and_capital, asset_details, liability_details } = balanceSheetData;
    
    const liabilities = [];
    const assetsList = [];

    // LIABILITIES SIDE - Build detailed list with individual accounts
    // Capital & Reserves
    if (liabilities_and_capital?.capital_and_reserves?.groups && liabilities_and_capital.capital_and_reserves.groups.length > 0) {
      liabilities_and_capital.capital_and_reserves.groups.forEach(group => {
        liabilities.push({
          name: group.group_name,
          amount: group.amount,
          section: 'Capital & Reserves',
          detail: group.note || ''
        });
      });
    }
    
    // Long-term Liabilities
    if (liabilities_and_capital?.long_term_liabilities?.groups && liabilities_and_capital.long_term_liabilities.groups.length > 0) {
      liabilities_and_capital.long_term_liabilities.groups.forEach(group => {
        liabilities.push({
          name: group.group_name,
          amount: group.amount,
          section: 'Long-term Liabilities'
        });
      });
    }
    
    // Current Liabilities
    if (liabilities_and_capital?.current_liabilities?.groups && liabilities_and_capital.current_liabilities.groups.length > 0) {
      liabilities_and_capital.current_liabilities.groups.forEach(group => {
        liabilities.push({
          name: group.group_name,
          amount: group.amount,
          section: 'Current Liabilities'
        });
      });
    }

    // Add detailed liability accounts from liability_details
    if (liability_details && liability_details.length > 0) {
      liability_details.forEach(detail => {
        // Only add if not already added as a group
        const existingLiability = liabilities.find(l => l.name === detail.ledger_name);
        if (!existingLiability) {
          liabilities.push({
            name: detail.ledger_name,
            amount: detail.amount,
            section: detail.category,
            detail: detail.ledger_code ? `Code: ${detail.ledger_code}` : ''
          });
        }
      });
    }

    // ASSETS SIDE - Build detailed list with individual accounts
    // Fixed Assets
    if (assets?.fixed_assets?.groups && assets.fixed_assets.groups.length > 0) {
      assets.fixed_assets.groups.forEach(group => {
        assetsList.push({
          name: group.group_name,
          amount: group.amount,
          section: 'Fixed Assets'
        });
      });
    }
    
    // Current Assets
    if (assets?.current_assets?.groups && assets.current_assets.groups.length > 0) {
      assets.current_assets.groups.forEach(group => {
        assetsList.push({
          name: group.group_name,
          amount: group.amount,
          section: 'Current Assets'
        });
      });
    }
    
    // Add detailed asset accounts from asset_details
    if (asset_details && asset_details.length > 0) {
      asset_details.forEach(detail => {
        // Only add if not already added as a group
        const existingAsset = assetsList.find(a => a.name === detail.ledger_name);
        if (!existingAsset) {
          assetsList.push({
            name: detail.ledger_name,
            amount: detail.amount,
            section: detail.category,
            detail: detail.quantity ? `Qty: ${detail.quantity} @ ₹${detail.avg_cost}` : (detail.ledger_code ? `Code: ${detail.ledger_code}` : '')
          });
        }
      });
    }
    
    // Investments
    if (assets?.investments?.groups && assets.investments.groups.length > 0) {
      assets.investments.groups.forEach(group => {
        assetsList.push({
          name: group.group_name,
          amount: group.amount,
          section: 'Investments'
        });
      });
    }

    const maxRows = Math.max(liabilities.length, assetsList.length);
    const rows = [];

    // Track current sections for better section header display
    let currentLiabilitySection = null;
    let currentAssetSection = null;

    for (let i = 0; i < maxRows; i++) {
      const liability = liabilities[i];
      const asset = assetsList[i];

      // Check if we need section headers
      const needLiabilitySectionHeader = liability?.section && liability.section !== currentLiabilitySection;
      const needAssetSectionHeader = asset?.section && asset.section !== currentAssetSection;

      if (needLiabilitySectionHeader) currentLiabilitySection = liability.section;
      if (needAssetSectionHeader) currentAssetSection = asset.section;

      rows.push(
        <View key={i} style={[
          styles.tableRow,
          // Add section separator styling for better visual separation
          (needLiabilitySectionHeader || needAssetSectionHeader) && i > 0 && styles.sectionSeparator
        ]}>
          <View style={[styles.tableCell, styles.leftColumn]}>
            {/* Enhanced section header for liabilities */}
            {needLiabilitySectionHeader && (
              <View style={styles.sectionHeaderContainer}>
                <Text style={[styles.sectionHeader, styles.liabilitySectionHeader]}>
                  {liability.section}
                </Text>
              </View>
            )}
            <Text style={styles.tableCellText}>
              {liability ? liability.name : ''}
            </Text>
            {liability?.detail && (
              <Text style={styles.detailText}>{liability.detail}</Text>
            )}
          </View>
          <View style={styles.tableCellAmount}>
            <Text style={styles.tableCellAmountText}>
              {liability ? formatCurrency(liability.amount) : ''}
            </Text>
          </View>
          <View style={[styles.tableCell, styles.rightColumn]}>
            {/* Enhanced section header for assets */}
            {needAssetSectionHeader && (
              <View style={styles.sectionHeaderContainer}>
                <Text style={[styles.sectionHeader, styles.assetSectionHeader]}>
                  {asset.section}
                </Text>
              </View>
            )}
            <Text style={styles.tableCellText}>
              {asset ? asset.name : ''}
            </Text>
            {asset?.detail && (
              <Text style={styles.detailText}>{asset.detail}</Text>
            )}
          </View>
          <View style={styles.tableCellAmount}>
            <Text style={styles.tableCellAmountText}>
              {asset ? formatCurrency(asset.amount) : ''}
            </Text>
          </View>
        </View>
      );
    }

    return rows;
  }
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
    paddingBottom: 120, // Extra padding for better scrolling
  },

  // Header Actions - Same as LedgersScreen
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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

  // Loading and Empty States - Same as LedgersScreen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
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

  // Report Header - Clean and Simple
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
  reportDate: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    marginBottom: 12,
  },
  reportSummary: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  summaryText: {
    ...FONT_STYLES.bodySmall,
    color: '#374151',
    textAlign: 'center',
  },
  summaryAmount: {
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Agency',
  },

  // Scrollable Table - Fixed and Scrollable
  balanceSheetContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    gap: 6,
  },
  scrollHintText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  tableScrollView: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tableScrollContent: {
    minWidth: '100%',
  },
  tallyTable: {
    backgroundColor: 'white',
    minWidth: 560, // Reduced width for cleaner layout (160+120+160+120)
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    minHeight: 50,
  },
  tableHeaderCell: {
    width: 160, // Adjusted width for better fit
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'center',
  },
  tableHeaderAmount: {
    width: 120, // Fixed width for amount columns
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 0, // Remove right border from last column
    borderRightColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftColumn: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  rightColumn: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
  },
  tableHeaderText: {
    ...FONT_STYLES.label,
    color: '#374151',
    textAlign: 'center',
  },
  tableBodyScrollView: {
    maxHeight: 400, // Limit height to make it scrollable
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
    width: 160, // Fixed width matching header
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    justifyContent: 'center',
  },
  tableCellAmount: {
    width: 120, // Fixed width matching header
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 0, // Remove right border from last column
    borderRightColor: '#f3f4f6',
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
    color: '#374151',
    textAlign: 'right',
    fontWeight: '500',
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

  // Section and Detail Styles - Improved for Fixed Layout
  sectionLabel: {
    ...FONT_STYLES.captionSmall,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
  },
  detailText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 12,
  },
  sectionSeparator: {
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    marginTop: 8,
    paddingTop: 8,
    backgroundColor: '#f9fafb',
  },
  sectionHeaderContainer: {
    marginBottom: 4,
    alignItems: 'center',
  },
  sectionHeader: {
    ...FONT_STYLES.labelSmall,
    color: '#374151',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  liabilitySectionHeader: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#991b1b',
  },
  assetSectionHeader: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534',
  },
});