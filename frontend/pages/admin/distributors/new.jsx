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

export default function NewDistributor() {
  const router = useRouter();
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      distributor_code: '',
      company_name: '',
      commission_rate: '',
      payment_terms: '',
    },
    async (formValues) => {
      try {
        await adminAPI.distributors.create(formValues);
        toast.success('Distributor created successfully');
        router.push('/admin/distributors');
      } catch (error) {
        throw error;
      }
    }
  );

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
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="distributor_code"
                label="Distributor Code"
                value={values.distributor_code}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.distributor_code}
                touched={touched.distributor_code}
                required
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

