import { useState, useEffect, useMemo, useRef } from 'react';
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
import { accountingAPI, reportsAPI, companyAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate, extractPANFromGSTIN } from '../../lib/formatters';
import { getStartOfMonth, getEndOfMonth } from '../../lib/dateUtils';
import { getLedgerFieldsForGroup } from '../../lib/ledgerFieldConfig';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiEye, FiFileText, FiArrowLeft, FiMinus, FiPrinter } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

export default function LedgersList() {
  const { user } = useAuth();
  const router = useRouter();
  const { id, view } = router.query; // Support ?id=xxx&view=detail or ?id=xxx&view=statement
  const printRef = useRef(null);

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
      // Refresh the page to get updated data
      window.location.reload();
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

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${ledger?.ledger_name || 'Ledger Details'}</title>
          <style>
            @media print {
              @page {
                margin: 0.5cm;
                size: A4;
              }
              body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                color: #000;
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              padding: 20px;
              color: #000;
              background: #fff;
            }
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              background: #fff;
            }
            .print-header {
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .print-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .print-section {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
            }
            .print-section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .print-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .print-item {
              margin-bottom: 8px;
            }
            .print-label {
              font-weight: bold;
              color: #666;
              font-size: 11px;
              margin-bottom: 3px;
            }
            .print-value {
              color: #000;
              font-size: 12px;
            }
            .print-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            }
            .print-badge-danger {
              background-color: #fee;
              color: #c00;
            }
            .print-badge-success {
              background-color: #efe;
              color: #060;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
  
  // Fetch company information for statement header
  const { data: companyData } = useApi(
    () => {
      if (!user?.company_id) return Promise.resolve({ data: null });
      return companyAPI.get(user.company_id);
    },
    true,
    [user?.company_id]
  );
  const company = companyData?.data || companyData || {};

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
      render: (value, row) => {
        // Show balance with proper sign handling (negative for Cr, positive for Dr)
        const balanceValue = parseFloat(value) || 0;
        return formatCurrency(Math.abs(balanceValue));
      },
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
                {/* Print Content - Hidden in display, shown in print */}
                <div ref={printRef} style={{ display: 'none' }}>
                  <div className="print-container">
                    <div className="print-header">
                      <div className="print-title">{ledger.ledger_name || 'Ledger Details'}</div>
                      <div className="text-sm text-gray-600">Ledger Code: {ledger.ledger_code}</div>
                    </div>

                    <div className="print-section">
                      <div className="print-section-title">Balance Information</div>
                      <div className="print-grid">
                        <div className="print-item">
                          <div className="print-label">Current Balance</div>
                          <div className="print-value">{formatCurrency(balance.current_balance || 0)}</div>
                          <div className="print-value">
                            <span className={`print-badge ${balance.balance_type === 'debit' ? 'print-badge-danger' : 'print-badge-success'}`}>
                              {balance.balance_type || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="print-item">
                          <div className="print-label">Opening Balance</div>
                          <div className="print-value">{formatCurrency(ledger.opening_balance || 0)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="print-section">
                      <div className="print-section-title">Ledger Information</div>
                      <div className="print-grid">
                        <div className="print-item">
                          <div className="print-label">Ledger Code</div>
                          <div className="print-value">{ledger.ledger_code}</div>
                        </div>
                        <div className="print-item">
                          <div className="print-label">Account Group</div>
                          <div className="print-value">
                            {ledger.account_group?.group_name || ledger.account_group?.name || 'N/A'}
                          </div>
                        </div>
                        <div className="print-item">
                          <div className="print-label">Balance Type</div>
                          <div className="print-value">
                            <span className={`print-badge ${ledger.balance_type === 'debit' ? 'print-badge-danger' : 'print-badge-success'}`}>
                              {ledger.balance_type || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(ledger.gstin || ledger.pan || ledger.address || ledger.phone || ledger.email) && (
                      <div className="print-section">
                        <div className="print-section-title">Contact Information</div>
                        <div className="print-grid">
                          {ledger.gstin && (
                            <div className="print-item">
                              <div className="print-label">GSTIN</div>
                              <div className="print-value">{ledger.gstin}</div>
                            </div>
                          )}
                          {ledger.pan && (
                            <div className="print-item">
                              <div className="print-label">PAN</div>
                              <div className="print-value">{ledger.pan}</div>
                            </div>
                          )}
                          {ledger.address && (
                            <div className="print-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="print-label">Address</div>
                              <div className="print-value">
                                {ledger.address}
                                {ledger.city && `, ${ledger.city}`}
                                {ledger.state && `, ${ledger.state}`}
                                {ledger.pincode && ` - ${ledger.pincode}`}
                              </div>
                            </div>
                          )}
                          {ledger.phone && (
                            <div className="print-item">
                              <div className="print-label">Phone</div>
                              <div className="print-value">{ledger.phone}</div>
                            </div>
                          )}
                          {ledger.email && (
                            <div className="print-item">
                              <div className="print-label">Email</div>
                              <div className="print-value">{ledger.email}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Content */}
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
                  <Button variant="outline" onClick={handlePrint}>
                    <FiPrinter className="h-4 w-4 mr-2" />
                    Print
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

                {statement.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                      <div className="text-gray-500 text-sm font-medium">Opening Balance</div>
                      <div className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(statement.summary.opening_balance || 0)}
                      </div>
                      <div className="mt-2">
                        <Badge variant={statement.summary.opening_balance_type === 'Dr' ? 'danger' : 'success'}>
                          {statement.summary.opening_balance_type || 'Dr'}
                        </Badge>
                      </div>
                  </Card>
                    <Card>
                      <div className="text-gray-500 text-sm font-medium">Closing Balance</div>
                      <div className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(statement.summary.closing_balance || 0)}
                      </div>
                      <div className="mt-2">
                        <Badge variant={statement.summary.closing_balance_type === 'Dr' ? 'danger' : 'success'}>
                          {statement.summary.closing_balance_type || 'Dr'}
                        </Badge>
                      </div>
                    </Card>
                  </div>
                )}

                {statement.statement && statement.statement.length > 0 && (
                  <Card>
                    {/* Company Header */}
                    <div className="mb-6 pb-4 border-b">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900">
                          {company.company_name || 'Company Name'}
                        </h3>
                        {company.registered_address && (
                          <p className="text-sm text-gray-600 mt-1">
                            {company.registered_address}
                            {company.state && `, ${company.state}`}
                            {company.pincode && ` - ${company.pincode}`}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-gray-700 mt-2">
                          Ledger Statement - {ledger.ledger_name || 'Ledger'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Period: {formatDate(statementDateRange.from_date, 'DD-MM-YYYY')} to {formatDate(statementDateRange.to_date, 'DD-MM-YYYY')}
                        </p>
                      </div>
                      </div>

                    {/* Opening/Closing Summary */}
                    {statement.summary && (
                      <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
                      <div>
                          <div className="text-sm text-gray-500">Opening Date</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">
                            {formatDate(statementDateRange.from_date, 'DD-MM-YYYY')}
                      </div>
                          <div className="text-lg font-bold text-gray-900 mt-2">
                            {formatCurrency(statement.summary.opening_balance || 0)}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({statement.summary.opening_balance_type || 'Dr'})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Closing Date</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">
                            {formatDate(statementDateRange.to_date, 'DD-MM-YYYY')}
                          </div>
                          <div className="text-lg font-bold text-gray-900 mt-2">
                            {formatCurrency(statement.summary.closing_balance || 0)}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({statement.summary.closing_balance_type || 'Dr'})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              Voucher No.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              Particulars
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              Debit
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              Credit
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statement.statement.map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-b">
                                {formatDate(row.date, 'DD-MM-YYYY')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-b">
                                {row.voucher_number || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                {row.narration || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-b">
                                {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-b">
                                {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right border-b">
                                {formatCurrency(Math.abs(row.balance || 0))}
                              </td>
                            </tr>
                          ))}
                          {/* Totals Row */}
                          {statement.summary && (
                            <tr className="bg-yellow-50 font-semibold">
                              <td colSpan="3" className="px-4 py-3 text-sm text-gray-900 border-t-2 border-gray-400">
                                Total:
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-t-2 border-gray-400">
                                {statement.summary.total_debit > 0 ? formatCurrency(statement.summary.total_debit) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-t-2 border-gray-400">
                                {statement.summary.total_credit > 0 ? formatCurrency(statement.summary.total_credit) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right border-t-2 border-gray-400">
                                {formatCurrency(statement.summary.closing_balance || 0)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">All Ledgers</h2>
            </div>
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
                searchable={true}
                searchable={false}
            />
          </Card>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
