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
import { useApi } from '../../../hooks/useApi';

export default function NewTarget() {
  const router = useRouter();
  const [assigneeType, setAssigneeType] = useState('salesman'); // 'distributor' or 'salesman'

  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const { data: salesmenData } = useApi(() => adminAPI.salesmen.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || [];
  const salesmen = salesmenData?.data || [];

  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: `${d.distributor_code} - ${d.company_name}`,
  }));

  const salesmanOptions = salesmen.map((s) => ({
    value: s.id,
    label: `${s.salesman_code} - ${s.full_name}`,
  }));

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue } = useForm(
    {
      assignee_id: '',
      target_type: 'revenue',
      target_period: 'monthly',
      target_value: '',
      start_date: '',
      end_date: '',
    },
    async (formValues) => {
      try {
        const payload = {
          ...(assigneeType === 'distributor'
            ? { distributor_id: formValues.assignee_id }
            : { salesman_id: formValues.assignee_id }),
          target_type: formValues.target_type,
          target_period: formValues.target_period,
          target_value: parseFloat(formValues.target_value),
          start_date: formValues.start_date,
          end_date: formValues.end_date,
        };
        await adminAPI.targets.create(payload);
        toast.success('Target created successfully');
        router.push('/admin/targets');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create target');
        throw error;
      }
    }
  );

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Set Target - Admin Panel">
        <Toaster />
        <PageLayout
          title="Set New Target"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Targets', href: '/admin/targets' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Assignee Type Selection */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="assigneeType"
                        value="salesman"
                        checked={assigneeType === 'salesman'}
                        onChange={(e) => {
                          setAssigneeType(e.target.value);
                          setFieldValue('assignee_id', '');
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Salesman</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="assigneeType"
                        value="distributor"
                        checked={assigneeType === 'distributor'}
                        onChange={(e) => {
                          setAssigneeType(e.target.value);
                          setFieldValue('assignee_id', '');
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Distributor</span>
                    </label>
                  </div>
                </div>

                <FormSelect
                  name="assignee_id"
                  label={assigneeType === 'distributor' ? 'Select Distributor' : 'Select Salesman'}
                  value={values.assignee_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.assignee_id}
                  touched={touched.assignee_id}
                  options={assigneeType === 'distributor' ? distributorOptions : salesmanOptions}
                  placeholder={`Select ${assigneeType}`}
                  required
                />
              </div>

              {/* Target Details */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormSelect
                    name="target_type"
                    label="Target Type"
                    value={values.target_type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.target_type}
                    touched={touched.target_type}
                    options={[
                      { value: 'revenue', label: 'Revenue' },
                      { value: 'subscription', label: 'Subscriptions' },
                    ]}
                    required
                  />

                  <FormSelect
                    name="target_period"
                    label="Target Period"
                    value={values.target_period}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.target_period}
                    touched={touched.target_period}
                    options={[
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly' },
                      { value: 'yearly', label: 'Yearly' },
                    ]}
                    required
                  />

                  <FormInput
                    name="target_value"
                    label="Target Value"
                    type="number"
                    value={values.target_value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.target_value}
                    touched={touched.target_value}
                    required
                    step="0.01"
                    min="0"
                    placeholder="Enter target value"
                  />

                  <div></div>

                  <FormInput
                    name="start_date"
                    label="Start Date"
                    type="date"
                    value={values.start_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.start_date}
                    touched={touched.start_date}
                    required
                  />

                  <FormInput
                    name="end_date"
                    label="End Date"
                    type="date"
                    value={values.end_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.end_date}
                    touched={touched.end_date}
                    required
                  />
                </div>
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
                  Set Target
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
