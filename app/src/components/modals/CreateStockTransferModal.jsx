import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../utils/fonts';
import { inventoryAPI, voucherAPI } from '../../lib/api';
import ModernDatePicker from '../ui/ModernDatePicker';
import Dropdown from '../ui/Dropdown';

export default function CreateStockTransferModal({ visible, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    voucher_type: 'stock_transfer',
    voucher_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    narration: '',
  });

  const [items, setItems] = useState([
    {
      inventory_item_id: '',
      item_name: '',
      quantity: '',
      unit: '',
      from_warehouse_id: '',
      to_warehouse_id: '',
      notes: '',
    },
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [warehousesRes, itemsRes] = await Promise.all([
        inventoryAPI.warehouses.list(),
        inventoryAPI.items.list({ limit: 1000 }),
      ]);

      const warehouseData = warehousesRes?.data?.data || warehousesRes?.data || [];
      const itemsData = itemsRes?.data?.data || itemsRes?.data || [];

      setWarehouses(Array.isArray(warehouseData) ? warehouseData : []);
      setInventoryItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-fill item details when item is selected
    if (field === 'inventory_item_id') {
      const selectedItem = inventoryItems.find((item) => item.id === parseInt(value));
      if (selectedItem) {
        newItems[index].item_name = selectedItem.item_name;
        newItems[index].unit = selectedItem.uqc || selectedItem.unit || '';
      }
    }

    setItems(newItems);
    if (errors[`items.${index}.${field}`]) {
      setErrors((prev) => ({ ...prev, [`items.${index}.${field}`]: null }));
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        inventory_item_id: '',
        item_name: '',
        quantity: '',
        unit: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: '',
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.voucher_date) {
      newErrors.voucher_date = 'Date is required';
    }

    items.forEach((item, index) => {
      if (!item.inventory_item_id) {
        newErrors[`items.${index}.inventory_item_id`] = 'Item is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`items.${index}.quantity`] = 'Valid quantity is required';
      }
      if (!item.from_warehouse_id) {
        newErrors[`items.${index}.from_warehouse_id`] = 'From warehouse is required';
      }
      if (!item.to_warehouse_id) {
        newErrors[`items.${index}.to_warehouse_id`] = 'To warehouse is required';
      }
      if (item.from_warehouse_id === item.to_warehouse_id) {
        newErrors[`items.${index}.to_warehouse_id`] = 'Must be different from source';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare voucher data
      const voucherData = {
        ...formData,
        items: items.map((item) => ({
          inventory_item_id: parseInt(item.inventory_item_id),
          item_name: item.item_name,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          from_warehouse_id: parseInt(item.from_warehouse_id),
          to_warehouse_id: parseInt(item.to_warehouse_id),
          notes: item.notes,
          rate: 0, // Stock transfers don't have a rate
          amount: 0, // Stock transfers don't have an amount
        })),
      };

      await voucherAPI.create(voucherData);

      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (error) {
      console.error('Error creating stock transfer:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create stock transfer' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      voucher_type: 'stock_transfer',
      voucher_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      narration: '',
    });
    setItems([
      {
        inventory_item_id: '',
        item_name: '',
        quantity: '',
        unit: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: '',
      },
    ]);
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Stock Transfer</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3e60ab" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Voucher Date */}
            <View style={styles.formGroup}>
              <ModernDatePicker
                label="Transfer Date"
                value={formData.voucher_date}
                onDateChange={(date) => handleInputChange('voucher_date', date)}
                placeholder="Select transfer date"
                error={!!errors.voucher_date}
              />
              {errors.voucher_date && <Text style={styles.errorText}>{errors.voucher_date}</Text>}
            </View>

            {/* Narration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes / Narration</Text>
              <TextInput
                style={[styles.textArea]}
                value={formData.narration}
                onChangeText={(value) => handleInputChange('narration', value)}
                placeholder="Enter any additional notes..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Items Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transfer Items</Text>
                <TouchableOpacity style={styles.addButton} onPress={addItem}>
                  <Ionicons name="add-circle" size={20} color="#3e60ab" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>Item {index + 1}</Text>
                    {items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(index)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Inventory Item */}
                  <Dropdown
                    label="Inventory Item"
                    placeholder="Select Item"
                    value={item.inventory_item_id}
                    onSelect={(value) => handleItemChange(index, 'inventory_item_id', value)}
                    options={inventoryItems.map((invItem) => ({
                      label: `${invItem.item_name} (${invItem.item_code || 'N/A'})`,
                      value: invItem.id,
                    }))}
                    error={errors[`items.${index}.inventory_item_id`]}
                    required
                  />

                  {/* Quantity */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Quantity <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, errors[`items.${index}.quantity`] && styles.inputError]}
                      value={item.quantity}
                      onChangeText={(value) => handleItemChange(index, 'quantity', value)}
                      placeholder="Enter quantity"
                      keyboardType="numeric"
                    />
                    {errors[`items.${index}.quantity`] && (
                      <Text style={styles.errorText}>{errors[`items.${index}.quantity`]}</Text>
                    )}
                  </View>

                  {/* From Warehouse */}
                  <Dropdown
                    label="From Warehouse"
                    placeholder="Select Warehouse"
                    value={item.from_warehouse_id}
                    onSelect={(value) => handleItemChange(index, 'from_warehouse_id', value)}
                    options={warehouses.map((warehouse) => ({
                      label: `${warehouse.warehouse_name} (${warehouse.warehouse_code || 'N/A'})`,
                      value: warehouse.id,
                    }))}
                    error={errors[`items.${index}.from_warehouse_id`]}
                    required
                  />

                  {/* To Warehouse */}
                  <Dropdown
                    label="To Warehouse"
                    placeholder="Select Warehouse"
                    value={item.to_warehouse_id}
                    onSelect={(value) => handleItemChange(index, 'to_warehouse_id', value)}
                    options={warehouses.map((warehouse) => ({
                      label: `${warehouse.warehouse_name} (${warehouse.warehouse_code || 'N/A'})`,
                      value: warehouse.id,
                    }))}
                    error={errors[`items.${index}.to_warehouse_id`]}
                    required
                  />

                  {/* Item Notes */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Item Notes</Text>
                    <TextInput
                      style={styles.input}
                      value={item.notes}
                      onChangeText={(value) => handleItemChange(index, 'notes', value)}
                      placeholder="Enter notes for this item..."
                    />
                  </View>
                </View>
              ))}
            </View>

            {errors.submit && (
              <View style={styles.submitError}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.submitErrorText}>{errors.submit}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Footer Actions */}
        {!loadingData && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Create Transfer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
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
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  textArea: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    ...FONT_STYLES.caption,
    color: '#ef4444',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  submitError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  submitErrorText: {
    ...FONT_STYLES.label,
    color: '#ef4444',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
    gap: 8,
  },
  submitButtonText: {
    ...FONT_STYLES.label,
    color: 'white',
  },
});
