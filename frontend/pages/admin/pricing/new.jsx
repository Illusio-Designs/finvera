import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/layouts/AdminLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import { useForm } from '../../../hooks/useForm';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormTextarea from '../../../components/forms/FormTextarea';
import Button from '../../../components/ui/Button';
import { pricingAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function NewPricingPlan() {
  const router = useRouter();
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      plan_code: '',
      plan_name: '',
      description: '',
      billing_cycle: 'monthly',
      base_price: '',
      discounted_price: '',
      trial_days: '0',
      max_users: '',
      max_invoices_per_month: '',
      storage_limit_gb: '',
      salesman_commission_rate: '',
      distributor_commission_rate: '',
      renewal_commission_rate: '',
    },
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          base_price: parseFloat(formValues.base_price),
          discounted_price: formValues.discounted_price ? parseFloat(formValues.discounted_price) : null,
          trial_days: parseInt(formValues.trial_days) || 0,
          max_users: formValues.max_users ? parseInt(formValues.max_users) : null,
          max_invoices_per_month: formValues.max_invoices_per_month ? parseInt(formValues.max_invoices_per_month) : null,
          storage_limit_gb: formValues.storage_limit_gb ? parseInt(formValues.storage_limit_gb) : null,
          salesman_commission_rate: formValues.salesman_commission_rate ? parseFloat(formValues.salesman_commission_rate) : null,
          distributor_commission_rate: formValues.distributor_commission_rate ? parseFloat(formValues.distributor_commission_rate) : null,
          renewal_commission_rate: formValues.renewal_commission_rate ? parseFloat(formValues.renewal_commission_rate) : null,
        };
        await pricingAPI.createPlan(payload);
        toast.success('Plan created successfully');
        router.push('/admin/pricing');
      } catch (error) {
        throw error;
      }
    }
  );

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title="Create Plan - Admin Panel">
        <Toaster />
        <PageLayout
          title="Create Subscription Plan"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Pricing', href: '/admin/pricing' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  name="plan_code"
                  label="Plan Code"
                  value={values.plan_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.plan_code}
                  touched={touched.plan_code}
                  required
                />

                <FormInput
                  name="plan_name"
                  label="Plan Name"
                  value={values.plan_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.plan_name}
                  touched={touched.plan_name}
                  required
                />
              </div>

              <FormTextarea
                name="description"
                label="Description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.description}
                touched={touched.description}
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  name="billing_cycle"
                  label="Billing Cycle"
                  value={values.billing_cycle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.billing_cycle}
                  touched={touched.billing_cycle}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' },
                  ]}
                />

                <FormInput
                  name="base_price"
                  label="Base Price (₹)"
                  type="number"
                  value={values.base_price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.base_price}
                  touched={touched.base_price}
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <FormInput
                name="discounted_price"
                label="Discounted Price (₹)"
                type="number"
                value={values.discounted_price}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.discounted_price}
                touched={touched.discounted_price}
                step="0.01"
                min="0"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInput
                  name="trial_days"
                  label="Trial Days"
                  type="number"
                  value={values.trial_days}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.trial_days}
                  touched={touched.trial_days}
                  min="0"
                />

                <FormInput
                  name="max_users"
                  label="Max Users"
                  type="number"
                  value={values.max_users}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.max_users}
                  touched={touched.max_users}
                  min="1"
                />

                <FormInput
                  name="max_invoices_per_month"
                  label="Max Invoices/Month"
                  type="number"
                  value={values.max_invoices_per_month}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.max_invoices_per_month}
                  touched={touched.max_invoices_per_month}
                  min="0"
                />
              </div>

              <FormInput
                name="storage_limit_gb"
                label="Storage Limit (GB)"
                type="number"
                value={values.storage_limit_gb}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.storage_limit_gb}
                touched={touched.storage_limit_gb}
                min="0"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInput
                  name="salesman_commission_rate"
                  label="Salesman Commission (%)"
                  type="number"
                  value={values.salesman_commission_rate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.salesman_commission_rate}
                  touched={touched.salesman_commission_rate}
                  step="0.01"
                  min="0"
                  max="100"
                />

                <FormInput
                  name="distributor_commission_rate"
                  label="Distributor Commission (%)"
                  type="number"
                  value={values.distributor_commission_rate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.distributor_commission_rate}
                  touched={touched.distributor_commission_rate}
                  step="0.01"
                  min="0"
                  max="100"
                />

                <FormInput
                  name="renewal_commission_rate"
                  label="Renewal Commission (%)"
                  type="number"
                  value={values.renewal_commission_rate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.renewal_commission_rate}
                  touched={touched.renewal_commission_rate}
                  step="0.01"
                  min="0"
                  max="100"
                />
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
                  Create Plan
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}

