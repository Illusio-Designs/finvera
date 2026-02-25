import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { downloadAsync, documentDirectory, EncodingType } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_CONFIG, buildStorageKey } from '../../config/env';
import { FONT_STYLES } from '../../utils/fonts';

export default function VoucherActionButtons({ 
  voucher, 
  onView, 
  onEdit, 
  onDelete,
  showNotification 
}) {
  const handlePrint = async (e) => {
    e?.stopPropagation();
    try {
      showNotification({
        type: 'info',
        title: 'Generating PDF',
        message: 'Please wait...'
      });

      if (Platform.OS === 'web') {
        // For web, we can use the blob approach
        const { pdfAPI } = require('../../lib/api');
        const response = await pdfAPI.exportVoucher(voucher.id);
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'PDF opened in new tab'
        });
      } else {
        // For React Native - use FileSystem.downloadAsync
        const fileUri = `${documentDirectory}${voucher.voucher_number || 'voucher'}.pdf`;
        
        // Get auth token
        const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
        const token = await AsyncStorage.getItem(tokenKey);
        
        // Download PDF directly
        const downloadResult = await downloadAsync(
          `${API_CONFIG.API_URL}/pdf/voucher/${voucher.id}`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('PDF downloaded to:', downloadResult.uri);
        
        // Print the PDF
        await Print.printAsync({ uri: downloadResult.uri });
        
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Print dialog opened'
        });
      }
    } catch (error) {
      console.error('Print voucher error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to print voucher'
      });
    }
  };

  const handleExport = async (e) => {
    e?.stopPropagation();
    try {
      showNotification({
        type: 'info',
        title: 'Exporting PDF',
        message: 'Please wait...'
      });

      if (Platform.OS === 'web') {
        // For web, use blob approach
        const { pdfAPI } = require('../../lib/api');
        const response = await pdfAPI.exportVoucher(voucher.id);
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${voucher.voucher_number || 'voucher'}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'PDF downloaded successfully'
        });
      } else {
        // For React Native - use FileSystem.downloadAsync
        const fileUri = `${documentDirectory}${voucher.voucher_number || 'voucher'}.pdf`;
        
        // Get auth token
        const tokenKey = buildStorageKey(STORAGE_CONFIG.AUTH_TOKEN_KEY);
        const token = await AsyncStorage.getItem(tokenKey);
        
        // Download PDF directly
        const downloadResult = await downloadAsync(
          `${API_CONFIG.API_URL}/pdf/voucher/${voucher.id}`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('PDF downloaded to:', downloadResult.uri);
        
        // Share the PDF
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export PDF',
            UTI: 'com.adobe.pdf'
          });
          showNotification({
            type: 'success',
            title: 'Success',
            message: 'PDF exported successfully'
          });
        } else {
          Alert.alert('Success', `PDF saved to: ${downloadResult.uri}`);
        }
      }
    } catch (error) {
      console.error('Export voucher error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to export voucher'
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={(e) => {
          e?.stopPropagation();
          onView(voucher);
        }}
      >
        <Ionicons name="eye-outline" size={16} color="#3e60ab" />
        <Text style={styles.actionButtonText}>View</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handlePrint}
      >
        <Ionicons name="print-outline" size={16} color="#8b5cf6" />
        <Text style={styles.actionButtonText}>Print</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleExport}
      >
        <Ionicons name="download-outline" size={16} color="#10b981" />
        <Text style={styles.actionButtonText}>Export</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={(e) => {
          e?.stopPropagation();
          onEdit(voucher);
        }}
      >
        <Ionicons name="create-outline" size={16} color="#f59e0b" />
        <Text style={styles.actionButtonText}>Edit</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={(e) => {
          e?.stopPropagation();
          onDelete(voucher);
        }}
      >
        <Ionicons name="trash-outline" size={16} color="#dc2626" />
        <Text style={styles.actionButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexWrap: 'wrap',
    gap: 6
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    minWidth: 70
  },
  actionButtonText: {
    ...FONT_STYLES.captionSmall,
    marginLeft: 4,
    fontSize: 11
  }
});
