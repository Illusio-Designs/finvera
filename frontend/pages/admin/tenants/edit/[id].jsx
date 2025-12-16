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

export default function EditTenant() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, execute } = useApi(() => adminAPI.tenants.get(id), !!id);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setValues } = useForm(
    {
      company_name: '',
      email: '',
      gstin: '',
      pan: '',
      is_active: true,
    },
    async (formValues) => {
      try {
        await adminAPI.tenants.update(id, formValues);
        toast.success('Tenant updated successfully');
        router.push(`/admin/tenants/${id}`);
      } catch (error) {
        throw error;
      }
    }
  );

  useEffect(() => {
    if (data) {
      const tenant = data.data || data;
      setValues({
        company_name: tenant.company_name || '',
        email: tenant.email || '',
        gstin: tenant.gstin || '',
        pan: tenant.pan || '',
        is_active: tenant.is_active !== undefined ? tenant.is_active : true,
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

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Edit Tenant - Admin Panel">
        <Toaster />
        <PageLayout
          title="Edit Tenant"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Tenants', href: '/admin/tenants' },
            { label: 'Edit' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
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
              />

              <FormInput
                name="gstin"
                label="GSTIN"
                value={values.gstin}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.gstin}
                touched={touched.gstin}
                maxLength={15}
              />

              <FormInput
                name="pan"
                label="PAN"
                value={values.pan}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.pan}
                touched={touched.pan}
                maxLength={10}
              />

              <FormSelect
                name="is_active"
                label="Status"
                value={values.is_active ? 'true' : 'false'}
                onChange={(name, value) => handleChange(name, value === 'true')}
                onBlur={handleBlur}
                error={errors.is_active}
                touched={touched.is_active}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
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
                  Update Tenant
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

