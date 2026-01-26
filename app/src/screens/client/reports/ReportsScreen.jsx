import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();

  const handleMenuPress = () => {
    openDrawer();
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Reports" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Connect to backend to load reports data</Text>
          </View>
        </View>
      </ScrollView>
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
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontFamily: 'Agency',
  },
});