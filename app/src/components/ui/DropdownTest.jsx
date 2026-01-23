import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomDropdown from './CustomDropdown';

export default function DropdownTest() {
  const [selectedCompanyType, setSelectedCompanyType] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  const companyTypes = [
    { label: 'Private Limited', value: 'Private Limited' },
    { label: 'Public Limited', value: 'Public Limited' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'LLP', value: 'LLP' },
    { label: 'Sole Proprietorship', value: 'Sole Proprietorship' }
  ];

  const states = [
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Delhi', value: 'Delhi' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dropdown Test</Text>
      
      <CustomDropdown
        label="Company Type"
        value={selectedCompanyType}
        options={companyTypes}
        onSelect={setSelectedCompanyType}
        placeholder="Select company type"
        required={true}
      />

      <CustomDropdown
        label="State"
        value={selectedState}
        options={states}
        onSelect={setSelectedState}
        placeholder="Select state"
        maxHeight={150}
      />

      <Text style={styles.result}>
        Selected Company Type: {selectedCompanyType?.label || 'None'}
      </Text>
      <Text style={styles.result}>
        Selected State: {selectedState?.label || 'None'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  result: {
    fontSize: 16,
    marginTop: 10,
    color: '#374151',
    fontFamily: 'Agency',
  },
});