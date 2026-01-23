import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function VouchersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Vouchers
        </Text>
        <Text style={styles.subtitle}>
          Voucher management coming soon...
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  subtitle: {
    color: '#6b7280',
  },
});