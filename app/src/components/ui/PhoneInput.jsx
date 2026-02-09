import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../utils/fonts';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+1', country: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', iso: 'AE' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', iso: 'SG' },
  { code: '+60', country: 'Malaysia', flag: '��', iso: 'MY' },
  { code: '+86', country: 'China', flag: '��', iso: 'CN' },
  { code: '+81', country: 'Japan', flag: '��', iso: 'JP' },
  { code: '+82', country: 'South Korea', flag: '��', iso: 'KR' },
  { code: '+61', country: 'Australia', flag: '��', iso: 'AU' },
];

const PhoneInput = ({
  value = '',
  onChangeText,
  placeholder = 'Enter phone number',
  defaultCountry = 'IN',
  disabled = false,
  error = false,
  style,
  showValidation = false,
}) => {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_CODES.find(c => c.iso === defaultCountry) || COUNTRY_CODES[0]
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    
    // Update the phone number with new country code
    const phoneWithoutCode = value.replace(/^\+\d+\s*/, '');
    const newValue = phoneWithoutCode ? `${country.code} ${phoneWithoutCode}` : '';
    onChangeText(newValue);
  };

  const handlePhoneChange = (text) => {
    // Remove any existing country code and format
    const cleanNumber = text.replace(/^\+\d+\s*/, '').replace(/\D/g, '');
    
    // Format the number based on country
    let formattedNumber = cleanNumber;
    if (selectedCountry.iso === 'IN' && cleanNumber.length > 0) {
      // Indian format: XXXXX XXXXX
      if (cleanNumber.length > 5) {
        formattedNumber = `${cleanNumber.substring(0, 5)} ${cleanNumber.substring(5, 10)}`;
      }
    } else if (selectedCountry.iso === 'US' && cleanNumber.length > 0) {
      // US format: (XXX) XXX-XXXX
      if (cleanNumber.length > 6) {
        formattedNumber = `(${cleanNumber.substring(0, 3)}) ${cleanNumber.substring(3, 6)}-${cleanNumber.substring(6, 10)}`;
      } else if (cleanNumber.length > 3) {
        formattedNumber = `(${cleanNumber.substring(0, 3)}) ${cleanNumber.substring(3)}`;
      }
    }
    
    const fullNumber = formattedNumber ? `${selectedCountry.code} ${formattedNumber}` : '';
    onChangeText(fullNumber);
  };

  const getDisplayValue = () => {
    if (!value) return '';
    // Remove country code for display in input
    return value.replace(selectedCountry.code, '').trim();
  };

  const isValidPhone = () => {
    if (!value) return false;
    const cleanNumber = value.replace(/\D/g, '');
    // Remove country code digits
    const countryCodeDigits = selectedCountry.code.replace(/\D/g, '');
    const phoneDigits = cleanNumber.replace(countryCodeDigits, '');
    
    if (selectedCountry.iso === 'IN') {
      return phoneDigits.length === 10;
    } else if (selectedCountry.iso === 'US') {
      return phoneDigits.length === 10;
    }
    return phoneDigits.length >= 8 && phoneDigits.length <= 15;
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.country}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry.iso === item.iso && (
        <Ionicons name="checkmark" size={20} color="#3e60ab" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.inputContainer,
        disabled && styles.inputContainerDisabled,
        error && styles.inputContainerError,
        showValidation && value && isValidPhone() && styles.inputContainerValid
      ]}>
        {/* Country Code Selector */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => !disabled && setShowCountryPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.selectedCountryCode}>{selectedCountry.code}</Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          value={getDisplayValue()}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          editable={!disabled}
          maxLength={selectedCountry.iso === 'IN' ? 11 : 15} // Adjust based on country
        />

        {/* Validation Icon */}
        {showValidation && value && (
          <View style={styles.validationIcon}>
            {isValidPhone() ? (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            ) : (
              <Ionicons name="alert-circle" size={20} color="#f59e0b" />
            )}
          </View>
        )}
      </View>

      {/* Validation Message */}
      {showValidation && value && !isValidPhone() && (
        <View style={styles.validationMessage}>
          <Ionicons name="information-circle" size={14} color="#f59e0b" />
          <Text style={styles.validationText}>
            {selectedCountry.iso === 'IN' 
              ? 'Please enter a valid 10-digit phone number' 
              : 'Please enter a valid phone number'}
          </Text>
        </View>
      )}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCountryPicker(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={COUNTRY_CODES}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.iso}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
    minHeight: 48,
  },
  inputContainerDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputContainerValid: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    gap: 4,
    backgroundColor: '#f9fafb',
  },
  countryFlag: {
    fontSize: 20,
  },
  selectedCountryCode: {
    ...FONT_STYLES.body,
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...FONT_STYLES.body,
    color: '#111827',
    fontSize: 14,
  },
  validationIcon: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  validationText: {
    ...FONT_STYLES.caption,
    color: '#f59e0b',
    flex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  countryName: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 2,
  },
  countryCode: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
});

export default PhoneInput;