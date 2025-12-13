import { useState, useEffect } from 'react';
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

export default function NewSalesman() {
  const router = useRouter();
  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  
  const distributors = distributorsData?.data || distributorsData || [];
  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: `${d.distributor_code} - ${d.company_name || 'N/A'}`,
  }));

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      salesman_code: '',
      full_name: '',
      distributor_id: '',
      commission_rate: '',
    },
    async (formValues) => {
      try {
        await adminAPI.salesmen.create(formValues);
        toast.success('Salesman created successfully');
        router.push('/admin/salesmen');
      } catch (error) {
        throw error;
      }
    }
  );

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Create Salesman - Admin Panel">
        <Toaster />
        <PageLayout
          title="Create New Salesman"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Salesmen', href: '/admin/salesmen' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="salesman_code"
                label="Salesman Code"
                value={values.salesman_code}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.salesman_code}
                touched={touched.salesman_code}
                required
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
                  Create Salesman
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

