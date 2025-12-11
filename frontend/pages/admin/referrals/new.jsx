import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import { useForm } from '../../../hooks/useForm';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import Button from '../../../components/ui/Button';
import { referralAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useApi } from '../../../hooks/useApi';
import { adminAPI } from '../../../lib/api';

export default function NewReferralCode() {
  const router = useRouter();
  const { data: distributorsData } = useApi(() => adminAPI.distributors.list({ limit: 1000 }), true);
  const { data: salesmenData } = useApi(() => adminAPI.salesmen.list({ limit: 1000 }), true);

  const distributors = distributorsData?.data || distributorsData || [];
  const salesmen = salesmenData?.data || salesmenData || [];

  const [ownerType, setOwnerType] = useState('distributor');

  const ownerOptions =
    ownerType === 'distributor'
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
      code: '',
      owner_type: 'distributor',
      owner_id: '',
      discount_type: 'percentage',
      discount_value: '',
      free_trial_days: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
    },
    async (formValues) => {
      try {
        await referralAPI.createCode(formValues);
        toast.success('Referral code created successfully');
        router.push('/admin/referrals');
      } catch (error) {
        throw error;
      }
    }
  );

  useEffect(() => {
    if (values.owner_type) {
      setOwnerType(values.owner_type);
    }
  }, [values.owner_type]);

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Create Referral Code - Admin Panel">
        <Toaster />
        <PageLayout
          title="Create Referral Code"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Referrals', href: '/admin/referrals' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="code"
                label="Referral Code"
                value={values.code}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.code}
                touched={touched.code}
                required
                placeholder="Enter unique code"
              />

              <FormSelect
                name="owner_type"
                label="Owner Type"
                value={values.owner_type}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.owner_type}
                touched={touched.owner_type}
                required
                options={[
                  { value: 'distributor', label: 'Distributor' },
                  { value: 'salesman', label: 'Salesman' },
                ]}
              />

              <FormSelect
                name="owner_id"
                label={ownerType === 'distributor' ? 'Distributor' : 'Salesman'}
                value={values.owner_id}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.owner_id}
                touched={touched.owner_id}
                required
                options={ownerOptions}
              />

              <FormSelect
                name="discount_type"
                label="Discount Type"
                value={values.discount_type}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.discount_type}
                touched={touched.discount_type}
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />

              <FormInput
                name="discount_value"
                label="Discount Value"
                type="number"
                value={values.discount_value}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.discount_value}
                touched={touched.discount_value}
                step="0.01"
                min="0"
              />

              <FormInput
                name="free_trial_days"
                label="Free Trial Days"
                type="number"
                value={values.free_trial_days}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.free_trial_days}
                touched={touched.free_trial_days}
                min="0"
              />

              <FormInput
                name="max_uses"
                label="Max Uses"
                type="number"
                value={values.max_uses}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.max_uses}
                touched={touched.max_uses}
                min="1"
                placeholder="Leave empty for unlimited"
              />

              <FormDatePicker
                name="valid_from"
                label="Valid From"
                value={values.valid_from}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.valid_from}
                touched={touched.valid_from}
              />

              <FormDatePicker
                name="valid_until"
                label="Valid Until"
                value={values.valid_until}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.valid_until}
                touched={touched.valid_until}
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
                  Create Referral Code
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

