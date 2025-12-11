import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import { useForm } from '../../../hooks/useForm';
import FormSelect from '../../../components/forms/FormSelect';
import FormInput from '../../../components/forms/FormInput';
import Button from '../../../components/ui/Button';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useApi } from '../../../hooks/useApi';

export default function NewPayout() {
  const router = useRouter();
  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const { data: salesmenData } = useApi(() => adminAPI.salesmen.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || distributorsData || [];
  const salesmen = salesmenData?.data || salesmenData || [];

  const [payoutType, setPayoutType] = useState('distributor');

  const recipientOptions =
    payoutType === 'distributor'
      ? distributors.map((d) => ({
          value: d.id,
          label: `${d.distributor_code} - ${d.company_name || 'N/A'}`,
        }))
      : salesmen.map((s) => ({
          value: s.id,
          label: `${s.salesman_code} - ${s.full_name}`,
        }));

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      payout_type: 'distributor',
      distributor_id: '',
      salesman_id: '',
      total_amount: '',
      payment_method: '',
      notes: '',
    },
    async (formValues) => {
      try {
        const payload = {
          payout_type: formValues.payout_type,
          total_amount: parseFloat(formValues.total_amount),
          payment_method: formValues.payment_method,
          notes: formValues.notes,
        };

        if (formValues.payout_type === 'distributor') {
          payload.distributor_id = formValues.distributor_id;
        } else {
          payload.salesman_id = formValues.salesman_id;
        }

        await adminAPI.payouts.create(payload);
        toast.success('Payout created successfully');
        router.push('/admin/payouts');
      } catch (error) {
        throw error;
      }
    }
  );

  useEffect(() => {
    if (values.payout_type) {
      setPayoutType(values.payout_type);
    }
  }, [values.payout_type]);

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Create Payout - Admin Panel">
        <Toaster />
        <PageLayout
          title="Create New Payout"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Payouts', href: '/admin/payouts' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormSelect
                name="payout_type"
                label="Payout Type"
                value={values.payout_type}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.payout_type}
                touched={touched.payout_type}
                required
                options={[
                  { value: 'distributor', label: 'Distributor' },
                  { value: 'salesman', label: 'Salesman' },
                ]}
              />

              {payoutType === 'distributor' ? (
                <FormSelect
                  name="distributor_id"
                  label="Distributor"
                  value={values.distributor_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.distributor_id}
                  touched={touched.distributor_id}
                  required
                  options={recipientOptions}
                />
              ) : (
                <FormSelect
                  name="salesman_id"
                  label="Salesman"
                  value={values.salesman_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.salesman_id}
                  touched={touched.salesman_id}
                  required
                  options={recipientOptions}
                />
              )}

              <FormInput
                name="total_amount"
                label="Total Amount"
                type="number"
                value={values.total_amount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.total_amount}
                touched={touched.total_amount}
                required
                step="0.01"
                min="0"
              />

              <FormInput
                name="payment_method"
                label="Payment Method"
                value={values.payment_method}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.payment_method}
                touched={touched.payment_method}
                placeholder="Bank Transfer, UPI, etc."
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
                  Create Payout
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

