import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { clientSupportAPI } from '../../../lib/api';

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
      const response = await clientSupportAPI.tickets.list({ 
        limit: 50,
        status: filter !== 'all' ? filter : undefined 
      });
      const data = response.data?.data || response.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Support tickets fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load support tickets'
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
    showNotification(`View details for ticket #${ticket.ticket_number || ticket.id}`, 'info');
  };

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    setNewTicket(prev => ({ ...prev, category: category.title }));
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
      await clientSupportAPI.tickets.create(newTicket);
      
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
      console.error('Create ticket error:', error);
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
      'open': '#3b82f6',
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
      icon: 'settings-outline', 
      color: '#3e60ab',
      bgColor: '#dbeafe',
      description: 'Get help with technical issues and bugs'
    },
    { 
      title: 'Billing Issues', 
      icon: 'card-outline', 
      color: '#10b981',
      bgColor: '#d1fae5',
      description: 'Questions about payments and subscriptions'
    },
    { 
      title: 'Feature Request', 
      icon: 'bulb-outline', 
      color: '#f59e0b',
      bgColor: '#fef3c7',
      description: 'Suggest new features and improvements'
    },
    { 
      title: 'Bug Report', 
      icon: 'bug-outline', 
      color: '#ef4444',
      bgColor: '#fee2e2',
      description: 'Report software bugs and issues'
    },
    { 
      title: 'Account Help', 
      icon: 'person-outline', 
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      description: 'Account settings and profile assistance'
    },
    { 
      title: 'General Inquiry', 
      icon: 'help-circle-outline', 
      color: '#6b7280',
      bgColor: '#f3f4f6',
      description: 'General questions and information'
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
        {/* Header Section with Stats */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Support Center</Text>
          <Text style={styles.sectionSubtitle}>
            Get help from our expert support team or browse existing tickets
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>How can we help you?</Text>
            <Text style={styles.sectionHeaderSubtitle}>Choose a category to get started</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {supportCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.95}
              >
                <View style={styles.categoryCardGradient}>
                  <View style={styles.categoryCardContent}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
                      <Ionicons name={category.icon} size={24} color={category.color} />
                    </View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                    
                    <TouchableOpacity 
                      style={[styles.categoryButton, { backgroundColor: category.color }]}
                      onPress={() => handleCategoryPress(category)}
                    >
                      <Ionicons name="add" size={16} color="white" />
                      <Text style={styles.categoryButtonText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[styles.decorativeCircle, { backgroundColor: category.bgColor }]} />
                  <View style={[styles.decorativeLine, { backgroundColor: category.color }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Ticket Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
          <View style={styles.createButtonContent}>
            <Ionicons name="add-circle" size={24} color="white" />
            <View>
              <Text style={styles.createButtonText}>Create New Ticket</Text>
              <Text style={styles.createButtonSubtext}>Get personalized support</Text>
            </View>
          </View>
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
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading support tickets...</Text>
            </View>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="help-circle-outline" size={64} color="#94a3b8" />
              </View>
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
                activeOpacity={0.95}
              >
                <View style={styles.ticketCardGradient}>
                  <View style={styles.ticketCardContent}>
                    <View style={styles.ticketCardHeader}>
                      <View style={styles.ticketInfo}>
                        <Text style={styles.ticketNumber}>
                          #{ticket.ticket_number || ticket.id || `T${index + 1}`}
                        </Text>
                        <Text style={styles.ticketTitle}>
                          {ticket.subject || ticket.title || 'Support Request'}
                        </Text>
                      </View>
                      <View style={styles.ticketMeta}>
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
                    </View>
                    
                    <View style={styles.ticketCardBody}>
                      <Text style={styles.ticketDescription} numberOfLines={2}>
                        {ticket.description || ticket.message || 'No description available'}
                      </Text>
                    </View>

                    <View style={styles.ticketCardFooter}>
                      <View style={styles.ticketStats}>
                        <View style={styles.ticketStat}>
                          <Ionicons name="calendar-outline" size={14} color="#64748b" />
                          <Text style={styles.ticketStatText}>
                            {formatDate(ticket.created_at)}
                          </Text>
                        </View>
                        <View style={styles.ticketStat}>
                          <Ionicons name="person-outline" size={14} color="#64748b" />
                          <Text style={styles.ticketStatText}>
                            {ticket.assigned_to || 'Unassigned'}
                          </Text>
                        </View>
                        {ticket.category && (
                          <View style={styles.ticketStat}>
                            <Ionicons name="folder-outline" size={14} color="#64748b" />
                            <Text style={styles.ticketStatText}>{ticket.category}</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity style={styles.ticketAction}>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Decorative elements */}
                  <View style={[styles.decorativeCircle, { backgroundColor: getStatusColor(ticket.status) + '20' }]} />
                  <View style={[styles.decorativeLine, { backgroundColor: getStatusColor(ticket.status) }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Need Immediate Help?</Text>
            <Text style={styles.sectionHeaderSubtitle}>Contact our support team directly</Text>
          </View>
          <View style={styles.contactCard}>
            <View style={styles.contactCardGradient}>
              <View style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="call" size={20} color="#3e60ab" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Phone Support</Text>
                  <Text style={styles.contactValue}>+91 9876543210</Text>
                </View>
                <TouchableOpacity style={styles.contactAction}>
                  <Ionicons name="call-outline" size={16} color="#3e60ab" />
                </TouchableOpacity>
              </View>
              <View style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="mail" size={20} color="#10b981" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email Support</Text>
                  <Text style={styles.contactValue}>support@finvera.com</Text>
                </View>
                <TouchableOpacity style={styles.contactAction}>
                  <Ionicons name="mail-outline" size={16} color="#10b981" />
                </TouchableOpacity>
              </View>
              <View style={styles.contactItem}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name="time" size={20} color="#f59e0b" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Business Hours</Text>
                  <Text style={styles.contactValue}>Mon-Fri: 9 AM - 6 PM IST</Text>
                </View>
                <View style={styles.contactBadge}>
                  <Text style={styles.contactBadgeText}>LIVE</Text>
                </View>
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
                <View style={[styles.modalIcon, { backgroundColor: selectedCategory?.bgColor || '#dbeafe' }]}>
                  <Ionicons name={selectedCategory?.icon || 'help-circle'} size={20} color={selectedCategory?.color || '#3e60ab'} />
                </View>
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
                <View style={styles.formHeader}>
                  <Ionicons name="document-text" size={20} color="#3e60ab" />
                  <Text style={styles.formHeaderText}>Ticket Details</Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Subject *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="text-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newTicket.subject}
                      onChangeText={(text) => setNewTicket(prev => ({ ...prev, subject: text }))}
                      placeholder="Brief description of your issue"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <View style={[styles.inputContainer, styles.textareaContainer]}>
                    <Ionicons name="document-outline" size={16} color="#9ca3af" style={[styles.inputIcon, styles.textareaIcon]} />
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
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.priorityOptions}>
                    {['low', 'medium', 'high'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          newTicket.priority === priority && styles.priorityOptionActive,
                          { borderColor: getPriorityColor(priority) }
                        ]}
                        onPress={() => setNewTicket(prev => ({ ...prev, priority }))}
                      >
                        <Text style={[
                          styles.priorityOptionText,
                          newTicket.priority === priority && styles.priorityOptionTextActive,
                          { color: newTicket.priority === priority ? 'white' : getPriorityColor(priority) }
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
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleSubmitTicket}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.spinner} />
                      <Text style={styles.primaryButtonText}>Creating...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="white" />
                      <Text style={styles.primaryButtonText}>Create Ticket</Text>
                    </>
                  )}
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
    backgroundColor: '#f8fafc',
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
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'Agency',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    fontFamily: 'Agency',
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
    borderColor: '#f1f5f9',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  categoriesGrid: {
    gap: 16,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryCardGradient: {
    position: 'relative',
    padding: 20,
  },
  categoryCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Agency',
  },
  createButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Agency',
    marginTop: 2,
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
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOpacity: 0.3,
  },
  filterTabText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    marginLeft: 6,
    fontWeight: '500',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 12,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    width: '100%',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  ticketsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  ticketCardGradient: {
    position: 'relative',
    padding: 20,
  },
  ticketCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    letterSpacing: -0.3,
  },
  ticketMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Agency',
    textTransform: 'capitalize',
  },
  ticketCardBody: {
    marginBottom: 16,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ticketStats: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  ticketStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketStatText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  ticketAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  contactCardGradient: {
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  contactAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Agency',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.1,
    zIndex: 1,
  },
  decorativeLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.3,
    zIndex: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  formHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textareaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textareaIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  textarea: {
    minHeight: 80,
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
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  priorityOptionActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Agency',
  },
  priorityOptionTextActive: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  primaryButton: {
    backgroundColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: 'white',
  },
});