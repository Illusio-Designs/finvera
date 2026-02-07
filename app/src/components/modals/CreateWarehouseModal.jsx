import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../../lib/api';
import { useNotification } from '../../contexts/NotificationContext';
import { FONT_STYLES } from '../../utils/fonts';
import PhoneInput from '../ui/PhoneInput';

export default function CreateWarehouseModal({ 
  visible, 
  onClose, 
  onWarehouseCreated,
  editData = null,
  isEdit = false,
  title
}) {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    warehouse_code: '',
    warehouse_name: '',
    warehouse_type: 'main',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_number: '',
    email: '',
    manager_name: '',
    capacity: '',
    is_active: true,
    is_default: false,
  });

  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const warehouseTypes = ['main', 'branch', 'transit', 'damaged', 'virtual'];

  // Load edit data when modal opens in edit mode
  useEffect(() => {
    if (visible && isEdit && editData) {
      setFormData({
        warehouse_code: editData.warehouse_code || '',
        warehouse_name: editData.warehouse_name || '',
        warehouse_type: editData.warehouse_type || 'main',
        address: editData.address || '',
        city: editData.city || '',
        state: editData.state || '',
        pincode: editData.pincode || '',
        contact_number: editData.contact_number || '',
        email: editData.email || '',
        manager_name: editData.manager_name || '',
        capacity: editData.capacity ? editData.capacity.toString() : '',
        is_active: editData.is_active !== false,
        is_default: editData.is_default || false,
      });
    } else if (visible && !isEdit) {
      // Reset form when opening in create mode
      setFormData({
        warehouse_code: '',
        warehouse_name: '',
        warehouse_type: 'main',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_number: '',
        email: '',
        manager_name: '',
        capacity: '',
        is_active: true,
        is_default: false,
      });
    }
  }, [visible, isEdit, editData]);

  const handleCreate = async () => {
    // Validation
    if (!formData.warehouse_name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter warehouse name'
      });
      return;
    }

    if (!formData.warehouse_code.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter warehouse code'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        warehouse_code: formData.warehouse_code.trim(),
        warehouse_name: formData.warehouse_name.trim(),
        warehouse_type: formData.warehouse_type,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        email: formData.email.trim() || null,
        manager_name: formData.manager_name.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_active: formData.is_active,
        is_default: formData.is_default,
      };

      let response;
      if (isEdit && editData) {
        // Update existing warehouse
        response = await inventoryAPI.warehouses.update(editData.id, payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Warehouse updated successfully'
        });
      } else {
        // Create new warehouse
        response = await inventoryAPI.warehouses.create(payload);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Warehouse created successfully'
        });
      }

      const newWarehouse = response.data?.data || response.data;

      // Reset form
      setFormData({
        warehouse_code: '',
        warehouse_name: '',
        warehouse_type: 'main',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_number: '',
        email: '',
        manager_name: '',
        capacity: '',
        is_active: true,
        is_default: false,
      });

      // Callback with new/updated warehouse
      if (onWarehouseCreated) {
        onWarehouseCreated(newWarehouse);
      }

      onClose();
    } catch (error) {
      console.error('Create/Update warehouse error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} warehouse`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, warehouse_type: type }));
    setShowTypeModal(false);
  };

  const renderTypeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleTypeSelect(item)}
    >
      <Text style={styles.modalItemName}>{item.toUpperCase()}</Text>
      {formData.warehouse_type === item && (
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
            <Text style={styles.title}>{title || (isEdit ? 'Edit Warehouse' : 'Create New Warehouse')}</Text>
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
                  <Text style={styles.inputLabel}>Warehouse Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.warehouse_code}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, warehouse_code: value }))}
                    placeholder="Enter warehouse code"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Warehouse Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.warehouse_name}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, warehouse_name: value }))}
                    placeholder="Enter warehouse name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Warehouse Type</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectInput]}
                    onPress={() => setShowTypeModal(true)}
                  >
                    <Text style={styles.inputText}>{formData.warehouse_type.toUpperCase()}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, address: value }))}
                    placeholder="Enter address"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.city}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      placeholder="Enter city"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.state}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, state: value }))}
                      placeholder="Enter state"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.pincode}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, pincode: value }))}
                    placeholder="Enter pincode"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <PhoneInput
                    value={formData.contact_number}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, contact_number: value }))}
                    placeholder="Enter contact number"
                    defaultCountry="IN"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Manager Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.manager_name}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, manager_name: value }))}
                    placeholder="Enter manager name"
                  />
                </View>
              </View>

              {/* Additional Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Capacity</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.capacity}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, capacity: value }))}
                    placeholder="Enter capacity (optional)"
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>Active</Text>
                    <Text style={styles.toggleSubtitle}>
                      Mark this warehouse as active
                    </Text>
                  </View>
                  <View style={[styles.toggle, formData.is_active && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, formData.is_active && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setFormData(prev => ({ ...prev, is_default: !prev.is_default }))}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>Default Warehouse</Text>
                    <Text style={styles.toggleSubtitle}>
                      Set as default warehouse for transactions
                    </Text>
                  </View>
                  <View style={[styles.toggle, formData.is_default && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, formData.is_default && styles.toggleThumbActive]} />
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
                  {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Warehouse' : 'Create Warehouse')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Warehouse Type</Text>
            <TouchableOpacity 
              onPress={() => setShowTypeModal(false)} 
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {warehouseTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalItem}
                onPress={() => handleTypeSelect(type)}
              >
                <Text style={styles.modalItemName}>{type.toUpperCase()}</Text>
                {formData.warehouse_type === type && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    marginBottom: 12,
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
