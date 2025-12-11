import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import { useForm } from '../../../../hooks/useForm';
import FormInput from '../../../../components/forms/FormInput';
import FormSelect from '../../../../components/forms/FormSelect';
import Button from '../../../../components/ui/Button';
import { gstAPI } from '../../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function NewGSTIN() {
  const router = useRouter();
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    {
      gstin: '',
      business_name: '',
      state: '',
      is_primary: false,
    },
    async (formValues) => {
      try {
        await gstAPI.gstins.create(formValues);
        toast.success('GSTIN created successfully');
        router.push('/client/gst/gstins');
      } catch (error) {
        throw error;
      }
    }
  );

  const stateOptions = INDIAN_STATES.map((state) => ({
    value: state,
    label: state,
  }));

  return (
    <ProtectedRoute>
      <ClientLayout title="Create GSTIN - Client Portal">
        <Toaster />
        <PageLayout
          title="Create GSTIN"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GSTINs', href: '/client/gst/gstins' },
            { label: 'New' },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="gstin"
                label="GSTIN"
                value={values.gstin}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.gstin}
                touched={touched.gstin}
                required
                maxLength={15}
                placeholder="15 characters"
              />

              <FormInput
                name="business_name"
                label="Business Name"
                value={values.business_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.business_name}
                touched={touched.business_name}
                required
              />

              <FormSelect
                name="state"
                label="State"
                value={values.state}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.state}
                touched={touched.state}
                required
                options={stateOptions}
              />

              <FormSelect
                name="is_primary"
                label="Primary GSTIN"
                value={values.is_primary ? 'true' : 'false'}
                onChange={(name, value) => handleChange(name, value === 'true')}
                onBlur={handleBlur}
                error={errors.is_primary}
                touched={touched.is_primary}
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
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
                  Create GSTIN
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

