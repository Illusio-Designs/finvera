import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voucherAPI } from '../../../lib/api';

export default function PurchaseInvoiceScreen({ navigation, route }) {
  const { voucherId } = route.params || {};
  const isEdit = !!voucherId;

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    supplierGstin: '',
    items: [
      {
        id: 1,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        gstRate: 18,
        gstAmount: 0,
        total: 0,
      }
    ],
    subtotal: 0,
    totalGst: 0,
    grandTotal: 0,
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadInvoiceData();
    } else {
      generateInvoiceNumber();
    }
  }, [isEdit, voucherId]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const loadInvoiceData = async () => {
    try {
      const response = await voucherAPI.purchaseInvoice.get(voucherId);
      const invoiceData = response.data?.data || response.data;
      
      setFormData({
        invoiceNumber: invoiceData.invoiceNumber || '',
        supplierInvoiceNumber: invoiceData.supplierInvoiceNumber || '',
        date: invoiceData.date || new Date().toISOString().split('T')[0],
        supplier: invoiceData.supplier || '',
        supplierGstin: invoiceData.supplierGstin || '',
        items: invoiceData.items || [
          {
            id: 1,
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
            gstRate: 18,
            gstAmount: 0,
            total: 0,
          }
        ],
        subtotal: invoiceData.subtotal || 0,
        totalGst: invoiceData.totalGst || 0,
        grandTotal: invoiceData.grandTotal || 0,
        notes: invoiceData.notes || '',
      });
    } catch (error) {
      console.error('Error loading purchase invoice data:', error);
      Alert.alert('Error', 'Failed to load invoice data. Please check your connection.');
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `PI-${year}${month}-${random}`;
    
    setFormData(prev => ({
      ...prev,
      invoiceNumber
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    const updatedItems = formData.items.map(item => {
      const amount = item.quantity * item.rate;
      const gstAmount = (amount * item.gstRate) / 100;
      const total = amount + gstAmount;

      subtotal += amount;
      totalGst += gstAmount;

      return {
        ...item,
        amount,
        gstAmount,
        total,
      };
    });

    const grandTotal = subtotal + totalGst;

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      totalGst,
      grandTotal,
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'rate' || field === 'gstRate' ? parseFloat(value) || 0 : value,
    };

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gstRate: 18,
      gstAmount: 0,
      total: 0,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: updatedItems,
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.supplier.trim()) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }

    if (!formData.supplierInvoiceNumber.trim()) {
      Alert.alert('Error', 'Please enter supplier invoice number');
      return;
    }

    if (formData.items.some(item => !item.description.trim())) {
      Alert.alert('Error', 'Please fill in all item descriptions');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        supplierInvoiceNumber: formData.supplierInvoiceNumber,
        date: formData.date,
        supplier: formData.supplier,
        supplierGstin: formData.supplierGstin,
        items: formData.items,
        subtotal: formData.subtotal,
        totalGst: formData.totalGst,
        grandTotal: formData.grandTotal,
        notes: formData.notes,
      };

      if (isEdit) {
        await voucherAPI.purchaseInvoice.update(voucherId, invoiceData);
      } else {
        await voucherAPI.purchaseInvoice.create(invoiceData);
      }

      Alert.alert(
        'Success',
        `Purchase invoice ${isEdit ? 'updated' : 'created'} successfully`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('Error', 'Failed to save invoice. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const ItemRow = ({ item, index }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Item {index + 1}</Text>
        {formData.items.length > 1 && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(index)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter item description"
          value={item.description}
          onChangeText={(value) => handleItemChange(index, 'description', value)}
          placeholderTextColor="#9ca3af"
          textAlignVertical="center"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            value={item.quantity.toString()}
            onChangeText={(value) => handleItemChange(index, 'quantity', value)}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
            textAlignVertical="center"
          />
        </View>

        <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
          <Text style={styles.label}>Rate (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={item.rate.toString()}
            onChangeText={(value) => handleItemChange(index, 'rate', value)}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
            textAlignVertical="center"
          />
        </View>

        <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
          <Text style={styles.label}>GST (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="18"
            value={item.gstRate.toString()}
            onChangeText={(value) => handleItemChange(index, 'gstRate', value)}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
            textAlignVertical="center"
          />
        </View>
      </View>

      <View style={styles.itemSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(item.gstAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelBold}>Total:</Text>
          <Text style={styles.summaryValueBold}>{formatCurrency(item.total)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.label}>Our Invoice Number</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.invoiceNumber}
                editable={false}
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            </View>

            <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(value) => handleInputChange('date', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                textAlignVertical="center"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Supplier Invoice Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter supplier's invoice number"
              value={formData.supplierInvoiceNumber}
              onChangeText={(value) => handleInputChange('supplierInvoiceNumber', value)}
              placeholderTextColor="#9ca3af"
              textAlignVertical="center"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Supplier *</Text>
            <TextInput
              style={styles.input}
              placeholder="Select or enter supplier name"
              value={formData.supplier}
              onChangeText={(value) => handleInputChange('supplier', value)}
              placeholderTextColor="#9ca3af"
              textAlignVertical="center"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Supplier GSTIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter supplier GSTIN (optional)"
              value={formData.supplierGstin}
              onChangeText={(value) => handleInputChange('supplierGstin', value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={15}
              placeholderTextColor="#9ca3af"
              textAlignVertical="center"
            />
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <Ionicons name="add" size={20} color="#3e60ab" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {formData.items.map((item, index) => (
            <ItemRow key={item.id} item={item} index={index} />
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(formData.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total GST:</Text>
              <Text style={styles.totalValue}>{formatCurrency(formData.totalGst)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(formData.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional notes..."
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3e60ab',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Agency',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3e60ab',
    borderRadius: 6,
  },
  addItemText: {
    color: '#3e60ab',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Agency',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#111827',
    fontFamily: 'Agency',
    textAlignVertical: 'center',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  itemRow: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  removeButton: {
    padding: 4,
  },
  itemSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Agency',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  totalContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  totalValue: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  bottomPadding: {
    height: 50,
  },
});