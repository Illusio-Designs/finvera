/**
 * Get the base URL for uploads/images
 */
export const getUploadsBaseUrl = () => {
  // Check for explicit upload URL in env (e.g., http://localhost:3000/upload)
  if (process.env.NEXT_PUBLIC_UPLOAD_URL) {
    return process.env.NEXT_PUBLIC_UPLOAD_URL;
  }
  
  // Check for explicit uploads base URL in env (legacy support)
  if (process.env.NEXT_PUBLIC_UPLOADS_BASE_URL) {
    return process.env.NEXT_PUBLIC_UPLOADS_BASE_URL;
  }
  
  // Fallback to API URL without /api
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  return apiUrl.replace('/api', '');
};

/**
 * Get full image URL from database path
 * @param {string} imagePath - Path from database (e.g., "profile/abc123.jpg")
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Get base URL
  const baseUrl = getUploadsBaseUrl();
  
  // If NEXT_PUBLIC_UPLOAD_URL is set, it should already include the path prefix
  // Otherwise, append /uploads/ to the base URL
  if (process.env.NEXT_PUBLIC_UPLOAD_URL) {
    // Base URL already includes the upload path (e.g., http://localhost:3000/upload)
    // Just append the image path
    return `${baseUrl}/${cleanPath}`;
  } else {
    // Legacy: append /uploads/ to base URL
    return `${baseUrl}/uploads/${cleanPath}`;
  }
};

/**
 * Get profile image URL
 * @param {string} profileImagePath - Profile image path from database
 * @returns {string|null} Full URL to profile image or null
 */
export const getProfileImageUrl = (profileImagePath) => {
  return getImageUrl(profileImagePath);
};
