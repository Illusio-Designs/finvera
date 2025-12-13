import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import AdminLayout from "../../../../components/layouts/AdminLayout";
import PageLayout from "../../../../components/layouts/PageLayout";
import { useForm } from "../../../../hooks/useForm";
import FormInput from "../../../../components/forms/FormInput";
import FormSelect from "../../../../components/forms/FormSelect";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useApi } from "../../../../hooks/useApi";
import { adminAPI } from "../../../../lib/api";
import toast, { Toaster } from "react-hot-toast";

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

export default function EditDistributor() {
  const router = useRouter();
  const { id } = router.query;
  const [selectedStates, setSelectedStates] = useState([]);

  const { data, loading, execute } = useApi(
    () => adminAPI.distributors.get(id),
    !!id
  );

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setValues,
  } = useForm(
    {
      full_name: "",
      email: "",
      distributor_code: "",
      company_name: "",
      territory: [],
      commission_rate: "",
      payment_terms: "",
      is_active: true,
    },
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          territory: selectedStates,
        };
        await adminAPI.distributors.update(id, payload);
        toast.success("Distributor updated successfully");
        router.push(`/admin/distributors/${id}`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update distributor');
        throw error;
      }
    }
  );

  useEffect(() => {
    if (data) {
      const distributor = data.data || data;
      const user = distributor.User || {};
      
      setValues({
        full_name: user.full_name || "",
        email: user.email || "",
        distributor_code: distributor.distributor_code || "",
        company_name: distributor.company_name || "",
        commission_rate: distributor.commission_rate || "",
        payment_terms: distributor.payment_terms || "",
        is_active: distributor.is_active !== undefined ? distributor.is_active : true,
      });
      
      // Set territory states
      if (distributor.territory && Array.isArray(distributor.territory)) {
        setSelectedStates(distributor.territory);
      }
    }
  }, [data, setValues]);

  const handleStateToggle = (state) => {
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        return prev.filter(s => s !== state);
      } else {
        return [...prev, state];
      }
    });
  };

  if (loading) {
    return (
      <ProtectedRoute portalType="admin">
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Edit Distributor - Admin Panel">
        <Toaster />
        <PageLayout
          title="Edit Distributor"
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Distributors", href: "/admin/distributors" },
            { label: "Edit" },
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
                    disabled
                    className="bg-gray-50"
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
                    disabled
                    className="bg-gray-50"
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
                  />

                  <FormInput
                    name="payment_terms"
                    label="Payment Terms"
                    value={values.payment_terms}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.payment_terms}
                    touched={touched.payment_terms}
                  />

                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={values.is_active}
                        onChange={(e) => handleChange({ target: { name: 'is_active', value: e.target.checked } })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
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
                  Update Distributor
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
