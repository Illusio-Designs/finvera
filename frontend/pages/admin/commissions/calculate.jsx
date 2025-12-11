import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import { useForm } from '../../../hooks/useForm';
import FormSelect from '../../../components/forms/FormSelect';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import Button from '../../../components/ui/Button';
import { adminAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function CalculateCommissions() {
  const router = useRouter();
  const [calculating, setCalculating] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      commission_type: 'subscription',
      start_date: '',
      end_date: '',
    },
    async (formValues) => {
      setCalculating(true);
      try {
        await adminAPI.commissions.calculate(formValues);
        toast.success('Commissions calculated successfully');
        router.push('/admin/commissions');
      } catch (error) {
        throw error;
      } finally {
        setCalculating(false);
      }
    }
  );

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Calculate Commissions - Admin Panel">
        <Toaster />
        <PageLayout
          title="Calculate Commissions"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Commissions', href: '/admin/commissions' },
            { label: 'Calculate' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormSelect
                name="commission_type"
                label="Commission Type"
                value={values.commission_type}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.commission_type}
                touched={touched.commission_type}
                required
                options={[
                  { value: 'subscription', label: 'Subscription' },
                  { value: 'renewal', label: 'Renewal' },
                  { value: 'referral', label: 'Referral' },
                ]}
              />

              <FormDatePicker
                name="start_date"
                label="Start Date"
                value={values.start_date}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.start_date}
                touched={touched.start_date}
                required
              />

              <FormDatePicker
                name="end_date"
                label="End Date"
                value={values.end_date}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.end_date}
                touched={touched.end_date}
                required
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting || calculating}>
                  Calculate Commissions
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

