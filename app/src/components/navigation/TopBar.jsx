import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import SearchModal from '../ui/SearchModal';

export default function TopBar({ 
  title = 'Finvera', 
  onMenuPress, 
  onSearchPress,
  showSearch = true, 
  showBackButton = false, 
  onBackPress 
}) {
  const { user } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      setShowSearchModal(true);
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#3e60ab" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
              <Ionicons name="menu" size={24} color="#3e60ab" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.rightSection}>
          {showSearch && (
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
              <Ionicons name="search" size={24} color="#3e60ab" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Modal */}
      <SearchModal 
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        placeholder="Search ledgers, vouchers, inventory..."
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
  },
});