import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../utils/fonts';;

const { width } = Dimensions.get('window');

export default function Dropdown({
  label,
  placeholder = 'Select an option',
  value,
  onSelect,
  options = [],
  error,
  disabled = false,
  required = false,
  renderOption,
  getOptionLabel,
  getOptionValue,
  style,
  dropdownStyle,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => 
    (getOptionValue ? getOptionValue(option) : option.value) === value
  );

  const selectedLabel = selectedOption 
    ? (getOptionLabel ? getOptionLabel(selectedOption) : selectedOption.label)
    : placeholder;

  const handleSelect = (option) => {
    const optionValue = getOptionValue ? getOptionValue(option) : option.value;
    onSelect(optionValue, option);
    setIsOpen(false);
  };

  const renderDefaultOption = (option, index) => {
    const optionValue = getOptionValue ? getOptionValue(option) : option.value;
    const optionLabel = getOptionLabel ? getOptionLabel(option) : option.label;
    const isSelected = optionValue === value;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.option,
          isSelected && styles.selectedOption
        ]}
        onPress={() => handleSelect(option)}
      >
        <Text style={[
          styles.optionText,
          isSelected && styles.selectedOptionText
        ]}>
          {optionLabel}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#3e60ab" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.dropdown,
          error && styles.dropdownError,
          disabled && styles.dropdownDisabled,
          dropdownStyle
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.dropdownText,
          !selectedOption && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {selectedLabel}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={disabled ? "#9ca3af" : "#6b7280"} 
        />
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || 'Select Option'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => 
                renderOption ? renderOption(option, index, handleSelect) : renderDefaultOption(option, index)
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8
  },
  required: {
    color: '#dc2626',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    minHeight: 48,
  },
  dropdownError: {
    borderColor: '#dc2626',
  },
  dropdownDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  dropdownText: {
    ...FONT_STYLES.h5,
    color: '#111827',
    flex: 1
  },
  placeholderText: {
    color: '#9ca3af',
  },
  disabledText: {
    color: '#9ca3af',
  },
  errorText: {
    ...FONT_STYLES.caption,
    color: '#dc2626',
    marginTop: 4
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width - 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#f0f4ff',
  },
  optionText: {
    ...FONT_STYLES.h5,
    color: '#111827',
    flex: 1
  },
  selectedOptionText: {
    color: '#3e60ab',
    fontWeight: '600',
  },
});