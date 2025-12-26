/**
 * Get the base URL for uploads/images
 */
export const getUploadsBaseUrl = () => {
  // Priority 1: Check for explicit uploads base URL in env
  if (process.env.NEXT_PUBLIC_UPLOADS_BASE_URL) {
    return process.env.NEXT_PUBLIC_UPLOADS_BASE_URL;
  }
  
  // Priority 2: Check for explicit upload URL in env (e.g., https://finvera.illusiodesigns.agency/uploads)
  if (process.env.NEXT_PUBLIC_UPLOAD_URL) {
    return process.env.NEXT_PUBLIC_UPLOAD_URL;
  }
  
  // Fallback: Use API URL without /api
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://finvera.illusiodesigns.agency/api';
  return apiUrl.replace('/api', '');
};

/**
 * Get full image URL from database path
 * @param {string} imagePath - Path from database (e.g., "profile/abc123.jpg" or "/uploads/profile/abc123.jpg")
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get base URL
  const baseUrl = getUploadsBaseUrl();
  
  // Remove leading slash if present
  let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // If path already starts with 'uploads/', remove it (to avoid double /uploads/)
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.replace('uploads/', '');
  }
  
  // Construct full URL: baseUrl + /uploads/ + cleanPath
  // Example: https://finvera.illusiodesigns.agency/uploads/profile/abc123.jpg
  return `${baseUrl}/uploads/${cleanPath}`;
};

/**
 * Get profile image URL
 * @param {string} profileImagePath - Profile image path from database
 * @returns {string|null} Full URL to profile image or null
 */
export const getProfileImageUrl = (profileImagePath) => {
  return getImageUrl(profileImagePath);
};
