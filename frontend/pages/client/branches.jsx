import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormPhoneInput from '../../components/forms/FormPhoneInput';
import FormTextarea from '../../components/forms/FormTextarea';
import DataTable from '../../components/tables/DataTable';
import toast from 'react-hot-toast';
import { branchAPI, subscriptionAPI, companyAPI } from '../../lib/api';
import { FiPlus, FiX, FiSave, FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function BranchesPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    company_id: '',
    branch_name: '',
    branch_code: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_number: '',
    email: '',
  });

  // Fetch subscription and companies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subscriptionRes, companiesRes] = await Promise.all([
          subscriptionAPI.getCurrent().catch(() => ({ data: { subscription: null } })),
          companyAPI.list().catch(() => ({ data: { data: [] } })),
        ]);
        
        const sub = subscriptionRes?.data?.subscription;
        setSubscription(sub);
        
        const companiesList = companiesRes?.data?.data || companiesRes?.data || [];
        setCompanies(companiesList);
        
        // Auto-select first company if available
        if (companiesList.length > 0 && !selectedCompany) {
          setSelectedCompany(companiesList[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch branches when company is selected
  useEffect(() => {
    if (selectedCompany) {
      fetchBranches();
    }
  }, [selectedCompany, fetchBranches]);

  const fetchBranches = useCallback(async () => {
    if (!selectedCompany) return;
    try {
      const response = await branchAPI.list(selectedCompany);
      setBranches(response?.data?.data || response?.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    }
  }, [selectedCompany]);

  const resetForm = () => {
    setFormData({
      company_id: selectedCompany || '',
      branch_name: '',
      branch_code: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contact_number: '',
      email: '',
    });
    setFormErrors({});
    setShowForm(false);
    setEditingBranch(null);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.branch_name.trim()) errors.branch_name = 'Branch name is required';
    if (!formData.company_id) errors.company_id = 'Please select a company';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        company_id: formData.company_id,
        branch_name: formData.branch_name.trim(),
        branch_code: formData.branch_code?.trim() || null,
        gstin: formData.gstin?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        pincode: formData.pincode?.trim() || null,
        contact_number: formData.contact_number?.trim() || null,
        email: formData.email?.trim() || null,
        is_active: true,
      };

      if (editingBranch) {
        await branchAPI.update(editingBranch.id, payload);
        toast.success('Branch updated successfully');
      } else {
        await branchAPI.create(payload);
        toast.success('Branch created successfully');
      }

      resetForm();
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      company_id: branch.company_id || selectedCompany || '',
      branch_name: branch.branch_name || '',
      branch_code: branch.branch_code || '',
      gstin: branch.gstin || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      contact_number: branch.contact_number || '',
      email: branch.email || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      await branchAPI.delete(branchId);
      toast.success('Branch deleted successfully');
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    }
  };

  const canCreateMore = () => {
    if (!subscription) return true; // Allow creation if subscription not loaded yet
    const maxBranches = subscription.max_branches || 0;
    if (maxBranches === 0) return true; // If no limit set, allow creation
    return branches.length < maxBranches;
  };

  const columns = [
    { key: 'branch_name', label: 'Branch Name', sortable: true },
    { key: 'branch_code', label: 'Code' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'contact_number', label: 'Contact' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <Button
            onClick={() => handleEdit(row)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <FiEdit2 className="h-3 w-3" />
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(row.id)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Check if user has multi-branch subscription
  const isMultiBranch = subscription?.plan_type === 'multi-branch';

  if (!isMultiBranch) {
    return (
      <ProtectedRoute portalType="client">
        <ClientLayout title="Branches">
          <PageLayout
            title="Branches"
            breadcrumbs={[
              { label: 'Client', href: '/client/dashboard' },
              { label: 'Branches' },
            ]}
          >
            <Card>
              <div className="text-center py-12">
                <FiMapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multi-Branch Feature Not Available
                </h3>
                <p className="text-gray-600 mb-4">
                  Your current subscription plan does not include multi-branch support.
                  Please upgrade to a multi-branch plan to manage multiple branches.
                </p>
                <Button onClick={() => router.push('/client/plans')}>
                  View Plans
                </Button>
              </div>
            </Card>
          </PageLayout>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Branches">
        <PageLayout
          title="Branch Management"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Branches' },
          ]}
          actions={
            !showForm && canCreateMore() ? (
              <Button
                onClick={() => {
                  setShowForm(true);
                  // Pre-fill company_id if a company is selected
                  if (selectedCompany) {
                    setFormData(prev => ({ ...prev, company_id: selectedCompany }));
                  }
                }}
                className="flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Branch</span>
              </Button>
            ) : showForm ? (
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiX className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            ) : null
          }
        >
          {/* Company Selector - Only show when not in form mode */}
          {!showForm && companies.length > 0 && (
            <Card className="mb-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Select Company:
                </label>
                <select
                  value={selectedCompany || ''}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          )}

          {/* No Companies Warning */}
          {!showForm && companies.length === 0 && (
            <Card className="mb-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600">⚠️</div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    No Companies Found
                  </h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    You need to create a company first before adding branches.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/client/companies')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Create Company
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {showForm ? (
            <Card>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBranch ? 'Edit Branch' : 'New Branch'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {subscription && `You can create up to ${subscription.max_branches} branches`}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Selection Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <FiMapPin className="h-4 w-4" />
                    Company for this Branch
                  </h3>
                  <FormSelect
                    name="company_id"
                    label="Select Company"
                    value={formData.company_id}
                    onChange={handleChange}
                    error={formErrors.company_id}
                    touched={!!formErrors.company_id}
                    required
                    options={companies.map(company => ({
                      value: company.id,
                      label: company.company_name
                    }))}
                    placeholder="-- Select Company --"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    This branch will be created under the selected company
                  </p>
                </div>

                {/* Branch Details Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Branch Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      name="branch_name"
                      label="Branch Name"
                      value={formData.branch_name}
                      onChange={handleChange}
                      error={formErrors.branch_name}
                      touched={!!formErrors.branch_name}
                      required
                      placeholder="e.g. Head Office, Mumbai Branch"
                    />
                    <FormInput
                      name="branch_code"
                      label="Branch Code"
                      value={formData.branch_code}
                      onChange={handleChange}
                      placeholder="e.g. HO, MUM01"
                    />
                    <FormInput
                      name="gstin"
                      label="GSTIN"
                      value={formData.gstin}
                      onChange={(name, value) => handleChange(name, value.toUpperCase())}
                      placeholder="27ABCDE1234F1Z5"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <FormInput
                      name="city"
                      label="City"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai"
                    />
                    <FormInput
                      name="state"
                      label="State"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Maharashtra"
                    />
                    <FormInput
                      name="pincode"
                      label="PIN Code"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 400001"
                    />
                    <div className="md:col-span-2">
                      <FormTextarea
                        name="address"
                        label="Address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Full address of the branch"
                      />
                    </div>
                    <FormPhoneInput
                      name="contact_number"
                      label="Contact Number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      defaultCountry="IN"
                    />
                    <FormInput
                      name="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="branch@company.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiX className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{editingBranch ? 'Update' : 'Create'} Branch</span>
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              {!selectedCompany ? (
                <div className="text-center py-12">
                  <FiMapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Company
                  </h3>
                  <p className="text-gray-600">
                    Please select a company from the dropdown above to manage its branches.
                  </p>
                </div>
              ) : branches.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={branches}
                  loading={false}
                  searchable={true}
                />
              ) : (
                <div className="text-center py-12">
                  <FiMapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Branches</h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first branch for this company.
                  </p>
                  {canCreateMore() && (
                    <Button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <FiPlus className="h-4 w-4" />
                      <span>Add Branch</span>
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}