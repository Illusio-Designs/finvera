import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormDatePicker from '../../components/forms/FormDatePicker';
import FormTextarea from '../../components/forms/FormTextarea';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTable } from '../../hooks/useTable';
import { accountingAPI, reportsAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate, extractPANFromGSTIN } from '../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../lib/dateUtils';
import { getLedgerFieldsForGroup } from '../../lib/ledgerFieldConfig';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiFileText, FiArrowLeft, FiMinus } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';

export default function LedgersList() {
  const router = useRouter();
  const { id, view } = router.query; // Support ?id=xxx&view=detail or ?id=xxx&view=statement

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedLedgerId, setSelectedLedgerId] = useState(null);
  const [statementDateRange, setStatementDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const [formData, setFormData] = useState({
    ledger_name: '',
    account_group_id: '',
    opening_balance: '0',
    opening_balance_date: '',
    balance_type: 'debit',
    currency: 'INR',
    description: '',
    gstin: '',
    pan: '',
    // Address fields
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    phone: '',
    email: '',
    // Shipping locations (array of locations)
    shipping_locations: [],
    // Dynamic fields will be added based on account group
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch account groups for dropdown
  const { data: groupsData } = useApi(() => accountingAPI.accountGroups.list({ limit: 1000 }), true);
  const groups = groupsData?.data || groupsData || [];
  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: `${g.group_code} - ${g.name}`,
  }));

  // Get selected account group details
  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === formData.account_group_id) || null;
  }, [groups, formData.account_group_id]);

  // Check if selected group is Sundry Creditors or Sundry Debtors
  const isSundryCreditorOrDebtor = useMemo(() => {
    if (!selectedGroup) return false;
    const groupName = (selectedGroup.name || '').toLowerCase();
    return groupName.includes('sundry creditor') || groupName.includes('sundry debtor');
  }, [selectedGroup]);

  // Get dynamic fields for selected account group
  const dynamicFields = useMemo(() => {
    if (!selectedGroup) return {};
    return getLedgerFieldsForGroup(selectedGroup.name, selectedGroup.nature);
  }, [selectedGroup]);

  // Fetch selected ledger details
  const { data: ledgerData, loading: ledgerLoading, execute: fetchLedger } = useApi(
    (id) => {
      if (!id) {
        return Promise.reject(new Error('Ledger ID is required'));
      }
      return accountingAPI.ledgers.get(id);
    },
    false
  );

  // Fetch ledger balance
  const { data: balanceData, execute: fetchBalance } = useApi(
    (id) => {
      if (!id) {
        return Promise.reject(new Error('Ledger ID is required'));
      }
      return accountingAPI.ledgers.getBalance(id, {});
    },
    false
  );

  // Fetch ledger statement
  const { data: statementData, loading: statementLoading, execute: fetchStatement } = useApi(
    () => reportsAPI.ledgerStatement({ ledger_id: selectedLedgerId, ...statementDateRange }),
    false
  );

  // Handle router query params
  useEffect(() => {
    if (id) {
      setSelectedLedgerId(id);
      if (view === 'detail') {
        setShowDetail(true);
        fetchLedger(id).catch(err => {
          console.error('Error fetching ledger from URL:', err);
          if (err.response?.status === 404) {
            toast.error('Ledger not found');
            setShowDetail(false);
          }
        });
        fetchBalance(id).catch(err => console.error('Error fetching balance:', err));
      } else if (view === 'statement') {
        setShowStatement(true);
        fetchLedger(id).catch(err => {
          console.error('Error fetching ledger from URL:', err);
          if (err.response?.status === 404) {
            toast.error('Ledger not found');
            setShowStatement(false);
          }
        });
        fetchStatement().catch(err => console.error('Error fetching statement:', err));
      }
    }
  }, [id, view]);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(accountingAPI.ledgers.list, {});

  // Load ledger data when editing
  useEffect(() => {
    if (editingId && showForm) {
      accountingAPI.ledgers
        .get(editingId)
        .then((response) => {
          const ledger = response.data?.data || response.data;
          const baseData = {
            ledger_name: ledger.ledger_name || '',
            account_group_id: ledger.account_group_id || '',
            opening_balance: ledger.opening_balance?.toString() || '0',
            opening_balance_date: ledger.opening_balance_date || '',
            balance_type: ledger.balance_type || 'debit',
            currency: ledger.currency || 'INR',
            description: ledger.description || '',
            gstin: ledger.gstin || '',
            pan: ledger.pan || '',
            // Address fields
            address: ledger.address || '',
            city: ledger.city || '',
            state: ledger.state || '',
            pincode: ledger.pincode || '',
            country: ledger.country || '',
            phone: ledger.phone || '',
            email: ledger.email || '',
            // Shipping locations - handle both array format and legacy single location format
            shipping_locations: Array.isArray(ledger.shipping_locations) 
              ? ledger.shipping_locations 
              : (ledger.shipping_location_name || ledger.additional_fields?.shipping_location_name 
                ? [{
                    location_name: ledger.shipping_location_name || ledger.additional_fields?.shipping_location_name || '',
                    address: ledger.shipping_address || ledger.additional_fields?.shipping_address || '',
                    city: ledger.shipping_city || ledger.additional_fields?.shipping_city || '',
                    state: ledger.shipping_state || ledger.additional_fields?.shipping_state || '',
                    pincode: ledger.shipping_pincode || ledger.additional_fields?.shipping_pincode || '',
                    country: ledger.shipping_country || ledger.additional_fields?.shipping_country || '',
                  }]
                : []),
          };
          
          // Add any other additional fields from ledger data
          const additionalFields = {};
          Object.keys(ledger).forEach((key) => {
            if (!['id', 'ledger_name', 'ledger_code', 'account_group_id', 'opening_balance', 
                  'opening_balance_date', 'balance_type', 'currency', 'description', 
                  'gstin', 'pan', 'address', 'city', 'state', 'pincode', 'country', 'phone', 'email',
                  'shipping_locations', 'shipping_location_name', 'shipping_address', 'shipping_city', 'shipping_state', 'shipping_pincode', 'shipping_country',
                  'createdAt', 'updatedAt', 'is_active', 'account_group', 'additional_fields'].includes(key)) {
              additionalFields[key] = ledger[key] || '';
            }
          });
          
          setFormData({ ...baseData, ...additionalFields });
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to load ledger');
        });
    }
  }, [editingId, showForm]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.ledger_name.trim()) errors.ledger_name = 'Ledger name is required';
    if (!formData.account_group_id) errors.account_group_id = 'Account group is required';
    
    // Validate required dynamic fields
    Object.entries(dynamicFields).forEach(([key, field]) => {
      if (field.required && (!formData[key] || (typeof formData[key] === 'string' && !formData[key].trim()))) {
        errors[key] = `${field.label} is required`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      // Prepare payload - exclude ledger_code (auto-generated by backend)
      const { ledger_code, shipping_locations, ...payloadData } = formData;
      const payload = {
        ...payloadData,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        // Include shipping_locations as array
        shipping_locations: shipping_locations || [],
      };

      if (editingId) {
        await accountingAPI.ledgers.update(editingId, payload);
        toast.success('Ledger updated successfully');
      } else {
        await accountingAPI.ledgers.create(payload);
        toast.success('Ledger created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      refetch();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save ledger';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };

  const handleEdit = (ledger) => {
    setEditingId(ledger.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this ledger?')) return;
    try {
      await accountingAPI.ledgers.delete(id);
      toast.success('Ledger deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete ledger');
    }
  };

  const handleView = async (ledger) => {
    if (!ledger || !ledger.id) {
      toast.error('Invalid ledger data');
      return;
    }
    setSelectedLedgerId(ledger.id);
    setShowDetail(true);
    try {
      await fetchLedger(ledger.id);
      await fetchBalance(ledger.id);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Ledger not found');
        setShowDetail(false);
        setSelectedLedgerId(null);
      } else {
        toast.error('Failed to load ledger details');
        console.error('Error fetching ledger:', error);
      }
    }
  };

  const handleViewStatement = async (ledger) => {
    if (!ledger || !ledger.id) {
      toast.error('Invalid ledger data');
      return;
    }
    setSelectedLedgerId(ledger.id);
    setShowStatement(true);
    try {
      await fetchLedger(ledger.id);
      await fetchStatement();
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Ledger not found');
        setShowStatement(false);
        setSelectedLedgerId(null);
      } else {
        toast.error('Failed to load ledger statement');
        console.error('Error fetching ledger:', error);
      }
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedLedgerId(null);
    router.push('/client/ledgers', undefined, { shallow: true });
  };

  const handleCloseStatement = () => {
    setShowStatement(false);
    setSelectedLedgerId(null);
    router.push('/client/ledgers', undefined, { shallow: true });
  };

  const handleStatementDateChange = (field, value) => {
    setStatementDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateStatement = () => {
    if (selectedLedgerId) {
      fetchStatement();
    }
  };

  const resetForm = () => {
    setFormData({
      ledger_name: '',
      account_group_id: '',
      opening_balance: '0',
      opening_balance_date: '',
      balance_type: 'debit',
      currency: 'INR',
      description: '',
      gstin: '',
      pan: '',
      // Address fields
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      phone: '',
      email: '',
      // Shipping locations
      shipping_locations: [],
    });
    setFormErrors({});
  };

  // Render dynamic field based on field configuration
  const renderDynamicField = (key, field) => {
    const commonProps = {
      name: key,
      label: field.label,
      value: formData[key] || field.defaultValue || '',
      onChange: handleChange,
      error: formErrors[key],
      touched: !!formErrors[key],
      required: field.required || false,
    };

    // Special handling for GST and PAN fields
    if (key === 'gstin') {
      return (
        <FormInput
          key={key}
          {...commonProps}
          onChange={(name, value) => {
            // Convert to uppercase automatically and remove spaces
            const upperValue = value.toUpperCase().replace(/\s/g, '');
            setFormData(prev => {
              const updated = { ...prev, [name]: upperValue };
              
              // Auto-fill PAN from GSTIN when GSTIN is 15 characters
              if (upperValue.length === 15) {
                const extractedPAN = extractPANFromGSTIN(upperValue);
                if (extractedPAN && !prev.pan) {
                  // Only auto-fill if PAN is empty
                  updated.pan = extractedPAN;
                }
              }
              
              return updated;
            });
            
            // Clear error if exists
            if (formErrors[name]) {
              setFormErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
              });
            }
          }}
          placeholder="27ABCDE1234F1Z5 (15 characters)"
          maxLength={15}
          style={{ textTransform: 'uppercase' }}
        />
      );
    }

    if (key === 'pan') {
      return (
        <FormInput
          key={key}
          {...commonProps}
          onChange={(name, value) => {
            // Convert to uppercase automatically
            const upperValue = value.toUpperCase().replace(/\s/g, '');
            handleChange(name, upperValue);
          }}
          placeholder="ABCDE1234F"
          maxLength={10}
          style={{ textTransform: 'uppercase' }}
        />
      );
    }

    switch (field.type) {
      case 'text':
        return <FormInput key={key} {...commonProps} />;
      case 'number':
        return <FormInput key={key} {...commonProps} type="number" step="0.01" />;
      case 'date':
        return <FormDatePicker key={key} {...commonProps} />;
      case 'textarea':
        return <FormTextarea key={key} {...commonProps} />;
      case 'select':
        return <FormSelect key={key} {...commonProps} options={field.options || []} />;
      case 'display':
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {field.value || 'N/A'}
            </div>
          </div>
        );
      default:
        return <FormInput key={key} {...commonProps} />;
    }
  };

  const columns = [
    { key: 'ledger_name', label: 'Ledger Name', sortable: true },
    { key: 'ledger_code', label: 'Code', sortable: true },
    {
      key: 'account_group_id',
      label: 'Account Group',
      sortable: false,
      render: (value, row) => {
        if (row.account_group) {
          return `${row.account_group.group_code || ''} - ${row.account_group.name || row.account_group.group_name || 'N/A'}`;
        }
        return 'N/A';
      },
    },
    {
      key: 'opening_balance',
      label: 'Opening Balance',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance_type',
      label: 'Balance Type',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'debit' ? 'danger' : 'success'}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            className="text-primary-600 hover:text-primary-700"
            title="View Details"
          >
            <FiEye className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewStatement(row);
            }}
            className="text-blue-600 hover:text-blue-700"
            title="View Statement"
          >
            <FiFileText className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-primary-600 hover:text-primary-700"
            title="Edit"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  const ledger = ledgerData?.data || ledgerData;
  const balance = balanceData?.data || balanceData || {};
  const statement = statementData?.data || statementData || {};

  const statementColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value, 'DD-MM-YYYY'),
    },
    {
      key: 'voucher_number',
      label: 'Voucher No.',
    },
    {
      key: 'narration',
      label: 'Particulars',
    },
    {
      key: 'debit',
      label: 'Debit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => formatCurrency(value || 0),
    },
  ];

  return (
    <ProtectedRoute>
      <ClientLayout title="Ledgers - Client Portal">
        <PageLayout
          title="Ledgers"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Ledgers', href: '/client/ledgers' },
          ]}
          actions={
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                resetForm();
              }}
            >
              <FiPlus className="h-4 w-4 mr-2" />
              New Ledger
            </Button>
          }
        >
          {/* Create/Edit Modal */}
          <Modal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            }}
            title={editingId ? 'Edit Ledger' : 'New Ledger'}
            size="xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="ledger_name"
                    label="Ledger Name"
                    value={formData.ledger_name}
                    onChange={handleChange}
                    error={formErrors.ledger_name}
                    touched={!!formErrors.ledger_name}
                    required
                  />

                  <FormSelect
                    name="account_group_id"
                    label="Account Group"
                    value={formData.account_group_id}
                    onChange={handleChange}
                    error={formErrors.account_group_id}
                    touched={!!formErrors.account_group_id}
                    required
                    options={groupOptions}
                  />
                </div>

                {selectedGroup && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Selected Group:</span> {selectedGroup.name} 
                      <span className="ml-2 text-blue-600">({selectedGroup.nature})</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Fields based on Account Group */}
              {selectedGroup && Object.keys(dynamicFields).length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Account Group Specific Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(dynamicFields)
                      .filter(([key]) => key !== 'ledger_name' && key !== 'account_group')
                      .map(([key, field]) => renderDynamicField(key, field))}
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Common Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!dynamicFields.opening_balance && (
                    <FormInput
                      name="opening_balance"
                      label="Opening Balance"
                      type="number"
                      value={formData.opening_balance}
                      onChange={handleChange}
                      error={formErrors.opening_balance}
                      touched={!!formErrors.opening_balance}
                      step="0.01"
                    />
                  )}

                  <FormSelect
                    name="balance_type"
                    label="Balance Type"
                    value={formData.balance_type}
                    onChange={handleChange}
                    error={formErrors.balance_type}
                    touched={!!formErrors.balance_type}
                    options={[
                      { value: 'debit', label: 'Debit' },
                      { value: 'credit', label: 'Credit' },
                    ]}
                  />

                  {!dynamicFields.currency && (
                    <FormInput
                      name="currency"
                      label="Currency"
                      value={formData.currency}
                      onChange={handleChange}
                      error={formErrors.currency}
                      touched={!!formErrors.currency}
                    />
                  )}

                  {!dynamicFields.opening_balance_date && (
                    <FormDatePicker
                      name="opening_balance_date"
                      label="Opening Balance Date"
                      value={formData.opening_balance_date}
                      onChange={handleChange}
                      error={formErrors.opening_balance_date}
                      touched={!!formErrors.opening_balance_date}
                    />
                  )}
                </div>

                {!dynamicFields.description && (
                  <FormTextarea
                    name="description"
                    label="Description/Notes"
                    value={formData.description}
                    onChange={handleChange}
                    error={formErrors.description}
                    touched={!!formErrors.description}
                  />
                )}
              </div>

              {/* Tax Information (Optional) */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Tax Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="gstin"
                    label="GSTIN"
                    value={formData.gstin}
                    onChange={(name, value) => {
                      // Convert to uppercase automatically and remove spaces
                      const upperValue = value.toUpperCase().replace(/\s/g, '');
                      setFormData(prev => {
                        const updated = { ...prev, [name]: upperValue };
                        
                        // Auto-fill PAN from GSTIN when GSTIN is 15 characters
                        if (upperValue.length === 15) {
                          const extractedPAN = extractPANFromGSTIN(upperValue);
                          if (extractedPAN && !prev.pan) {
                            // Only auto-fill if PAN is empty
                            updated.pan = extractedPAN;
                          }
                        }
                        
                        return updated;
                      });
                      
                      // Clear error if exists
                      if (formErrors[name]) {
                        setFormErrors(prev => {
                          const next = { ...prev };
                          delete next[name];
                          return next;
                        });
                      }
                    }}
                    error={formErrors.gstin}
                    touched={!!formErrors.gstin}
                    placeholder="27ABCDE1234F1Z5 (15 characters)"
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                  />

                  <FormInput
                    name="pan"
                    label="PAN"
                    value={formData.pan}
                    onChange={(name, value) => {
                      // Convert to uppercase automatically
                      const upperValue = value.toUpperCase().replace(/\s/g, '');
                      handleChange(name, upperValue);
                    }}
                    error={formErrors.pan}
                    touched={!!formErrors.pan}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              {/* Address Details (for Sundry Creditors/Debtors) */}
              {isSundryCreditorOrDebtor && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormInput
                        name="address"
                        label="Street Address"
                        value={formData.address}
                        onChange={handleChange}
                        error={formErrors.address}
                        touched={!!formErrors.address}
                        placeholder="Building, Street, Area"
                      />
                    </div>
                    <FormInput
                      name="city"
                      label="City"
                      value={formData.city}
                      onChange={handleChange}
                      error={formErrors.city}
                      touched={!!formErrors.city}
                    />
                    <FormInput
                      name="state"
                      label="State"
                      value={formData.state}
                      onChange={handleChange}
                      error={formErrors.state}
                      touched={!!formErrors.state}
                    />
                    <FormInput
                      name="pincode"
                      label="Pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      error={formErrors.pincode}
                      touched={!!formErrors.pincode}
                      maxLength={10}
                    />
                    <FormInput
                      name="country"
                      label="Country"
                      value={formData.country}
                      onChange={handleChange}
                      error={formErrors.country}
                      touched={!!formErrors.country}
                      placeholder="India"
                    />
                    <FormInput
                      name="phone"
                      label="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      error={formErrors.phone}
                      touched={!!formErrors.phone}
                      type="tel"
                    />
                    <FormInput
                      name="email"
                      label="Email"
                      value={formData.email}
                      onChange={handleChange}
                      error={formErrors.email}
                      touched={!!formErrors.email}
                      type="email"
                    />
                  </div>
                </div>
              )}

              {/* Shipping Locations (for Sundry Creditors/Debtors) */}
              {isSundryCreditorOrDebtor && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Shipping Locations</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          shipping_locations: [
                            ...(prev.shipping_locations || []),
                            {
                              location_name: '',
                              address: '',
                              city: '',
                              state: '',
                              pincode: '',
                              country: '',
                            }
                          ]
                        }));
                      }}
                    >
                      <FiPlus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                  
                  {formData.shipping_locations && formData.shipping_locations.length > 0 ? (
                    <div className="space-y-6">
                      {formData.shipping_locations.map((location, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Location {index + 1}
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  shipping_locations: prev.shipping_locations.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              <FiMinus className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                              name={`shipping_locations[${index}].location_name`}
                              label="Location Name"
                              value={location.location_name || ''}
                              onChange={(name, value) => {
                                const newLocations = [...formData.shipping_locations];
                                newLocations[index] = { ...newLocations[index], location_name: value };
                                setFormData(prev => ({ ...prev, shipping_locations: newLocations }));
                              }}
                              error={formErrors[`shipping_locations.${index}.location_name`]}
                              touched={!!formErrors[`shipping_locations.${index}.location_name`]}
                              placeholder="e.g., Main Warehouse, Branch Office"
                            />
                            <div className="md:col-span-2">
                              <FormInput
                                name={`shipping_locations[${index}].address`}
                                label="Shipping Address"
                                value={location.address || ''}
                                onChange={(name, value) => {
                                  const newLocations = [...formData.shipping_locations];
                                  newLocations[index] = { ...newLocations[index], address: value };
                                  setFormData(prev => ({ ...prev, shipping_locations: newLocations }));
                                }}
                                error={formErrors[`shipping_locations.${index}.address`]}
                                touched={!!formErrors[`shipping_locations.${index}.address`]}
                                placeholder="Building, Street, Area"
                              />
                            </div>
                            <FormInput
                              name={`shipping_locations[${index}].city`}
                              label="City"
                              value={location.city || ''}
                              onChange={(name, value) => {
                                const newLocations = [...formData.shipping_locations];
                                newLocations[index] = { ...newLocations[index], city: value };
                                setFormData(prev => ({ ...prev, shipping_locations: newLocations }));
                              }}
                              error={formErrors[`shipping_locations.${index}.city`]}
                              touched={!!formErrors[`shipping_locations.${index}.city`]}
                            />
                            <FormInput
                              name={`shipping_locations[${index}].state`}
                              label="State"
                              value={location.state || ''}
                              onChange={(name, value) => {
                                const newLocations = [...formData.shipping_locations];
                                newLocations[index] = { ...newLocations[index], state: value };
                                setFormData(prev => ({ ...prev, shipping_locations: newLocations }));
                              }}
                              error={formErrors[`shipping_locations.${index}.state`]}
                              touched={!!formErrors[`shipping_locations.${index}.state`]}
                            />
                            <FormInput
                              name={`shipping_locations[${index}].pincode`}
                              label="Pincode"
                              value={location.pincode || ''}
                              onChange={(name, value) => {
                                const newLocations = [...formData.shipping_locations];
                                newLocations[index] = { ...newLocations[index], pincode: value };
                                setFormData(prev => ({ ...prev, shipping_locations: newLocations }));
                              }}
                              error={formErrors[`shipping_locations.${index}.pincode`]}
                              touched={!!formErrors[`shipping_locations.${index}.pincode`]}
                              maxLength={10}
                            />
                            <FormInput
                              name={`shipping_locations[${index}].country`}
                              label="Country"
                              value={location.country || ''}
                              onChange={(name, value) => {
                                const newLocations = [...formData.shipping_locations];
                                newLocations[index] = { ...newLocations[index], country: value };
                                setFormData(prev => ({ ...prev, shipping_locations: newLocations }));
                              }}
                              error={formErrors[`shipping_locations.${index}.country`]}
                              touched={!!formErrors[`shipping_locations.${index}.country`]}
                              placeholder="India"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No shipping locations added. Click &quot;Add Location&quot; to add one.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <FiSave className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'} Ledger
                </Button>
              </div>
            </form>
          </Modal>

          {/* Detail View Modal */}
          <Modal
            isOpen={showDetail}
            onClose={handleCloseDetail}
            title={ledger ? `${ledger.ledger_name} - Details` : 'Ledger Details'}
            size="xl"
          >
            {ledgerLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : ledger ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="text-gray-500 text-sm font-medium">Current Balance</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(balance.current_balance || 0)}
                    </div>
                    <div className="mt-2">
                      <Badge variant={balance.balance_type === 'debit' ? 'danger' : 'success'}>
                        {balance.balance_type || 'N/A'}
                      </Badge>
                    </div>
                  </Card>
                  <Card>
                    <div className="text-gray-500 text-sm font-medium">Opening Balance</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(ledger.opening_balance || 0)}
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Ledger Information">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Ledger Code</dt>
                        <dd className="mt-1 text-sm text-gray-900">{ledger.ledger_code}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account Group</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {ledger.account_group?.group_name || ledger.account_group?.name || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Balance Type</dt>
                        <dd className="mt-1">
                          <Badge variant={ledger.balance_type === 'debit' ? 'danger' : 'success'}>
                            {ledger.balance_type || 'N/A'}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  </Card>

                  {(ledger.gstin || ledger.pan || ledger.address) && (
                    <Card title="Contact Information">
                      <dl className="space-y-4">
                        {ledger.gstin && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ledger.gstin}</dd>
                          </div>
                        )}
                        {ledger.pan && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">PAN</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ledger.pan}</dd>
                          </div>
                        )}
                        {ledger.address && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {ledger.address}
                              {ledger.city && `, ${ledger.city}`}
                              {ledger.state && `, ${ledger.state}`}
                              {ledger.pincode && ` - ${ledger.pincode}`}
                            </dd>
                          </div>
                        )}
                        {ledger.phone && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ledger.phone}</dd>
                          </div>
                        )}
                        {ledger.email && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ledger.email}</dd>
                          </div>
                        )}
                      </dl>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCloseDetail}>
                    <FiArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetail(false);
                      setShowStatement(true);
                      fetchStatement();
                    }}
                  >
                    <FiFileText className="h-4 w-4 mr-2" />
                    View Statement
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetail(false);
                      handleEdit(ledger);
                    }}
                  >
                    <FiEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-red-600">Ledger not found</p>
              </div>
            )}
          </Modal>

          {/* Statement View Modal */}
          <Modal
            isOpen={showStatement}
            onClose={handleCloseStatement}
            title={ledger ? `${ledger.ledger_name} - Statement` : 'Ledger Statement'}
            size="full"
          >
            {ledgerLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : ledger ? (
              <div className="space-y-6">
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormDatePicker
                      name="from_date"
                      label="From Date"
                      value={statementDateRange.from_date}
                      onChange={(name, value) => handleStatementDateChange('from_date', value)}
                    />
                    <FormDatePicker
                      name="to_date"
                      label="To Date"
                      value={statementDateRange.to_date}
                      onChange={(name, value) => handleStatementDateChange('to_date', value)}
                    />
                  </div>
                  <div className="mt-4">
                    <Button onClick={handleGenerateStatement} loading={statementLoading}>
                      Generate Statement
                    </Button>
                  </div>
                </Card>

                {statement.statement && statement.statement.length > 0 && (
                  <Card>
                    <DataTable
                      columns={statementColumns}
                      data={statement.statement || []}
                      loading={statementLoading}
                    />
                  </Card>
                )}

                {statement.closing_balance !== undefined && (
                  <Card title="Summary">
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Opening Balance</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(statement.ledger?.opening_balance || 0)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Debit</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(
                            statement.statement?.reduce((sum, t) => sum + (t.debit || 0), 0) || 0
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Credit</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(
                            statement.statement?.reduce((sum, t) => sum + (t.credit || 0), 0) || 0
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Closing Balance</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(statement.closing_balance || 0)}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCloseStatement}>
                    <FiArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-red-600">Ledger not found</p>
              </div>
            )}
          </Modal>

          {/* Main List Table */}
          <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={tableData?.data || tableData || []}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
              onRowClick={(row) => handleView(row)}
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
