import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import ClientLayout from '../../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../../components/layouts/PageLayout';
import { useForm } from '../../../../../hooks/useForm';
import FormInput from '../../../../../components/forms/FormInput';
import FormSelect from '../../../../../components/forms/FormSelect';
import Button from '../../../../../components/ui/Button';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { useApi } from '../../../../../hooks/useApi';
import { accountingAPI } from '../../../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function EditAccountGroup() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, execute } = useApi(() => accountingAPI.accountGroups.get(id), !!id);
  const { data: groupsData } = useApi(() => accountingAPI.accountGroups.list({ limit: 1000 }), true);

  const groups = groupsData?.data || groupsData || [];
  const parentOptions = [
    { value: '', label: 'None (Root Group)' },
    ...groups.filter((g) => g.id !== id).map((g) => ({
      value: g.id,
      label: `${g.group_code} - ${g.group_name}`,
    })),
  ];

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setValues } = useForm(
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
        await accountingAPI.accountGroups.update(id, payload);
        toast.success('Account group updated successfully');
        router.push('/client/accounting/groups');
      } catch (error) {
        throw error;
      }
    }
  );

  useEffect(() => {
    if (data) {
      const group = data.data || data;
      setValues({
        group_name: group.group_name || '',
        group_code: group.group_code || '',
        parent_group_id: group.parent_group_id || '',
        group_type: group.group_type || 'asset',
        description: group.description || '',
      });
    }
  }, [data, setValues]);

  if (loading) {
    return (
      <ProtectedRoute>
        <ClientLayout>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ClientLayout title="Edit Account Group - Client Portal">
        <Toaster />
        <PageLayout
          title="Edit Account Group"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Account Groups', href: '/client/accounting/groups' },
            { label: 'Edit' },
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
                  Update Group
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

