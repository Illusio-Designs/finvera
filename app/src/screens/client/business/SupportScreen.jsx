import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { clientSupportAPI } from '../../../lib/api';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function SupportScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: '',
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchTickets = useCallback(async () => {
    try {
      console.log('🎫 Fetching support tickets...');
      const response = await clientSupportAPI.tickets.list({ 
        limit: 50,
        status: filter !== 'all' ? filter : undefined 
      });
      console.log('🎫 Support tickets response:', response.data);
      const data = response.data?.data || response.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('🎫 Support tickets fetch error:', error);
      console.error('🎫 Error details:', error.response?.data);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load support tickets'
      });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleTicketPress = (ticket) => {
    showNotification({
      type: 'info',
      title: 'Ticket Details',
      message: `Viewing ticket #${ticket.ticket_number || ticket.id}`
    });
  };

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    setNewTicket(prev => ({ ...prev, category: category.value }));
    setShowCreateModal(true);
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      showNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in both subject and description'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🎫 Creating support ticket:', newTicket);
      
      const ticketData = {
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        category: newTicket.category || 'general',
        priority: newTicket.priority || 'medium',
      };
      
      const response = await clientSupportAPI.tickets.create(ticketData);
      console.log('🎫 Ticket creation response:', response.data);
      
      showNotification({
        type: 'success',
        title: 'Ticket Created',
        message: 'Your support ticket has been created successfully'
      });

      setShowCreateModal(false);
      setNewTicket({
        subject: '',
        description: '',
        priority: 'medium',
        category: '',
      });
      setSelectedCategory(null);
      fetchTickets();
    } catch (error) {
      console.error('🎫 Create ticket error:', error);
      console.error('🎫 Error details:', error.response?.data);
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create support ticket'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All Tickets', icon: 'list-outline' },
    { key: 'open', label: 'Open', icon: 'radio-button-on-outline' },
    { key: 'in_progress', label: 'In Progress', icon: 'time-outline' },
    { key: 'resolved', label: 'Resolved', icon: 'checkmark-circle-outline' },
    { key: 'closed', label: 'Closed', icon: 'close-circle-outline' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'open': '#3e60ab',
      'in_progress': '#f59e0b',
      'resolved': '#10b981',
      'closed': '#6b7280',
      'pending': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'open': 'radio-button-on',
      'in_progress': 'time',
      'resolved': 'checkmark-circle',
      'closed': 'close-circle',
      'pending': 'pause-circle',
    };
    return icons[status?.toLowerCase()] || 'help-circle';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981',
    };
    return colors[priority?.toLowerCase()] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const supportCategories = [
    { 
      title: 'Technical Support', 
      value: 'technical',
      icon: 'settings-outline', 
      description: 'Get help with technical issues and bugs'
    },
    { 
      title: 'Billing Issues', 
      value: 'billing',
      icon: 'card-outline', 
      description: 'Questions about payments and subscriptions'
    },
    { 
      title: 'Feature Request', 
      value: 'feature_request',
      icon: 'bulb-outline', 
      description: 'Suggest new features and improvements'
    },
    { 
      title: 'Bug Report', 
      value: 'bug_report',
      icon: 'bug-outline', 
      description: 'Report software bugs and issues'
    },
    { 
      title: 'General Inquiry', 
      value: 'general',
      icon: 'help-circle-outline', 
      description: 'General questions and information'
    },
    { 
      title: 'Other', 
      value: 'other',
      icon: 'ellipsis-horizontal-outline', 
      description: 'Other support requests'
    },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Support" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Support Center</Text>
          <Text style={styles.sectionSubtitle}>
            Get help from our expert support team
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tickets.length}</Text>
              <Text style={styles.statLabel}>My Tickets</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </View>

        {/* Quick Support Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeaderTitle}>How can we help you?</Text>
          <View style={styles.categoriesGrid}>
            {supportCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={24} color="#3e60ab" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Ticket Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Ticket</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View style={styles.filtersSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterTab,
                  filter === option.key && styles.filterTabActive
                ]}
                onPress={() => setFilter(option.key)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={16} 
                  color={filter === option.key ? 'white' : '#64748b'} 
                />
                <Text style={[
                  styles.filterTabText,
                  filter === option.key && styles.filterTabTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Support Tickets List */}
        {loading ? (
          <View style={styles.ticketsList}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="help-circle-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Support Tickets</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'You haven\'t created any support tickets yet' 
                  : `No ${filter.replace('_', ' ')} tickets found`}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateTicket}>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.emptyButtonText}>Create Your First Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {tickets.map((ticket, index) => (
              <TouchableOpacity
                key={ticket.id || index}
                style={styles.ticketCard}
                onPress={() => handleTicketPress(ticket)}
                activeOpacity={0.7}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketNumber}>
                      #{ticket.ticket_number || ticket.id || `T${index + 1}`}
                    </Text>
                    <Text style={styles.ticketTitle}>
                      {ticket.subject || ticket.title || 'Support Request'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(ticket.status) }
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(ticket.status)} 
                      size={12} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>
                      {ticket.status || 'Open'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {ticket.description || ticket.message || 'No description available'}
                </Text>

                <View style={styles.ticketFooter}>
                  <View style={styles.ticketMeta}>
                    <View style={styles.ticketStat}>
                      <Ionicons name="calendar-outline" size={14} color="#64748b" />
                      <Text style={styles.ticketStatText}>
                        {formatDate(ticket.created_at)}
                      </Text>
                    </View>
                    {ticket.priority && (
                      <View style={[
                        styles.priorityBadge,
                        { borderColor: getPriorityColor(ticket.priority) }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { color: getPriorityColor(ticket.priority) }
                        ]}>
                          {ticket.priority}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionHeaderTitle}>Need Immediate Help?</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={20} color="#3e60ab" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+91 8490009684</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={20} color="#3e60ab" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@finvera.com</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="time" size={20} color="#3e60ab" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Business Hours</Text>
                <Text style={styles.contactValue}>Mon-Fri: 9 AM - 6 PM IST</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Create Ticket Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name={selectedCategory?.icon || 'help-circle'} size={24} color="#3e60ab" />
                <View>
                  <Text style={styles.modalTitle}>Create Support Ticket</Text>
                  <Text style={styles.modalSubtitle}>{selectedCategory?.title || 'General Support'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formCard}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Subject *</Text>
                  <TextInput
                    style={styles.input}
                    value={newTicket.subject}
                    onChangeText={(text) => setNewTicket(prev => ({ ...prev, subject: text }))}
                    placeholder="Brief description of your issue"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={newTicket.description}
                    onChangeText={(text) => setNewTicket(prev => ({ ...prev, description: text }))}
                    placeholder="Provide detailed information about your issue..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.priorityOptions}>
                    {['low', 'medium', 'high'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          newTicket.priority === priority && styles.priorityOptionActive
                        ]}
                        onPress={() => setNewTicket(prev => ({ ...prev, priority }))}
                      >
                        <Text style={[
                          styles.priorityOptionText,
                          newTicket.priority === priority && styles.priorityOptionTextActive
                        ]}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleSubmitTicket}
                  disabled={loading}
                >
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating...' : 'Create Ticket'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    ...FONT_STYLES.h1,
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statNumber: {
    ...FONT_STYLES.h4,
    color: '#3e60ab',
  },
  statLabel: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
    marginTop: 2,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 16,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4,
  },
  categoryDescription: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3e60ab',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    ...FONT_STYLES.h4,
    color: 'white',
    marginLeft: 12,
  },
  filtersSection: {
    marginBottom: 24,
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  filterTabText: {
    ...FONT_STYLES.labelSmall,
    color: '#6b7280',
    marginLeft: 6,
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingCard: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    width: '100%',
  },
  emptyTitle: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyButtonText: {
    ...FONT_STYLES.h5,
    color: 'white',
  },
  ticketsList: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketNumber: {
    ...FONT_STYLES.caption,
    color: '#3e60ab',
    marginBottom: 4,
  },
  ticketTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    color: 'white',
    textTransform: 'capitalize',
  },
  ticketDescription: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketStatText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  priorityText: {
    ...FONT_STYLES.captionSmall,
    textTransform: 'capitalize',
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    ...FONT_STYLES.label,
    color: '#111827',
    marginBottom: 2,
  },
  contactValue: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
  },
  modalSubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111827',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  priorityOptionActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  priorityOptionText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  priorityOptionTextActive: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#3e60ab',
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    ...FONT_STYLES.h5,
    color: 'white',
  },
});