import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomDropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  maxHeight = 200,
  style,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    if (disabled) return;
    
    if (isOpen) {
      // Close dropdown
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setIsOpen(false);
      });
    } else {
      // Open dropdown
      setIsOpen(true);
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSelect = (option) => {
    onSelect(option);
    
    // Close dropdown with animation
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const closeDropdown = () => {
    if (isOpen) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setIsOpen(false);
      });
    }
  };

  const getDisplayValue = () => {
    if (typeof value === 'object' && value !== null) {
      return value.label || value.name || value.value || placeholder;
    }
    return value || placeholder;
  };

  const getOptionLabel = (option) => {
    if (typeof option === 'object' && option !== null) {
      return option.label || option.name || option.value || option;
    }
    return option;
  };

  const getOptionValue = (option) => {
    if (typeof option === 'object' && option !== null) {
      return option.value || option.name || option.label || option;
    }
    return option;
  };

  const isSelected = (option) => {
    const optionValue = getOptionValue(option);
    const currentValue = typeof value === 'object' && value !== null 
      ? (value.value || value.name || value.label) 
      : value;
    return optionValue === currentValue;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={[
            styles.dropdown,
            disabled && styles.dropdownDisabled,
            isOpen && styles.dropdownOpen
          ]}
          onPress={toggleDropdown}
          disabled={disabled}
        >
          <Text style={[
            styles.dropdownText,
            !value && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {getDisplayValue()}
          </Text>
          <Ionicons 
            name={isOpen ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={disabled ? '#9ca3af' : '#6b7280'} 
          />
        </TouchableOpacity>
        
        {isOpen && (
          <Animated.View 
            style={[
              styles.dropdownList,
              {
                maxHeight: dropdownAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, maxHeight],
                }),
                opacity: dropdownAnimation,
              }
            ]}
          >
            <ScrollView 
              style={styles.dropdownScrollView}
              contentContainerStyle={styles.dropdownScrollContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              scrollEventThrottle={16}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={`option-${index}-${getOptionValue(option)}`}
                  style={[
                    styles.dropdownItem,
                    isSelected(option) && styles.dropdownItemSelected,
                    index === options.length - 1 && styles.dropdownItemLast
                  ]}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[
                      styles.dropdownItemText,
                      isSelected(option) && styles.dropdownItemTextSelected
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {getOptionLabel(option)}
                  </Text>
                  {isSelected(option) && (
                    <Ionicons name="checkmark" size={16} color="#3e60ab" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  required: {
    color: '#ef4444',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    minHeight: 48,
  },
  dropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#3e60ab',
  },
  dropdownDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
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
  disabledText: {
    color: '#9ca3af',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    flex: 1,
  },
  dropdownScrollContent: {
    flexGrow: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 48,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f4fc',
    borderBottomColor: '#e0e7ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
    marginRight: 8,
  },
  dropdownItemTextSelected: {
    color: '#3e60ab',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
});