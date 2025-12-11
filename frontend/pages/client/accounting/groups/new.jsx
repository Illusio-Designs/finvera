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

export default function NewAccountGroup() {
  const router = useRouter();
  const { data: groupsData } = useApi(() => accountingAPI.accountGroups.list({ limit: 1000 }), true);

  const groups = groupsData?.data || groupsData || [];
  const parentOptions = [
    { value: '', label: 'None (Root Group)' },
    ...groups.map((g) => ({
      value: g.id,
      label: `${g.group_code} - ${g.group_name}`,
    })),
  ];

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      group_name: '',
      group_code: '',
      parent_group_id: '',
      group_type: 'asset',
      description: '',
    },
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          parent_group_id: formValues.parent_group_id || null,
        };
        await accountingAPI.accountGroups.create(payload);
        toast.success('Account group created successfully');
        router.push('/client/accounting/groups');
      } catch (error) {
        throw error;
      }
    }
  );

  return (
    <ProtectedRoute>
      <ClientLayout title="Create Account Group - Client Portal">
        <Toaster />
        <PageLayout
          title="Create Account Group"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Account Groups', href: '/client/accounting/groups' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="group_name"
                label="Group Name"
                value={values.group_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.group_name}
                touched={touched.group_name}
                required
              />

              <FormInput
                name="group_code"
                label="Group Code"
                value={values.group_code}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.group_code}
                touched={touched.group_code}
                required
              />

              <FormSelect
                name="parent_group_id"
                label="Parent Group"
                value={values.parent_group_id}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.parent_group_id}
                touched={touched.parent_group_id}
                options={parentOptions}
                placeholder="Select parent group (optional)"
              />

              <FormSelect
                name="group_type"
                label="Group Type"
                value={values.group_type}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.group_type}
                touched={touched.group_type}
                required
                options={[
                  { value: 'asset', label: 'Asset' },
                  { value: 'liability', label: 'Liability' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'capital', label: 'Capital' },
                ]}
              />

              <FormInput
                name="description"
                label="Description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.description}
                touched={touched.description}
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
                  Create Group
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

