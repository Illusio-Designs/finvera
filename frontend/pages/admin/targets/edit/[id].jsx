import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import AdminLayout from '../../../../components/layouts/AdminLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import { useForm } from '../../../../hooks/useForm';
import FormInput from '../../../../components/forms/FormInput';
import FormSelect from '../../../../components/forms/FormSelect';
import Button from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { useApi } from '../../../../hooks/useApi';
import { adminAPI } from '../../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function EditTarget() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading } = useApi(() => adminAPI.targets.get(id), !!id);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setValues } = useForm(
    {
      target_type: 'revenue',
      target_period: 'monthly',
      target_value: '',
      achieved_value: '',
      start_date: '',
      end_date: '',
    },
    async (formValues) => {
      try {
        const payload = {
          target_type: formValues.target_type,
          target_period: formValues.target_period,
          target_value: parseFloat(formValues.target_value),
          achieved_value: parseFloat(formValues.achieved_value),
          start_date: formValues.start_date,
          end_date: formValues.end_date,
        };
        await adminAPI.targets.update(id, payload);
        toast.success('Target updated successfully');
        router.push('/admin/targets');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update target');
        throw error;
      }
    }
  );

  useEffect(() => {
    if (data) {
      const target = data.data || data;
      setValues({
        target_type: target.target_type || 'revenue',
        target_period: target.target_period || 'monthly',
        target_value: target.target_value?.toString() || '',
        achieved_value: target.achieved_value?.toString() || '0',
        start_date: target.start_date ? target.start_date.split('T')[0] : '',
        end_date: target.end_date ? target.end_date.split('T')[0] : '',
      });
    }
  }, [data, setValues]);

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

  const target = data?.data || data;
  const assigneeName = target?.Distributor
    ? `${target.Distributor.distributor_code} - ${target.Distributor.company_name}`
    : target?.Salesman
    ? `${target.Salesman.salesman_code} - ${target.Salesman.full_name}`
    : 'N/A';

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Edit Target - Admin Panel">
        <Toaster />
        <PageLayout
          title="Edit Target"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Targets', href: '/admin/targets' },
            { label: 'Edit' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Assignment Info (Read-only) */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                    {assigneeName}
                  </div>
                </div>
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
                  />

                  <FormInput
                    name="achieved_value"
                    label="Achieved Value"
                    type="number"
                    value={values.achieved_value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.achieved_value}
                    touched={touched.achieved_value}
                    required
                    step="0.01"
                    min="0"
                  />

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
                  Update Target
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
