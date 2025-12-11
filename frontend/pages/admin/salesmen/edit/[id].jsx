import { useEffect, useState } from 'react';
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

export default function EditSalesman() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, execute } = useApi(() => adminAPI.salesmen.get(id), !!id);
  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || distributorsData || [];
  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: `${d.distributor_code} - ${d.company_name || 'N/A'}`,
  }));

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setValues } = useForm(
    {
      full_name: '',
      distributor_id: '',
      commission_rate: '',
      is_active: true,
    },
    async (formValues) => {
      try {
        await adminAPI.salesmen.update(id, formValues);
        toast.success('Salesman updated successfully');
        router.push(`/admin/salesmen/${id}`);
      } catch (error) {
        throw error;
      }
    }
  );

  useEffect(() => {
    if (data) {
      const salesman = data.data || data;
      setValues({
        full_name: salesman.full_name || '',
        distributor_id: salesman.distributor_id || '',
        commission_rate: salesman.commission_rate || '',
        is_active: salesman.is_active !== undefined ? salesman.is_active : true,
      });
    }
  }, [data, setValues]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Edit Salesman - Admin Panel">
        <Toaster />
        <PageLayout
          title="Edit Salesman"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Salesmen', href: '/admin/salesmen' },
            { label: 'Edit' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <FormSelect
                name="distributor_id"
                label="Distributor"
                value={values.distributor_id}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.distributor_id}
                touched={touched.distributor_id}
                options={distributorOptions}
                placeholder="Select distributor (optional)"
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

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Update Salesman
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

