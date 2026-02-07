import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI, gstAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import { FONT_STYLES } from '../../utils/fonts';

export default function CreateInventoryItemModal({ 
  visible, 
  onClose, 
  onItemCreated,
  editData = null,
  isEdit = false,
  title
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_description: '',
    hsn_sac_code: '',
    unit: 'PCS',
    rate: 0,
    gst_rate: 18,
    opening_stock: 0,
    minimum_stock: 0,
    category: '',
    brand: '',
    barcode: '',
    is_service: false
  });

  const [loading, setLoading] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showGSTModal, setShowGSTModal] = useState(false);

  // Load edit data when modal opens in edit mode
  useEffect(() => {
    if (visible && isEdit && editData) {
      setFormData({
        item_code: editData.item_code || '',
        item_name: editData.item_name || '',
        item_description: editData.item_description || '',
        hsn_sac_code: editData.hsn_sac_code || '',
        unit: editData.uqc || 'PCS',
        rate: editData.avg_cost || 0,
        gst_rate: editData.gst_rate || 18,
        opening_stock: editData.quantity_on_hand || 0,
        minimum_stock: 0,
        category: editData.category || '',
        brand: editData.brand || '',
        barcode: editData.barcode || '',
        is_service: editData.is_service || false
      });
    } else if (visible && !isEdit) {
      // Reset form when opening in create mode
      setFormData({
        item_code: '',
        item_name: '',
        item_description: '',
        hsn_sac_code: '',
        unit: 'PCS',
        rate: 0,
        gst_rate: 18,
        opening_stock: 0,
        minimum_stock: 0,
        category: '',
        brand: '',
        barcode: '',
        is_service: false
      });
    }
  }, [visible, isEdit, editData]);

  const units = [
    'PCS', 'KG', 'GRAM', 'LITER', 'METER', 'FEET', 'INCH', 
    'BOX', 'DOZEN', 'SET', 'PAIR', 'BUNDLE', 'PACKET'
  ];

  const gstRates = [0, 5, 12, 18, 28];

  const handleCreate = async () => {
    // Validation
    if (!formData.item_name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter item name'
      });
      return;
    }

    if (formData.rate < 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Rate cannot be negative'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        item_code: formData.item_code.trim() || null,
        item_name: formData.item_name.trim(),
        item_description: formData.item_description.trim() || formData.item_name.trim(),
        hsn_sac_code: formData.hsn_sac_code.trim() || null,
        uqc: formData.unit || null,
        avg_cost: parseFloat(formData.rate) || 0,
        gst_rate: parseFloat(formData.gst_rate) || 0,
        quantity_on_hand: parseFloat(formData.opening_stock) || 0,
        category: formData.category.trim() || null,
        brand: formData.brand.trim() || null,
        barcode: formData.barcode.trim() || null,
        is_service: formData.is_service
      };

      let response;
      if (isEdit && editData) {
        // Update existing item
        response = await inventoryAPI.items.update(editData.id, payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Inventory item updated successfully'
        });
      } else {
        // Create new item
        response = await inventoryAPI.items.create(payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Inventory item created successfully'
        });
      }

      const newItem = response.data?.data || response.data;

      // Reset form
      setFormData({
        item_code: '',
        item_name: '',
        item_description: '',
        hsn_sac_code: '',
        unit: 'PCS',
        rate: 0,
        gst_rate: 18,
        opening_stock: 0,
        minimum_stock: 0,
        category: '',
        brand: '',
        barcode: '',
        is_service: false
      });

      // Callback with new/updated item
      if (onItemCreated) {
        onItemCreated(newItem);
      }

      onClose();
    } catch (error) {
      console.error('Create/Update item error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} inventory item`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnitSelect = (unit) => {
    setFormData(prev => ({ ...prev, unit }));
    setShowUnitModal(false);
  };

  const handleGSTSelect = (rate) => {
    setFormData(prev => ({ ...prev, gst_rate: rate }));
    setShowGSTModal(false);
  };

  const renderUnitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleUnitSelect(item)}
    >
      <Text style={styles.modalItemName}>{item}</Text>
      {formData.unit === item && (
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
      )}
    </TouchableOpacity>
  );

  const renderGSTItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleGSTSelect(item)}
    >
      <Text style={styles.modalItemName}>{item}%</Text>
      {formData.gst_rate === item && (
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title || (isEdit ? 'Edit Item' : 'Create New Item')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Item Code</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.item_code}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, item_code: value }))}
                    placeholder="Enter item code (optional)"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Item Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.item_name}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, item_name: value }))}
                    placeholder="Enter item name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.item_description}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, item_description: value }))}
                    placeholder="Enter item description (optional)"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>HSN Code</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.hsn_sac_code}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, hsn_sac_code: value }))}
                      placeholder="Enter HSN code"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => setShowUnitModal(true)}
                    >
                      <Text style={styles.inputText}>{formData.unit}</Text>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.category}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      placeholder="Enter category"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Brand</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.brand}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                      placeholder="Enter brand"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Barcode</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.barcode}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, barcode: value }))}
                    placeholder="Enter barcode (optional)"
                  />
                </View>
              </View>

              {/* Pricing Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pricing & Tax</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rate (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.rate.toString()}
                      onChangeText={(value) => setFormData(prev => ({ 
                        ...prev, 
                        rate: parseFloat(value) || 0 
                      }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>GST Rate</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => setShowGSTModal(true)}
                    >
                      <Text style={styles.inputText}>{formData.gst_rate}%</Text>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Stock Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Stock Information</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Opening Stock</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.opening_stock.toString()}
                      onChangeText={(value) => setFormData(prev => ({ 
                        ...prev, 
                        opening_stock: parseFloat(value) || 0 
                      }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Minimum Stock</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.minimum_stock.toString()}
                      onChangeText={(value) => setFormData(prev => ({ 
                        ...prev, 
                        minimum_stock: parseFloat(value) || 0 
                      }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Service Toggle */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setFormData(prev => ({ ...prev, is_service: !prev.is_service }))}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>Service Item</Text>
                    <Text style={styles.toggleSubtitle}>
                      Mark this as a service instead of a physical product
                    </Text>
                  </View>
                  <View style={[styles.toggle, formData.is_service && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, formData.is_service && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.actionButtonText, { color: '#6b7280' }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreate}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Item' : 'Create Item')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Unit Selection Modal */}
      <Modal
        visible={showUnitModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Unit</Text>
            <TouchableOpacity 
              onPress={() => setShowUnitModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={units}
            renderItem={renderUnitItem}
            keyExtractor={(item) => item}
            style={styles.modalList}
          />
        </View>
      </Modal>

      {/* GST Rate Selection Modal */}
      <Modal
        visible={showGSTModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGSTModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select GST Rate</Text>
            <TouchableOpacity 
              onPress={() => setShowGSTModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={gstRates}
            renderItem={renderGSTItem}
            keyExtractor={(item) => item.toString()}
            style={styles.modalList}
          />
        </View>
      </Modal>
    </>
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    ...FONT_STYLES.h5,
    color: '#111827',
    backgroundColor: 'white',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    ...FONT_STYLES.h5,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  toggleSubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3e60ab',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  createButton: {
    backgroundColor: '#3e60ab',
  },
  actionButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalItemName: {
    ...FONT_STYLES.h5,
    fontWeight: '500',
    color: '#111827',
  },
});