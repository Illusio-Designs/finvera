import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import { useForm } from '../../../hooks/useForm';
import FormInput from '../../../components/forms/FormInput';
import Button from '../../../components/ui/Button';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function NewTenant() {
  const router = useRouter();
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      company_name: '',
      email: '',
      password: '',
      gstin: '',
      pan: '',
    },
    async (formValues) => {
      try {
        await adminAPI.tenants.create(formValues);
        toast.success('Tenant created successfully');
        router.push('/admin/tenants');
      } catch (error) {
        throw error;
      }
    }
  );

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Create Tenant - Admin Panel">
        <Toaster />
        <PageLayout
          title="Create New Tenant"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Tenants', href: '/admin/tenants' },
            { label: 'New' },
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
              />

              <FormInput
                name="gstin"
                label="GSTIN"
                value={values.gstin}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.gstin}
                touched={touched.gstin}
                placeholder="15 characters"
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
                placeholder="10 characters"
                maxLength={10}
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
                  Create Tenant
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

