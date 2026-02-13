import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../../utils/fonts';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { accountingAPI } from '../../../lib/api';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

const VOUCHER_TYPES = [
  { value: 'Sales Invoice', label: 'Sales Invoice' },
  { value: 'Purchase Invoice', label: 'Purchase Invoice' },
  { value: 'Payment', label: 'Payment' },
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Journal', label: 'Journal' },
  { value: 'Contra', label: 'Contra' },
  { value: 'Debit Note', label: 'Debit Note' },
  { value: 'Credit Note', label: 'Credit Note' },
  { value: 'delivery_challan', label: 'Delivery Challan' },
  { value: 'proforma_invoice', label: 'Proforma Invoice' },
];

const RESET_FREQUENCIES = [
  { value: 'never', label: 'Never' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
];

const FORMAT_TOKENS = [
  { token: '{PREFIX}', description: 'Series prefix' },
  { token: '{YEAR}', description: 'Full year (2024)' },
  { token: '{YY}', description: 'Short year (24)' },
  { token: '{MONTH}', description: 'Month (01-12)' },
  { token: '{MM}', description: 'Month (01-12)' },
  { token: '{SEQUENCE}', description: 'Sequence number' },
  { token: '{SEPARATOR}', description: 'Separator character' },
];

export default function NumberingSeriesScreen() {
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [series, setSeries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);

  const [formData, setFormData] = useState({
    voucher_type: 'Sales Invoice',
    series_name: '',
    prefix: 'INV',
    separator: '-',
    format: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{SEQUENCE}',
    sequence_length: 4,
    start_number: 1,
    current_sequence: 1,
    reset_frequency: 'yearly',
    is_default: false,
    is_active: true,
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchSeries();
    }
  }, [user?.company_id]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await accountingAPI.numberingSeries.list();
      console.log('Numbering Series Response:', response);
      const data = response?.data?.data || response?.data || [];
      console.log('Numbering Series Data:', data);
      console.log('Series count:', data.length);
      
      // Log each series for debugging
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((s, i) => {
          console.log(`Series ${i + 1}:`, {
            id: s.id,
            voucher_type: s.voucher_type,
            series_name: s.series_name,
            is_default: s.is_default,
            is_active: s.is_active
          });
        });
      }
      
      setSeries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching numbering series:', error);
      console.error('Error details:', error.response?.data);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load numbering series'
      });
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSeries();
    setRefreshing(false);
  }, []);

  const handleCreate = () => {
    setEditingSeries(null);
    setFormData({
      voucher_type: 'Sales Invoice',
      series_name: '',
      prefix: 'INV',
      separator: '-',
      format: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{SEQUENCE}',
      sequence_length: 4,
      start_number: 1,
      current_sequence: 1,
      reset_frequency: 'yearly',
      is_default: false,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingSeries(item);
    setFormData({
      voucher_type: item.voucher_type,
      series_name: item.series_name || '',
      prefix: item.prefix || '',
      separator: item.separator || '-',
      format: item.format,
      sequence_length: item.sequence_length,
      start_number: item.start_number,
      current_sequence: item.current_sequence,
      reset_frequency: item.reset_frequency,
      is_default: item.is_default,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.series_name || !formData.series_name.trim()) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Series name is required'
        });
        return;
      }

      if (!formData.format || !formData.format.trim()) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Format is required'
        });
        return;
      }

      setLoading(true);
      
      if (editingSeries) {
        await accountingAPI.numberingSeries.update(editingSeries.id, formData);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Numbering series updated successfully'
        });
      } else {
        await accountingAPI.numberingSeries.create(formData);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Numbering series created successfully'
        });
      }
      
      setShowModal(false);
      await fetchSeries();
    } catch (error) {
      console.error('Error saving numbering series:', error);
      console.error('Error response:', error.response?.data);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.response?.data?.error || 'Failed to save numbering series'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await accountingAPI.numberingSeries.delete(id);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Numbering series deleted successfully'
      });
      await fetchSeries();
    } catch (error) {
      console.error('Error deleting numbering series:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete numbering series'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      setLoading(true);
      await accountingAPI.numberingSeries.setDefault(id);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Default series updated successfully'
      });
      await fetchSeries();
    } catch (error) {
      console.error('Error setting default series:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to set default series'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPreview = () => {
    const { format, prefix, separator, sequence_length, start_number } = formData;
    let preview = format;
    preview = preview.replace(/{PREFIX}/g, prefix);
    preview = preview.replace(/{SEPARATOR}/g, separator);
    preview = preview.replace(/{YEAR}/g, new Date().getFullYear().toString());
    preview = preview.replace(/{YY}/g, new Date().getFullYear().toString().slice(-2));
    preview = preview.replace(/{MONTH}/g, (new Date().getMonth() + 1).toString().padStart(2, '0'));
    preview = preview.replace(/{MM}/g, (new Date().getMonth() + 1).toString().padStart(2, '0'));
    preview = preview.replace(/{SEQUENCE}/g, start_number.toString().padStart(sequence_length, '0'));
    return preview;
  };

  if (loading && series.length === 0) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Numbering Series" 
          onMenuPress={handleMenuPress}
        />
        <ScrollView style={styles.content}>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Numbering Series" 
        onMenuPress={handleMenuPress}
      />
      
      {/* Floating Action Button - Top Position */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={handleCreate}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3e60ab" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Numbering Series</Text>
            <Text style={styles.infoText}>
              Configure automatic numbering for different voucher types. Each series can have its own format with prefixes, sequences, and automatic resets.
            </Text>
          </View>
        </View>

        {/* Series List */}
        {series.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Numbering Series</Text>
            <Text style={styles.emptyText}>
              Create your first numbering series to start auto-generating voucher numbers
            </Text>
          </View>
        ) : (
          <View style={styles.seriesList}>
            {series.map((item) => (
              <View key={item.id} style={styles.seriesCard}>
                <View style={styles.seriesHeader}>
                  <View style={styles.seriesHeaderLeft}>
                    <Text style={styles.seriesType}>{item.voucher_type}</Text>
                    {item.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.seriesActions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                      <Ionicons name="create-outline" size={20} color="#3e60ab" />
                    </TouchableOpacity>
                    {!item.is_default && (
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.seriesDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Format:</Text>
                    <Text style={styles.detailValue}>{item.format}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Prefix:</Text>
                    <Text style={styles.detailValue}>{item.prefix || 'None'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Sequence:</Text>
                    <Text style={styles.detailValue}>{item.current_sequence}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reset:</Text>
                    <Text style={styles.detailValue}>{item.reset_frequency}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, item.is_active ? styles.statusActiveText : styles.statusInactiveText]}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>

                {!item.is_default && (
                  <TouchableOpacity 
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(item.id)}
                  >
                    <Text style={styles.setDefaultButtonText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingSeries ? 'Edit Numbering Series' : 'Create Numbering Series'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Series Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Series Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.series_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, series_name: text }))}
                placeholder="e.g., Default Sales, Export Sales"
                placeholderTextColor="#9ca3af"
                maxLength={50}
              />
              <Text style={styles.helpText}>
                A unique name to identify this numbering series
              </Text>
            </View>

            {/* Voucher Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Voucher Type *</Text>
              <View style={styles.radioGroup}>
                {VOUCHER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.radioOption}
                    onPress={() => setFormData(prev => ({ ...prev, voucher_type: type.value }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.voucher_type === type.value && styles.radioCircleSelected
                    ]}>
                      {formData.voucher_type === type.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Prefix */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prefix</Text>
              <TextInput
                style={styles.input}
                value={formData.prefix}
                onChangeText={(text) => setFormData(prev => ({ ...prev, prefix: text }))}
                placeholder="e.g., INV, SI, PI"
                placeholderTextColor="#9ca3af"
                maxLength={10}
              />
            </View>

            {/* Separator */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Separator</Text>
              <TextInput
                style={styles.input}
                value={formData.separator}
                onChangeText={(text) => setFormData(prev => ({ ...prev, separator: text }))}
                placeholder="e.g., -, /, _"
                placeholderTextColor="#9ca3af"
                maxLength={2}
              />
            </View>

            {/* Format */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Format *</Text>
              <TextInput
                style={styles.input}
                value={formData.format}
                onChangeText={(text) => setFormData(prev => ({ ...prev, format: text }))}
                placeholder="e.g., {PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{SEQUENCE}"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.helpText}>Available tokens:</Text>
              <View style={styles.tokenList}>
                {FORMAT_TOKENS.map((token) => (
                  <View key={token.token} style={styles.tokenItem}>
                    <Text style={styles.tokenCode}>{token.token}</Text>
                    <Text style={styles.tokenDesc}>{token.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sequence Length */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sequence Length</Text>
              <View style={styles.radioGroup}>
                {[3, 4, 5, 6].map((length) => (
                  <TouchableOpacity
                    key={length}
                    style={styles.radioOption}
                    onPress={() => setFormData(prev => ({ ...prev, sequence_length: length }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.sequence_length === length && styles.radioCircleSelected
                    ]}>
                      {formData.sequence_length === length && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{length} digits</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Starting Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Starting Number</Text>
              <TextInput
                style={styles.input}
                value={String(formData.start_number)}
                onChangeText={(text) => setFormData(prev => ({ ...prev, start_number: parseInt(text) || 1 }))}
                placeholder="1"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            {/* Reset Frequency */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Reset Frequency</Text>
              <View style={styles.radioGroup}>
                {RESET_FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={styles.radioOption}
                    onPress={() => setFormData(prev => ({ ...prev, reset_frequency: freq.value }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.reset_frequency === freq.value && styles.radioCircleSelected
                    ]}>
                      {formData.reset_frequency === freq.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{freq.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Switches */}
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.label}>Set as Default</Text>
                  <Text style={styles.helpText}>Use this series by default for this voucher type</Text>
                </View>
                <Switch
                  value={formData.is_default}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_default: value }))}
                  trackColor={{ false: '#e5e7eb', true: '#3e60ab' }}
                  thumbColor={formData.is_default ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.label}>Active</Text>
                  <Text style={styles.helpText}>Enable or disable this series</Text>
                </View>
                <Switch
                  value={formData.is_active}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                  trackColor={{ false: '#e5e7eb', true: '#3e60ab' }}
                  thumbColor={formData.is_active ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <Text style={styles.previewValue}>{getPreview()}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f4fc',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3e60ab',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginBottom: 4,
  },
  infoText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...FONT_STYLES.h4,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
    textAlign: 'center',
  },
  seriesList: {
    padding: 16,
  },
  seriesCard: {
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
  seriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  seriesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  seriesType: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
    fontWeight: '600',
  },
  seriesActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  seriesDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  detailValue: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#065f46',
  },
  statusInactiveText: {
    color: '#991b1b',
  },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4fc',
    borderRadius: 6,
    alignItems: 'center',
  },
  setDefaultButtonText: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
  },
  fabContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    ...FONT_STYLES.h5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: 'white',
  },
  helpText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 4,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#3e60ab',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3e60ab',
  },
  radioLabel: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  tokenList: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tokenCode: {
    ...FONT_STYLES.caption,
    fontFamily: 'monospace',
    color: '#3e60ab',
    fontWeight: '600',
  },
  tokenDesc: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  previewCard: {
    backgroundColor: '#f0f4fc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3e60ab',
  },
  previewLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
  },
  previewValue: {
    ...FONT_STYLES.h4,
    color: '#3e60ab',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3e60ab',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    ...FONT_STYLES.h5,
    color: 'white',
  },
});
