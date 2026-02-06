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

export default function ProfitLossScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [profitLossData, setProfitLossData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchProfitLoss = useCallback(async () => {
    try {
      const response = await reportsAPI.profitLoss({ 
        from_date: getFirstDayOfMonth(),
        to_date: getCurrentDate()
      });
      setProfitLossData(response.data);
    } catch (error) {
      console.error('Profit & Loss fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profit & loss statement'
      });
      setProfitLossData(null);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [fetchProfitLoss]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfitLoss();
    setRefreshing(false);
  }, [fetchProfitLoss]);

  const generatePDF = async () => {
    if (!profitLossData) {
      showNotification({
        type: 'error',
        title: 'No Data',
        message: 'No profit & loss data available to export'
      });
      return;
    }

    try {
      const htmlContent = generatePLHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Profit & Loss Statement',
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

  const formatDateToDDMMYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const generatePLHTML = () => {
    const { expenses_and_costs, income_and_revenue, totals, period } = profitLossData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Profit & Loss Statement</title>
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
          .net-profit { 
            color: #059669; 
            font-weight: bold;
          }
          .net-loss { 
            color: #dc2626; 
            font-weight: bold;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Tenant Company Name</div>
          <div class="report-title">Profit & Loss Statement</div>
          <div style="font-size: 12px;">For the period ${formatDateToDDMMYY(period?.from_date)} to ${formatDateToDDMMYY(period?.to_date)}</div>
        </div>
        
        <table class="tally-table">
          <thead>
            <tr>
              <th style="width: 40%;">Expenses & Costs</th>
              <th style="width: 10%;">Amount</th>
              <th style="width: 40%;">Income & Revenue</th>
              <th style="width: 10%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${generateProfitLossRows(expenses_and_costs, income_and_revenue)}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="amount"><strong>${formatCurrency(totals?.total_left_side || 0)}</strong></td>
              <td><strong>Total</strong></td>
              <td class="amount"><strong>${formatCurrency(totals?.total_right_side || 0)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated on: ${formatDateToDDMMYY(new Date().toISOString().split('T')[0])}</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateProfitLossRows = (expensesData, incomeData) => {
    if (!expensesData || !incomeData) return '';
    
    const expenses = [];
    const income = [];

    // Build expenses array
    if (expensesData.opening_stock?.amount > 0) {
      expenses.push({ name: 'Opening Stock', amount: expensesData.opening_stock.amount });
    }
    if (expensesData.purchase_accounts?.total > 0) {
      expenses.push({ name: 'Purchase Accounts', amount: expensesData.purchase_accounts.total });
    }
    if (expensesData.direct_expenses?.total > 0) {
      expenses.push({ name: 'Direct Expenses', amount: expensesData.direct_expenses.total });
    }
    if (expensesData.indirect_expenses?.total > 0) {
      expenses.push({ name: 'Indirect Expenses', amount: expensesData.indirect_expenses.total });
    }
    
    // Add round off expenses specifically for PDF
    if (expensesData.indirect_expenses?.accounts) {
      const roundOffExpenses = expensesData.indirect_expenses.accounts.filter(acc => acc.is_round_off && acc.note?.includes('expense'));
      roundOffExpenses.forEach(roundOff => {
        expenses.push({ 
          name: '<em style="color: #f59e0b;">Round Off (Expense)</em>', 
          amount: roundOff.amount,
          isRoundOff: true
        });
      });
    }
    
    if (expensesData.net_profit > 0) {
      expenses.push({ 
        name: '<strong class="net-profit">Net Profit</strong>', 
        amount: expensesData.net_profit,
        isNetProfit: true,
        isProfit: true
      });
    }

    // Build income array
    if (incomeData.sales_accounts?.total > 0) {
      income.push({ name: 'Sales Accounts', amount: incomeData.sales_accounts.total });
    }
    if (incomeData.closing_stock?.amount > 0) {
      income.push({ name: 'Closing Stock', amount: incomeData.closing_stock.amount });
    }
    if (incomeData.indirect_incomes?.total > 0) {
      income.push({ name: 'Indirect Incomes', amount: incomeData.indirect_incomes.total });
    }
    
    // Add round off incomes specifically for PDF
    if (incomeData.indirect_incomes?.accounts) {
      const roundOffIncomes = incomeData.indirect_incomes.accounts.filter(acc => acc.is_round_off && acc.note?.includes('income'));
      roundOffIncomes.forEach(roundOff => {
        income.push({ 
          name: '<em style="color: #f59e0b;">Round Off (Income)</em>', 
          amount: roundOff.amount,
          isRoundOff: true
        });
      });
    }
    
    if (expensesData.net_profit < 0) {
      income.push({ 
        name: '<strong class="net-loss">Net Loss</strong>', 
        amount: Math.abs(expensesData.net_profit),
        isNetProfit: true,
        isProfit: false
      });
    }

    const maxRows = Math.max(expenses.length, income.length);
    let rows = '';
    
    for (let i = 0; i < maxRows; i++) {
      const expense = expenses[i];
      const incomeItem = income[i];
      
      rows += `
        <tr>
          <td>${expense ? expense.name : ''}</td>
          <td class="amount">${expense ? formatCurrency(expense.amount) : ''}</td>
          <td>${incomeItem ? incomeItem.name : ''}</td>
          <td class="amount">${incomeItem ? formatCurrency(incomeItem.amount) : ''}</td>
        </tr>
      `;
    }
    
    return rows;
  };

  const renderProfitLossRows = (profitLossData) => {
    if (!profitLossData) return [];
    
    const { trading_account, sales_revenue, closing_stock, profit_loss_account } = profitLossData;
    
    const expenses = [];
    const income = [];

    // TRADING ACCOUNT - Left Side (Expenses & Costs)
    if (trading_account?.opening_stock?.amount > 0) {
      expenses.push({ name: 'Opening Stock', amount: trading_account.opening_stock.amount, section: 'Trading Account' });
    }
    if (trading_account?.purchases?.net_purchases > 0) {
      expenses.push({ 
        name: `Purchases (Net)`, 
        amount: trading_account.purchases.net_purchases,
        section: 'Trading Account',
        detail: `Gross: ₹${trading_account.purchases.gross_purchases || 0} - Returns: ₹${trading_account.purchases.purchase_returns || 0}`
      });
    }
    if (trading_account?.direct_expenses?.total > 0) {
      expenses.push({ 
        name: 'Direct Expenses', 
        amount: trading_account.direct_expenses.total,
        section: 'Trading Account',
        detail: trading_account.direct_expenses.description
      });
    }
    if (trading_account?.gross_profit > 0) {
      expenses.push({ 
        name: 'Gross Profit c/d', 
        amount: trading_account.gross_profit,
        section: 'Trading Account',
        isGrossProfit: true
      });
    }
    
    // P&L ACCOUNT - Left Side (Expenses)
    if (profit_loss_account?.gross_profit_brought_forward > 0) {
      expenses.push({ 
        name: 'Gross Profit b/d', 
        amount: profit_loss_account.gross_profit_brought_forward,
        section: 'P&L Account',
        isGrossProfit: true
      });
    }
    if (profit_loss_account?.indirect_expenses?.total > 0) {
      expenses.push({ 
        name: 'Indirect Expenses', 
        amount: profit_loss_account.indirect_expenses.total,
        section: 'P&L Account',
        detail: profit_loss_account.indirect_expenses.description
      });
    }
    
    // Add round off expenses specifically
    if (profit_loss_account?.indirect_expenses?.accounts) {
      const roundOffExpenses = profit_loss_account.indirect_expenses.accounts.filter(acc => acc.is_round_off && acc.note?.includes('expense'));
      roundOffExpenses.forEach(roundOff => {
        expenses.push({ 
          name: 'Round Off (Expense)', 
          amount: roundOff.amount,
          section: 'P&L Account',
          isRoundOff: true
        });
      });
    }
    
    if (profitLossData.totals?.net_profit > 0) {
      expenses.push({ 
        name: 'Net Profit', 
        amount: profitLossData.totals.net_profit,
        section: 'P&L Account',
        isNetProfit: true,
        isProfit: true
      });
    }

    // TRADING ACCOUNT - Right Side (Sales & Revenue)
    if (sales_revenue?.net_sales > 0) {
      income.push({ 
        name: `Sales (Net)`, 
        amount: sales_revenue.net_sales,
        section: 'Trading Account',
        detail: `Gross: ₹${sales_revenue.gross_sales || 0} - Returns: ₹${sales_revenue.sales_returns || 0}`
      });
    }
    if (closing_stock?.amount > 0) {
      income.push({ name: 'Closing Stock', amount: closing_stock.amount, section: 'Trading Account' });
    }
    if (trading_account?.gross_profit < 0) {
      income.push({ 
        name: 'Gross Loss c/d', 
        amount: Math.abs(trading_account.gross_profit),
        section: 'Trading Account',
        isGrossLoss: true
      });
    }
    
    // P&L ACCOUNT - Right Side (Other Incomes)
    if (profit_loss_account?.gross_profit_brought_forward < 0) {
      income.push({ 
        name: 'Gross Loss b/d', 
        amount: Math.abs(profit_loss_account.gross_profit_brought_forward),
        section: 'P&L Account',
        isGrossLoss: true
      });
    }
    if (profit_loss_account?.other_incomes?.total > 0) {
      income.push({ 
        name: 'Other Incomes', 
        amount: profit_loss_account.other_incomes.total,
        section: 'P&L Account',
        detail: profit_loss_account.other_incomes.description
      });
    }
    
    // Add round off incomes specifically
    if (profit_loss_account?.other_incomes?.accounts) {
      const roundOffIncomes = profit_loss_account.other_incomes.accounts.filter(acc => acc.is_round_off && acc.note?.includes('income'));
      roundOffIncomes.forEach(roundOff => {
        income.push({ 
          name: 'Round Off (Income)', 
          amount: roundOff.amount,
          section: 'P&L Account',
          isRoundOff: true
        });
      });
    }
    
    if (profitLossData.totals?.net_profit < 0) {
      income.push({ 
        name: 'Net Loss', 
        amount: Math.abs(profitLossData.totals.net_profit),
        section: 'P&L Account',
        isNetProfit: true,
        isProfit: false
      });
    }

    const maxRows = Math.max(expenses.length, income.length);
    const rows = [];

    // Track current sections for better section header display
    let currentExpenseSection = null;
    let currentIncomeSection = null;

    for (let i = 0; i < maxRows; i++) {
      const expense = expenses[i];
      const incomeItem = income[i];

      // Check if we need section headers
      const needExpenseSectionHeader = expense?.section && expense.section !== currentExpenseSection;
      const needIncomeSectionHeader = incomeItem?.section && incomeItem.section !== currentIncomeSection;

      if (needExpenseSectionHeader) currentExpenseSection = expense.section;
      if (needIncomeSectionHeader) currentIncomeSection = incomeItem.section;

      rows.push(
        <View key={i} style={[
          styles.tableRow,
          // Add section separator styling for better visual separation
          (needExpenseSectionHeader || needIncomeSectionHeader) && i > 0 && styles.sectionSeparator
        ]}>
          <View style={[styles.tableCell, styles.leftColumn]}>
            {/* Enhanced section header for expenses */}
            {needExpenseSectionHeader && (
              <View style={styles.sectionHeaderContainer}>
                <Text style={[styles.sectionHeader, styles.expenseSectionHeader]}>
                  {expense.section}
                </Text>
              </View>
            )}
            <Text style={[
              styles.tableCellText,
              expense?.isNetProfit && { 
                color: expense.isProfit ? '#059669' : '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              expense?.isGrossProfit && { 
                color: '#059669',
                fontWeight: 'bold',
                fontSize: 14
              },
              expense?.isGrossLoss && { 
                color: '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              expense?.isRoundOff && { 
                color: '#f59e0b',
                fontStyle: 'italic',
                backgroundColor: '#fef3c7',
                paddingHorizontal: 3,
                paddingVertical: 1,
                borderRadius: 3,
                fontSize: 12
              }
            ]}>
              {expense ? expense.name : ''}
            </Text>
            {expense?.detail && (
              <Text style={styles.detailText}>{expense.detail}</Text>
            )}
          </View>
          <View style={styles.tableCellAmount}>
            <Text style={[
              styles.tableCellAmountText,
              expense?.isNetProfit && { 
                color: expense.isProfit ? '#059669' : '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              expense?.isGrossProfit && { 
                color: '#059669',
                fontWeight: 'bold',
                fontSize: 14
              },
              expense?.isGrossLoss && { 
                color: '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              expense?.isRoundOff && { 
                color: '#f59e0b',
                fontWeight: 'bold',
                backgroundColor: '#fef3c7',
                paddingHorizontal: 3,
                paddingVertical: 1,
                borderRadius: 3,
                fontSize: 12
              }
            ]}>
              {expense ? formatCurrency(expense.amount) : ''}
            </Text>
          </View>
          <View style={[styles.tableCell, styles.rightColumn]}>
            {/* Enhanced section header for income */}
            {needIncomeSectionHeader && (
              <View style={styles.sectionHeaderContainer}>
                <Text style={[styles.sectionHeader, styles.incomeSectionHeader]}>
                  {incomeItem.section}
                </Text>
              </View>
            )}
            <Text style={[
              styles.tableCellText,
              incomeItem?.isNetProfit && { 
                color: incomeItem.isProfit ? '#059669' : '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              incomeItem?.isGrossProfit && { 
                color: '#059669',
                fontWeight: 'bold',
                fontSize: 14
              },
              incomeItem?.isGrossLoss && { 
                color: '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              incomeItem?.isRoundOff && { 
                color: '#f59e0b',
                fontStyle: 'italic',
                backgroundColor: '#fef3c7',
                paddingHorizontal: 3,
                paddingVertical: 1,
                borderRadius: 3,
                fontSize: 12
              }
            ]}>
              {incomeItem ? incomeItem.name : ''}
            </Text>
            {incomeItem?.detail && (
              <Text style={styles.detailText}>{incomeItem.detail}</Text>
            )}
          </View>
          <View style={styles.tableCellAmount}>
            <Text style={[
              styles.tableCellAmountText,
              incomeItem?.isNetProfit && { 
                color: incomeItem.isProfit ? '#059669' : '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              incomeItem?.isGrossProfit && { 
                color: '#059669',
                fontWeight: 'bold',
                fontSize: 14
              },
              incomeItem?.isGrossLoss && { 
                color: '#dc2626',
                fontWeight: 'bold',
                fontSize: 14
              },
              incomeItem?.isRoundOff && { 
                color: '#f59e0b',
                fontWeight: 'bold',
                backgroundColor: '#fef3c7',
                paddingHorizontal: 3,
                paddingVertical: 1,
                borderRadius: 3,
                fontSize: 12
              }
            ]}>
              {incomeItem ? formatCurrency(incomeItem.amount) : ''}
            </Text>
          </View>
        </View>
      );
    }

    return rows;
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Profit & Loss" 
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
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profit & loss...</Text>
          </View>
        ) : !profitLossData ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>
              Profit & loss data is not available for the selected period
            </Text>
          </View>
        ) : (
          <>
            {/* Clean Report Header */}
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Trading & Profit & Loss Account</Text>
              <Text style={styles.reportDate}>
                For the period {formatDateToDDMMYY(profitLossData.period?.from_date)} to {formatDateToDDMMYY(profitLossData.period?.to_date)}
              </Text>
              <View style={styles.reportSummary}>
                <Text style={styles.summaryText}>
                  Net Result: <Text style={[
                    styles.summaryAmount, 
                    { color: (profitLossData.totals?.net_profit || 0) >= 0 ? '#059669' : '#dc2626' }
                  ]}>
                    {(profitLossData.totals?.net_profit || 0) >= 0 ? 'Profit' : 'Loss'} {formatCurrency(Math.abs(profitLossData.totals?.net_profit || 0))}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Scrollable Tally-Style P&L Table */}
            <View style={styles.profitLossContainer}>
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
                      <Text style={styles.tableHeaderText}>Expenses & Costs</Text>
                    </View>
                    <View style={styles.tableHeaderAmount}>
                      <Text style={styles.tableHeaderText}>Amount</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.rightColumn]}>
                      <Text style={styles.tableHeaderText}>Sales & Income</Text>
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
                      {renderProfitLossRows(profitLossData)}
                      
                      {/* Total Row */}
                      <View style={[styles.tableRow, styles.totalRow]}>
                        <View style={[styles.tableCell, styles.leftColumn]}>
                          <Text style={styles.totalText}>Total</Text>
                        </View>
                        <View style={styles.tableCellAmount}>
                          <Text style={styles.totalAmount}>
                            {formatCurrency(profitLossData.totals?.total_left_side || 0)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.rightColumn]}>
                          <Text style={styles.totalText}>Total</Text>
                        </View>
                        <View style={styles.tableCellAmount}>
                          <Text style={styles.totalAmount}>
                            {formatCurrency(profitLossData.totals?.total_right_side || 0)}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  },

  // Tally-Style Table - Fixed and Scrollable
  profitLossContainer: {
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

  // Debug Information
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3e60ab',
  },
  debugTitle: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 4,
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
  expenseSectionHeader: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#991b1b',
  },
  incomeSectionHeader: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534',
  },

  // Report Summary
  reportSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryText: {
    ...FONT_STYLES.label,
    color: '#374151',
    textAlign: 'center',
  },
  summaryAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});