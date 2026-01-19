import { useState } from 'react';
import { FiX, FiUsers, FiSave, FiLoader } from 'react-icons/fi';
import { accountingAPI } from '../../lib/api';
import { extractPANFromGSTIN } from '../../lib/formatters';
import toast from 'react-hot-toast';

const CreateSupplierModal = ({ isOpen, onClose, onSupplierCreated }) => {
  const [formData, setFormData] = useState({
    ledger_name: '',
    ledger_code: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    country: 'India',
    contact_number: '',
    email: '',
    opening_balance: '0',
    opening_balance_type: 'Cr',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Auto-set PAN when GSTIN changes
      if (name === 'gstin' && value) {
        const extractedPAN = extractPANFromGSTIN(value);
        if (extractedPAN) {
          updated.pan = extractedPAN;
        }
      }
      
      return updated;
    });
    
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
    
    if (!formData.ledger_name.trim()) {
      newErrors.ledger_name = 'Supplier name is required';
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
    
    if (formData.contact_number && !/^\d{10}$/.test(formData.contact_number.replace(/\D/g, ''))) {
      newErrors.contact_number = 'Phone number must be 10 digits';
    }

    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format';
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
      // Find the Sundry Creditors account group ID
      const groupsResponse = await accountingAPI.groups.list();
      const groups = groupsResponse.data?.data || groupsResponse.data || [];
      const creditorGroup = groups.find(group => 
        group.name?.toLowerCase().includes('sundry creditor') || 
        group.name?.toLowerCase().includes('creditor')
      );

      if (!creditorGroup) {
        throw new Error('Sundry Creditors account group not found');
      }

      const supplierData = {
        ...formData,
        account_group_id: creditorGroup.id,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        is_active: true,
      };
      
      const response = await accountingAPI.ledgers.create(supplierData);
      const createdSupplier = response.data?.data || response.data;
      
      toast.success(`Supplier "${formData.ledger_name}" created successfully!`);
      
      // Reset form
      setFormData({
        ledger_name: '',
        ledger_code: '',
        gstin: '',
        pan: '',
        address: '',
        city: '',
        state: 'Maharashtra',
        pincode: '',
        country: 'India',
        contact_number: '',
        email: '',
        opening_balance: '0',
        opening_balance_type: 'Cr',
      });
      
      // Notify parent component with the created supplier data
      if (onSupplierCreated) {
        onSupplierCreated(createdSupplier);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating supplier:', error);
      
      let errorMessage = 'Failed to create supplier';
      
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
        ledger_name: '',
        ledger_code: '',
        gstin: '',
        pan: '',
        address: '',
        city: '',
        state: 'Maharashtra',
        pincode: '',
        country: 'India',
        contact_number: '',
        email: '',
        opening_balance: '0',
        opening_balance_type: 'Cr',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-in zoom-in-95 duration-200 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
              <FiLoader className="h-5 w-5 animate-spin text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Creating supplier...</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <FiUsers className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Supplier</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ledger_name"
                    value={formData.ledger_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                      errors.ledger_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                    }`}
                    placeholder="Enter supplier name"
                    disabled={loading}
                  />
                  {errors.ledger_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiX className="h-3 w-3" />
                      {errors.ledger_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Code
                    <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="ledger_code"
                    value={formData.ledger_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm"
                    placeholder="e.g. SUP001, VENDOR01"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                      errors.gstin ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                    }`}
                    placeholder="22AAAAA0000A1Z5"
                    disabled={loading}
                  />
                  {errors.gstin && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiX className="h-3 w-3" />
                      {errors.gstin}
                    </p>
                  )}
                  {!errors.gstin && formData.gstin && formData.pan && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ Valid GSTIN format - PAN auto-extracted
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN
                    <span className="text-gray-400 text-xs ml-1">(Auto-filled from GSTIN)</span>
                  </label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                      formData.gstin && formData.pan ? 'bg-gray-50 text-gray-600' : ''
                    } ${
                      errors.pan ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                    }`}
                    placeholder="AAAAA0000A"
                    disabled={loading}
                    readOnly={formData.gstin && formData.pan}
                  />
                  {errors.pan && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiX className="h-3 w-3" />
                      {errors.pan}
                    </p>
                  )}
                  {formData.gstin && formData.pan && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ PAN automatically extracted from GSTIN
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Address Information
              </h3>
              <div className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                        errors.state ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Assam">Assam</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Goa">Goa</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Sikkim">Sikkim</option>
                    </select>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                    <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm ${
                      errors.contact_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                  {errors.contact_number && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiX className="h-3 w-3" />
                      {errors.contact_number}
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
            </div>

            {/* Opening Balance */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Opening Balance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Balance Amount
                  </label>
                  <input
                    type="number"
                    name="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance Type
                  </label>
                  <select
                    name="opening_balance_type"
                    value={formData.opening_balance_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition shadow-sm"
                    disabled={loading}
                  >
                    <option value="Cr">Credit (We owe them)</option>
                    <option value="Dr">Debit (They owe us)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50/30 to-primary-50/30 px-6 py-4 -mx-6 -mb-6 mt-6 rounded-b-xl">
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiSave className="h-4 w-4" />
              )}
              {loading ? 'Creating...' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSupplierModal;