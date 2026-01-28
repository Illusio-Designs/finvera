import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const DatePicker = ({ 
  value, 
  onDateChange, 
  placeholder = 'Select date',
  disabled = false,
  style,
  error = false,
  label,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        // Format date as YYYY-MM-DD for API compatibility
        const formattedDate = selectedDate.toISOString().split('T')[0];
        onDateChange(formattedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    const formattedDate = tempDate.toISOString().split('T')[0];
    onDateChange(formattedDate);
    setShowPicker(false);
  };

  const handleIOSCancel = () => {
    setTempDate(value ? new Date(value) : new Date());
    setShowPicker(false);
  };

  const displayValue = value ? formatDate(value) : '';

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.dateButton,
          disabled && styles.dateButtonDisabled,
          error && styles.dateButtonError
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <View style={styles.dateContent}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" style={styles.calendarIcon} />
          <Text style={[
            styles.dateText,
            !displayValue && styles.placeholderText
          ]}>
            {displayValue || placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#6b7280" />
      </TouchableOpacity>

      {/* Android DatePicker */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maximumDate || new Date(2030, 11, 31)}
          minimumDate={minimumDate || new Date(1900, 0, 1)}
        />
      )}

      {/* iOS DatePicker Modal */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={showPicker}
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleIOSCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <Text style={styles.modalTitle}>
                  {label || 'Select Date'}
                </Text>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleIOSConfirm}
                >
                  <Text style={styles.modalConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => date && setTempDate(date)}
                maximumDate={maximumDate || new Date(2030, 11, 31)}
                minimumDate={minimumDate || new Date(1900, 0, 1)}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
    minHeight: 52,
  },
  dateButtonDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  dateButtonError: {
    borderColor: '#ef4444',
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },

  // iOS Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#3e60ab',
    fontWeight: '600',
    fontFamily: 'Agency',
  },
  iosDatePicker: {
    height: 200,
  },
});

export default DatePicker;