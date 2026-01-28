import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reviewAPI } from '../../../lib/api';

export default function ReviewScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [publicReviews, setPublicReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    reviewer_name: '',
    reviewer_designation: '',
    reviewer_company: ''
  });
  const [errors, setErrors] = useState({});

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch public reviews and user's own review in parallel
      const [publicResponse, myResponse] = await Promise.allSettled([
        reviewAPI.getPublic({ limit: 20 }),
        reviewAPI.getMy()
      ]);

      // Handle public reviews
      if (publicResponse.status === 'fulfilled') {
        const publicData = publicResponse.value.data?.data || [];
        setPublicReviews(Array.isArray(publicData) ? publicData : []);
      } else {
        console.error('Public reviews fetch error:', publicResponse.reason);
        setPublicReviews([]);
      }

      // Handle user's review
      if (myResponse.status === 'fulfilled') {
        const myData = myResponse.value.data?.data;
        setMyReview(myData || null);
        
        // Pre-fill form if user has a review
        if (myData) {
          setReviewForm({
            rating: myData.rating || 5,
            title: myData.title || '',
            comment: myData.comment || '',
            reviewer_name: myData.reviewer_name || '',
            reviewer_designation: myData.reviewer_designation || '',
            reviewer_company: myData.reviewer_company || ''
          });
        }
      } else {
        console.error('My review fetch error:', myResponse.reason);
        setMyReview(null);
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load reviews'
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleInputChange = (name, value) => {
    setReviewForm(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!reviewForm.reviewer_name || reviewForm.reviewer_name.trim() === '') {
      newErrors.reviewer_name = 'Name is required';
    }

    if (!reviewForm.comment || reviewForm.comment.trim() === '') {
      newErrors.comment = 'Review comment is required';
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      newErrors.rating = 'Please select a rating';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenReviewModal = (editing = false) => {
    setIsEditing(editing);
    setErrors({});
    if (!editing) {
      // Reset form for new review
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
        reviewer_name: '',
        reviewer_designation: '',
        reviewer_company: ''
      });
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please fix the errors in the form'
      });
      return;
    }

    try {
      setSaving(true);
      const reviewData = {
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || null,
        comment: reviewForm.comment.trim(),
        reviewer_name: reviewForm.reviewer_name.trim(),
        reviewer_designation: reviewForm.reviewer_designation.trim() || null,
        reviewer_company: reviewForm.reviewer_company.trim() || null
      };

      if (isEditing && myReview) {
        await reviewAPI.update(myReview.id, reviewData);
        showNotification({
          type: 'success',
          title: 'Review Updated',
          message: 'Your review has been updated and will be republished after approval'
        });
      } else {
        await reviewAPI.submit(reviewData);
        showNotification({
          type: 'success',
          title: 'Review Submitted',
          message: 'Thank you for your review! It will be published after admin approval'
        });
      }
      
      setShowReviewModal(false);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Submit review error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to submit review';
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      
      // Set specific field errors if provided
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
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

  const renderStars = (rating, size = 16, color = '#f59e0b') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={color}
        />
      );
    }
    return stars;
  };

  const renderInteractiveStars = (rating, onRatingChange) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onRatingChange(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={32}
            color="#f59e0b"
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getAverageRating = () => {
    if (publicReviews.length === 0) return 0;
    const total = publicReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (total / publicReviews.length).toFixed(1);
  };

  const getRatingDescription = (rating) => {
    switch (rating) {
      case 5: return 'Excellent!';
      case 4: return 'Very Good';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'Rate us';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Reviews & Feedback" 
          onMenuPress={handleMenuPress}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Reviews & Feedback" 
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
          <View style={styles.headerIcon}>
            <Ionicons name="star" size={32} color="#3e60ab" />
          </View>
          <Text style={styles.headerTitle}>Reviews & Feedback</Text>
          <Text style={styles.headerSubtitle}>
            Share your experience and read what others say about Finvera
          </Text>
        </View>

        {/* My Review Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <View style={styles.sectionCard}>
            {myReview ? (
              <View style={styles.myReviewContainer}>
                <View style={styles.myReviewHeader}>
                  <View style={styles.myReviewInfo}>
                    <Text style={styles.myReviewTitle}>
                      {myReview.title || 'Your Review'}
                    </Text>
                    <View style={styles.myReviewMeta}>
                      <View style={styles.myReviewStars}>
                        {renderStars(myReview.rating, 16)}
                      </View>
                      <Text style={styles.myReviewDate}>
                        {formatDate(myReview.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.myReviewStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: myReview.is_approved ? '#d1fae5' : '#fef3c7' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: myReview.is_approved ? '#065f46' : '#92400e' }
                      ]}>
                        {myReview.is_approved ? 'Approved' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.myReviewComment}>{myReview.comment}</Text>
                
                <TouchableOpacity 
                  style={styles.editReviewButton}
                  onPress={() => handleOpenReviewModal(true)}
                >
                  <Ionicons name="create-outline" size={16} color="#3e60ab" />
                  <Text style={styles.editReviewButtonText}>Edit Review</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noReviewContainer}>
                <View style={styles.noReviewIcon}>
                  <Ionicons name="star-outline" size={48} color="#9ca3af" />
                </View>
                <Text style={styles.noReviewTitle}>Share Your Experience</Text>
                <Text style={styles.noReviewDescription}>
                  Help others by sharing your experience with Finvera
                </Text>
                <TouchableOpacity 
                  style={styles.writeReviewButton}
                  onPress={() => handleOpenReviewModal(false)}
                >
                  <Ionicons name="create" size={20} color="white" />
                  <Text style={styles.writeReviewButtonText}>Write Review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Overall Rating Section */}
        {publicReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <View style={styles.sectionCard}>
              <View style={styles.overallRatingContent}>
                <View style={styles.ratingDisplay}>
                  <Text style={styles.ratingNumber}>{getAverageRating()}</Text>
                  <View style={styles.ratingStars}>
                    {renderStars(Math.round(getAverageRating()), 20)}
                  </View>
                  <Text style={styles.ratingCount}>
                    Based on {publicReviews.length} review{publicReviews.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Public Reviews */}
        {publicReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.reviewsList}>
              {publicReviews.map((review, index) => (
                <View key={review.id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {(review.reviewer_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewUserInfo}>
                        <Text style={styles.reviewUserName}>{review.reviewer_name}</Text>
                        {review.reviewer_designation && (
                          <Text style={styles.reviewUserDesignation}>
                            {review.reviewer_designation}
                            {review.reviewer_company && ` at ${review.reviewer_company}`}
                          </Text>
                        )}
                        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating || 0)}
                    </View>
                  </View>
                  
                  {review.title && (
                    <Text style={styles.reviewTitle}>{review.title}</Text>
                  )}
                  
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  
                  {review.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.featuredText}>Featured Review</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* App Store Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate us on App Stores</Text>
          <View style={styles.sectionCard}>
            <View style={styles.appStoreContent}>
              <View style={styles.appStoreIcon}>
                <Ionicons name="storefront" size={32} color="#3e60ab" />
              </View>
              <Text style={styles.appStoreTitle}>Love using Finvera?</Text>
              <Text style={styles.appStoreDescription}>
                Help others discover us by leaving a review on the app stores.
              </Text>
              
              <View style={styles.appStoreButtons}>
                <TouchableOpacity style={styles.appStoreButton} activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text style={styles.appStoreButtonText}>App Store</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.playStoreButton} activeOpacity={0.8}>
                  <Ionicons name="logo-google-playstore" size={20} color="white" />
                  <Text style={styles.playStoreButtonText}>Play Store</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Review' : 'Write Review'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowReviewModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Rating Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rating *</Text>
              <View style={styles.interactiveStars}>
                {renderInteractiveStars(reviewForm.rating, (rating) => 
                  handleInputChange('rating', rating)
                )}
              </View>
              <Text style={styles.ratingDescription}>
                {getRatingDescription(reviewForm.rating)}
              </Text>
              {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
            </View>

            {/* Personal Information */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={[styles.input, errors.reviewer_name && styles.inputError]}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={reviewForm.reviewer_name}
                onChangeText={(text) => handleInputChange('reviewer_name', text)}
              />
              {errors.reviewer_name && <Text style={styles.errorText}>{errors.reviewer_name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Designation</Text>
              <TextInput
                style={[styles.input, errors.reviewer_designation && styles.inputError]}
                placeholder="e.g., CEO, Accountant, Business Owner"
                placeholderTextColor="#9ca3af"
                value={reviewForm.reviewer_designation}
                onChangeText={(text) => handleInputChange('reviewer_designation', text)}
              />
              {errors.reviewer_designation && <Text style={styles.errorText}>{errors.reviewer_designation}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={[styles.input, errors.reviewer_company && styles.inputError]}
                placeholder="Your company name"
                placeholderTextColor="#9ca3af"
                value={reviewForm.reviewer_company}
                onChangeText={(text) => handleInputChange('reviewer_company', text)}
              />
              {errors.reviewer_company && <Text style={styles.errorText}>{errors.reviewer_company}</Text>}
            </View>

            {/* Review Content */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Review Title</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Brief title for your review"
                placeholderTextColor="#9ca3af"
                value={reviewForm.title}
                onChangeText={(text) => handleInputChange('title', text)}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Review *</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.comment && styles.inputError]}
                placeholder="Share your experience with Finvera..."
                placeholderTextColor="#9ca3af"
                value={reviewForm.comment}
                onChangeText={(text) => handleInputChange('comment', text)}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.formHint}>
                Tell us what you like about Finvera and how it has helped your business.
              </Text>
              {errors.comment && <Text style={styles.errorText}>{errors.comment}</Text>}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowReviewModal(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={saving}
              >
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  {saving ? 'Saving...' : (isEditing ? 'Update Review' : 'Submit Review')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  
  // Header Section
  headerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  
  // My Review Section
  myReviewContainer: {
    padding: 20,
  },
  myReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  myReviewInfo: {
    flex: 1,
  },
  myReviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  myReviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myReviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  myReviewDate: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  myReviewStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Agency',
    textTransform: 'uppercase',
  },
  myReviewComment: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Agency',
    lineHeight: 24,
    marginBottom: 20,
  },
  editReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e60ab',
    alignSelf: 'flex-start',
    gap: 8,
  },
  editReviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  
  // No Review State
  noReviewContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noReviewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noReviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  noReviewDescription: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  writeReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  
  // Overall Rating
  overallRatingContent: {
    padding: 24,
    alignItems: 'center',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 4,
  },
  ratingCount: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  
  // Reviews List
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  reviewUserDesignation: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Agency',
    lineHeight: 24,
    marginBottom: 16,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    fontFamily: 'Agency',
  },
  
  // App Store Section
  appStoreContent: {
    padding: 24,
    alignItems: 'center',
  },
  appStoreIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appStoreTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  appStoreDescription: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  appStoreButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  appStoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  appStoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  playStoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#01875f',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  playStoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  
  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Agency',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    fontFamily: 'Agency',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginTop: 6,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontFamily: 'Agency',
  },
  
  // Interactive Stars
  interactiveStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  submitButton: {
    backgroundColor: '#3e60ab',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
});