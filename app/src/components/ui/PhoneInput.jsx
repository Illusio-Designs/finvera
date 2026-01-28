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
        error && styles.inputContainerError
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
      </View>

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
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  inputContainerDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  inputContainerError: {
    borderColor: '#ef4444',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    gap: 6,
  },
  countryFlag: {
    fontSize: 18,
  },
  selectedCountryCode: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
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
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
});

export default PhoneInput;