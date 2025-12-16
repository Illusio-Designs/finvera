import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import { useForm } from '../../../hooks/useForm';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import Button from '../../../components/ui/Button';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

// Indian States for territory selection
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function NewDistributor() {
  const router = useRouter();
  const [selectedStates, setSelectedStates] = useState([]);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue } = useForm(
    {
      email: '',
      password: '',
      full_name: '',
      distributor_code: '',
      company_name: '',
      territory: [],
      commission_rate: '',
      payment_terms: '',
    },
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          territory: selectedStates,
        };
        await adminAPI.distributors.create(payload);
        toast.success('Distributor created successfully');
        router.push('/admin/distributors');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create distributor');
        throw error;
      }
    }
  );

  const handleStateToggle = (state) => {
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        return prev.filter(s => s !== state);
      } else {
        return [...prev, state];
      }
    });
  };

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Create Distributor - Admin Panel">
        <Toaster />
        <PageLayout
          title="Create New Distributor"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Distributors', href: '/admin/distributors' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User Account Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="email"
                    label="Email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    touched={touched.email}
                    required
                    placeholder="distributor@example.com"
                  />

                  <FormInput
                    name="password"
                    label="Password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.password}
                    touched={touched.password}
                    required
                    placeholder="Minimum 8 characters"
                  />

                  <FormInput
                    name="full_name"
                    label="Full Name"
                    value={values.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.full_name}
                    touched={touched.full_name}
                    required
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Business Information Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    name="distributor_code"
                    label="Distributor Code"
                    value={values.distributor_code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.distributor_code}
                    touched={touched.distributor_code}
                    required
                    placeholder="DIST001"
                  />

                  <FormInput
                    name="company_name"
                    label="Company Name"
                    value={values.company_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.company_name}
                    touched={touched.company_name}
                    required
                    placeholder="ABC Distributors Pvt Ltd"
                  />

                  <FormInput
                    name="commission_rate"
                    label="Commission Rate (%)"
                    type="number"
                    value={values.commission_rate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.commission_rate}
                    touched={touched.commission_rate}
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="5.00"
                  />

                  <FormInput
                    name="payment_terms"
                    label="Payment Terms"
                    value={values.payment_terms}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.payment_terms}
                    touched={touched.payment_terms}
                    placeholder="Net 30 days"
                  />
                </div>
              </div>

              {/* Territory Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Territory Coverage</h3>
                <p className="text-sm text-gray-600 mb-4">Select the states this distributor will cover</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                  {INDIAN_STATES.map((state) => (
                    <label
                      key={state}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(state)}
                        onChange={() => handleStateToggle(state)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
                
                {selectedStates.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected States ({selectedStates.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStates.map((state) => (
                        <span
                          key={state}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                        >
                          {state}
                          <button
                            type="button"
                            onClick={() => handleStateToggle(state)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create Distributor
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

