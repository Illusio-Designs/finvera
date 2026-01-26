import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
      showNotification('Failed to load support tickets', 'error');
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
    showNotification('Create new support ticket functionality will be available soon', 'info');
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
    { title: 'Technical Support', icon: 'settings-outline', color: '#3e60ab' },
    { title: 'Billing Issues', icon: 'card-outline', color: '#10b981' },
    { title: 'Feature Request', icon: 'bulb-outline', color: '#f59e0b' },
    { title: 'Bug Report', icon: 'bug-outline', color: '#ef4444' },
    { title: 'Account Help', icon: 'person-outline', color: '#8b5cf6' },
    { title: 'General Inquiry', icon: 'help-circle-outline', color: '#6b7280' },
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
        {/* Quick Support Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>How can we help you?</Text>
          <View style={styles.categoriesGrid}>
            {supportCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => showNotification('This will open the support form', 'info')}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={20} color="white" />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Ticket Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create New Ticket</Text>
        </TouchableOpacity>

        {/* Filter Tabs */}
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
                color={filter === option.key ? 'white' : '#6b7280'} 
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

        {/* Support Tickets List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading support tickets...</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'You haven\'t created any support tickets yet' 
                : `No ${filter.replace('_', ' ')} tickets found`}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateTicket}>
              <Text style={styles.emptyButtonText}>Create Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {tickets.map((ticket, index) => (
              <TouchableOpacity
                key={ticket.id || index}
                style={styles.ticketCard}
                onPress={() => handleTicketPress(ticket)}
              >
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
                      <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                      <Text style={styles.ticketStatText}>
                        {formatDate(ticket.created_at)}
                      </Text>
                    </View>
                    <View style={styles.ticketStat}>
                      <Ionicons name="person-outline" size={14} color="#9ca3af" />
                      <Text style={styles.ticketStatText}>
                        {ticket.assigned_to || 'Unassigned'}
                      </Text>
                    </View>
                    {ticket.category && (
                      <View style={styles.ticketStat}>
                        <Ionicons name="folder-outline" size={14} color="#9ca3af" />
                        <Text style={styles.ticketStatText}>{ticket.category}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.ticketAction}>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Need Immediate Help?</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Ionicons name="call" size={20} color="#3e60ab" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+91 9876543210</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color="#3e60ab" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@finvera.com</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="time" size={20} color="#3e60ab" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Business Hours</Text>
                <Text style={styles.contactValue}>Mon-Fri: 9 AM - 6 PM IST</Text>
              </View>
            </View>
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
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  categoriesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    marginLeft: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginLeft: 4,
  },
  filterTabTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  ticketsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketCardHeader: {
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
    fontSize: 12,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  ticketMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Agency',
    textTransform: 'capitalize',
  },
  ticketCardBody: {
    marginBottom: 12,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  ticketAction: {
    padding: 4,
  },
  contactSection: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  contactValue: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginTop: 2,
  },
});