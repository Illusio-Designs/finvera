import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function VouchersScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Vouchers
        </Text>
        <Text className="text-gray-600">
          Voucher management coming soon...
        </Text>
      </View>
    </ScrollView>
  );
}