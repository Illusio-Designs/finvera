import { useState } from 'react';
import { FiX, FiMapPin, FiSave, FiLoader } from 'react-icons/fi';
import { branchAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const CreateBranchModal = ({ isOpen, onClose, companyId, onBranchCreated }) => {
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.branch_name.trim()) {
      newErrors.branch_name = 'Branch name is required';
    }
    
    if (!formData.branch_code.trim()) {
      newErrors.branch_code = 'Branch code is required';
    } else if (formData.branch_code.length < 2) {
      newErrors.branch_code = 'Branch code must be at least 2 characters';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const branchData = {
        ...formData,
        company_id: companyId
      };
      
      const response = await branchAPI.create(branchData);
      const createdBranch = response.data?.data || response.data;
      
      // Use the branch name from form data for immediate feedback
      toast.success(`Branch "${formData.branch_name}" created successfully!`);
      
      // Reset form
      setFormData({
        branch_name: '',
        branch_code: '',
        gstin: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: ''
      });
      
      // Notify parent component with the created branch data
      if (onBranchCreated) {
        onBranchCreated(createdBranch);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating branch:', error);
      
      // Extract error message from different possible response structures
      let errorMessage = 'Failed to create branch';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        branch_name: '',
        branch_code: '',
        gstin: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: ''
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-in zoom-in-95 duration-200 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
              <FiLoader className="h-5 w-5 animate-spin text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Creating branch...</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiMapPin className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Branch</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.branch_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="Enter branch name"
                  disabled={loading}
                />
                {errors.branch_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.branch_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branch_code"
                  value={formData.branch_code}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.branch_code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="e.g. HO, MUM01, DEL02"
                  disabled={loading}
                />
                {errors.branch_code && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.branch_code}
                  </p>
                )}
                {!errors.branch_code && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be unique for this company
                  </p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm resize-none ${
                  errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                }`}
                placeholder="Enter complete address"
                disabled={loading}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiX className="h-3 w-3" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="Enter city"
                  disabled={loading}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.state ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="Enter state"
                  disabled={loading}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.state}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.pincode ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="Enter pincode"
                  disabled={loading}
                />
                {errors.pincode && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.pincode}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                  <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                  <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                    errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiX className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSTIN
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm"
                placeholder="Enter GSTIN"
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 bg-gray-50/30 px-6 py-4 -mx-6 -mb-6 mt-6 rounded-b-xl">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiSave className="h-4 w-4" />
              )}
              {loading ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBranchModal;