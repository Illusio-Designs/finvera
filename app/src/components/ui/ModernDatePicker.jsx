import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../utils/fonts';;

const ModernDatePicker = ({ 
  value, 
  onDateChange, 
  placeholder = 'Select date',
  disabled = false,
  style,
  error = false,
  label,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateSelected = (date) => {
    if (!selectedDate || !date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onDateChange(formatDateForAPI(selectedDate));
    }
    setShowPicker(false);
  };

  const handleCancel = () => {
    setSelectedDate(value ? new Date(value) : null);
    setShowPicker(false);
  };

  const navigateMonth = (direction) => {
    const newCurrent = new Date(currentMonth);
    
    if (direction === 'prev') {
      newCurrent.setMonth(newCurrent.getMonth() - 1);
    } else {
      newCurrent.setMonth(newCurrent.getMonth() + 1);
    }
    
    setCurrentMonth(newCurrent);
  };

  const displayValue = value ? formatDate(value) : '';

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.dateButton,
          disabled && styles.dateButtonDisabled,
          error && styles.dateButtonError
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.dateContent}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" style={styles.calendarIcon} />
          <Text 
            style={[
              styles.dateText,
              !displayValue && styles.placeholderText
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayValue || placeholder}
          </Text>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color="#9ca3af" 
          style={{ opacity: disabled ? 0.5 : 0.7 }}
        />
      </TouchableOpacity>

      {/* Modern Calendar Modal */}
      <Modal
        visible={showPicker}
        animationType="fade"
        transparent
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.calendarContainer}>
              {/* Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => navigateMonth('prev')}
                >
                  <Ionicons name="chevron-back" size={20} color="#6b7280" />
                </TouchableOpacity>
                
                <Text style={styles.monthText}>{getMonthName(currentMonth)}</Text>
                
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => navigateMonth('next')}
                >
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Single Month Calendar */}
              <View style={styles.monthGrid}>
                <View style={styles.weekDaysHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        date && isDateSelected(date) && styles.selectedDayCell,
                        date && isToday(date) && !isDateSelected(date) && styles.todayCell
                      ]}
                      onPress={() => date && handleDateSelect(date)}
                      disabled={!date}
                    >
                      <Text style={[
                        styles.dayText,
                        !date && styles.emptyDayText,
                        date && isDateSelected(date) && styles.selectedDayText,
                        date && isToday(date) && !isDateSelected(date) && styles.todayText
                      ]}>
                        {date ? date.getDate() : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Footer */}
              <View style={styles.calendarFooter}>
                <Text style={styles.selectedDateText}>
                  {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                </Text>
                <View style={styles.footerButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.applyButton, !selectedDate && styles.applyButtonDisabled]} 
                    onPress={handleConfirm}
                    disabled={!selectedDate}
                  >
                    <Text style={[styles.applyButtonText, !selectedDate && styles.applyButtonTextDisabled]}>
                      Apply
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    opacity: 0.7,
  },
  dateButtonError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  calendarIcon: {
    marginRight: 12,
    opacity: 0.7,
    flexShrink: 0,
  },
  dateText: {
    ...FONT_STYLES.h5,
    color: '#111827',
    flex: 1,
    flexShrink: 1,
    numberOfLines: 1,
  },
  placeholderText: {
    color: '#9ca3af',
    fontWeight: '400',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarContainer: {
    padding: 20,
  },

  // Calendar Header Styles
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  monthText: {
    ...FONT_STYLES.h5,
    color: '#1e293b'
  },

  // Calendar Grid Styles
  monthGrid: {
    marginBottom: 20,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  weekDayText: {
    ...FONT_STYLES.caption,
    flex: 1,
    textAlign: 'center',
    color: '#64748b',
    paddingVertical: 8
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
  },
  selectedDayCell: {
    backgroundColor: '#3e60ab',
  },
  todayCell: {
    backgroundColor: '#e0e7ff',
  },
  dayText: {
    ...FONT_STYLES.h5,
    color: '#1e293b'
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '700',
  },
  todayText: {
    color: '#3e60ab',
    fontWeight: '700',
  },
  emptyDayText: {
    color: 'transparent',
  },

  // Footer Styles
  calendarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  selectedDateText: {
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3e60ab',
  },
  applyButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  applyButtonText: {
    ...FONT_STYLES.label,
    color: 'white'
  },
  applyButtonTextDisabled: {
    color: '#94a3b8',
  },
});

export default ModernDatePicker;