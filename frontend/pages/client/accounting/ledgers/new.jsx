import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import { useForm } from '../../../../hooks/useForm';
import FormInput from '../../../../components/forms/FormInput';
import FormSelect from '../../../../components/forms/FormSelect';
import Button from '../../../../components/ui/Button';
import { accountingAPI } from '../../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useApi } from '../../../../hooks/useApi';

export default function NewLedger() {
  const router = useRouter();
  const { data: groupsData } = useApi(() => accountingAPI.accountGroups.list({ limit: 1000 }), true);

  const groups = groupsData?.data || groupsData || [];
  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: `${g.group_code} - ${g.group_name}`,
  }));

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      ledger_name: '',
      ledger_code: '',
      account_group_id: '',
      opening_balance: '0',
      balance_type: 'debit',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
    },
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          opening_balance: parseFloat(formValues.opening_balance) || 0,
        };
        await accountingAPI.ledgers.create(payload);
        toast.success('Ledger created successfully');
        router.push('/client/accounting/ledgers');
      } catch (error) {
        throw error;
      }
    }
  );

  return (
    <ProtectedRoute>
      <ClientLayout title="Create Ledger - Client Portal">
        <Toaster />
        <PageLayout
          title="Create Ledger"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Ledgers', href: '/client/accounting/ledgers' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  name="ledger_name"
                  label="Ledger Name"
                  value={values.ledger_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.ledger_name}
                  touched={touched.ledger_name}
                  required
                />

                <FormInput
                  name="ledger_code"
                  label="Ledger Code"
                  value={values.ledger_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.ledger_code}
                  touched={touched.ledger_code}
                  required
                />
              </div>

              <FormSelect
                name="account_group_id"
                label="Account Group"
                value={values.account_group_id}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.account_group_id}
                touched={touched.account_group_id}
                required
                options={groupOptions}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  name="opening_balance"
                  label="Opening Balance"
                  type="number"
                  value={values.opening_balance}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.opening_balance}
                  touched={touched.opening_balance}
                  step="0.01"
                />

                <FormSelect
                  name="balance_type"
                  label="Balance Type"
                  value={values.balance_type}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.balance_type}
                  touched={touched.balance_type}
                  options={[
                    { value: 'debit', label: 'Debit' },
                    { value: 'credit', label: 'Credit' },
                  ]}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Contact Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormInput
                    name="address"
                    label="Address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.address}
                    touched={touched.address}
                  />

                  <FormInput
                    name="city"
                    label="City"
                    value={values.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.city}
                    touched={touched.city}
                  />

                  <FormInput
                    name="state"
                    label="State"
                    value={values.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.state}
                    touched={touched.state}
                  />

                  <FormInput
                    name="pincode"
                    label="Pincode"
                    value={values.pincode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.pincode}
                    touched={touched.pincode}
                  />

                  <FormInput
                    name="phone"
                    label="Phone"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.phone}
                    touched={touched.phone}
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
                  Create Ledger
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

