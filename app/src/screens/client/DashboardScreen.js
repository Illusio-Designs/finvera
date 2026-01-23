import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome, {user?.name || 'User'}!
        </Text>
        <Text style={styles.subtitle}>
          Finvera Mobile Dashboard
        </Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Vouchers</Text>
            <Text style={styles.cardSubtitle}>Manage transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Reports</Text>
            <Text style={styles.cardSubtitle}>View analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Inventory</Text>
            <Text style={styles.cardSubtitle}>Stock management</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>GST</Text>
            <Text style={styles.cardSubtitle}>Tax compliance</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 32,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});