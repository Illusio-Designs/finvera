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
import { inventoryAPI } from '../../lib/api';
import ModernDatePicker from '../ui/ModernDatePicker';
import Dropdown from '../ui/Dropdown';

const ADJUSTMENT_TYPES = [
  { label: 'Increase', value: 'increase' },
  { label: 'Decrease', value: 'decrease' },
  { label: 'Damage', value: 'damage' },
  { label: 'Loss', value: 'loss' },
  { label: 'Found', value: 'found' },
];

export default function CreateStockAdjustmentModal({ visible, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    adjustment_date: new Date().toISOString().split('T')[0],
    adjustment_type: '',
    inventory_item_id: '',
    item_name: '',
    warehouse_id: '',
    quantity_adjusted: '',
    reason: '',
    notes: '',
  });

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

    // Auto-fill item details when item is selected
    if (field === 'inventory_item_id') {
      const selectedItem = inventoryItems.find((item) => item.id === parseInt(value));
      if (selectedItem) {
        setFormData((prev) => ({ ...prev, item_name: selectedItem.item_name }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.adjustment_date) {
      newErrors.adjustment_date = 'Date is required';
    }
    if (!formData.adjustment_type) {
      newErrors.adjustment_type = 'Adjustment type is required';
    }
    if (!formData.inventory_item_id) {
      newErrors.inventory_item_id = 'Item is required';
    }
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Warehouse is required';
    }
    if (!formData.quantity_adjusted || parseFloat(formData.quantity_adjusted) <= 0) {
      newErrors.quantity_adjusted = 'Valid quantity is required';
    }
    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const adjustmentData = {
        adjustment_date: formData.adjustment_date,
        adjustment_type: formData.adjustment_type,
        inventory_item_id: parseInt(formData.inventory_item_id),
        item_name: formData.item_name,
        warehouse_id: parseInt(formData.warehouse_id),
        quantity_adjusted: parseFloat(formData.quantity_adjusted),
        reason: formData.reason,
        notes: formData.notes,
      };

      await inventoryAPI.adjustments.create(adjustmentData);

      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create stock adjustment' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      adjustment_date: new Date().toISOString().split('T')[0],
      adjustment_type: '',
      inventory_item_id: '',
      item_name: '',
      warehouse_id: '',
      quantity_adjusted: '',
      reason: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Stock Adjustment</Text>
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
            {/* Adjustment Date */}
            <ModernDatePicker
              label="Adjustment Date"
              value={formData.adjustment_date}
              onDateChange={(date) => handleInputChange('adjustment_date', date)}
              placeholder="Select adjustment date"
              error={!!errors.adjustment_date}
            />
            {errors.adjustment_date && <Text style={styles.errorText}>{errors.adjustment_date}</Text>}

            {/* Adjustment Type */}
            <Dropdown
              label="Adjustment Type"
              placeholder="Select Type"
              value={formData.adjustment_type}
              onSelect={(value) => handleInputChange('adjustment_type', value)}
              options={ADJUSTMENT_TYPES}
              error={errors.adjustment_type}
              required
            />

            {/* Inventory Item */}
            <Dropdown
              label="Inventory Item"
              placeholder="Select Item"
              value={formData.inventory_item_id}
              onSelect={(value) => handleInputChange('inventory_item_id', value)}
              options={inventoryItems.map((invItem) => ({
                label: `${invItem.item_name} (${invItem.item_code || 'N/A'})`,
                value: invItem.id,
              }))}
              error={errors.inventory_item_id}
              required
            />

            {/* Warehouse */}
            <Dropdown
              label="Warehouse"
              placeholder="Select Warehouse"
              value={formData.warehouse_id}
              onSelect={(value) => handleInputChange('warehouse_id', value)}
              options={warehouses.map((warehouse) => ({
                label: `${warehouse.warehouse_name} (${warehouse.warehouse_code || 'N/A'})`,
                value: warehouse.id,
              }))}
              error={errors.warehouse_id}
              required
            />

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Quantity Adjusted <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.quantity_adjusted && styles.inputError]}
                value={formData.quantity_adjusted}
                onChangeText={(value) => handleInputChange('quantity_adjusted', value)}
                placeholder="Enter quantity"
                keyboardType="numeric"
              />
              {errors.quantity_adjusted && <Text style={styles.errorText}>{errors.quantity_adjusted}</Text>}
            </View>

            {/* Reason */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Reason <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.reason && styles.inputError]}
                value={formData.reason}
                onChangeText={(value) => handleInputChange('reason', value)}
                placeholder="Enter reason for adjustment"
              />
              {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder="Enter any additional notes..."
                multiline
                numberOfLines={3}
              />
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
                  <Text style={styles.submitButtonText}>Create Adjustment</Text>
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
