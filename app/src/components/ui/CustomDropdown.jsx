import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomDropdown = ({ 
  options = [], 
  value, 
  onSelect, 
  placeholder = 'Select an option',
  loading = false,
  disabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (selectedValue) => {
    onSelect(selectedValue);
    setIsVisible(false);
  };

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.selectedOption
      ]}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={[
        styles.optionText,
        item.value === value && styles.selectedOptionText
      ]}>
        {item.label}
      </Text>
      {item.value === value && (
        <Ionicons name="checkmark" size={20} color="#3e60ab" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdown,
          disabled && styles.dropdownDisabled
        ]}
        onPress={() => !disabled && !loading && setIsVisible(true)}
        disabled={disabled || loading}
      >
        <Text style={[
          styles.dropdownText,
          !selectedOption && styles.placeholderText
        ]}>
          {loading ? 'Loading...' : (selectedOption?.label || placeholder)}
        </Text>
        <Ionicons 
          name={isVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6b7280" 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value.toString()}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
  },
  dropdownDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#3e60ab15',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
  },
  selectedOptionText: {
    color: '#3e60ab',
    fontWeight: '600',
  },
});

export default CustomDropdown;