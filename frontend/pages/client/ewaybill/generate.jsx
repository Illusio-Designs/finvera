import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import { useForm } from '../../../hooks/useForm';
import { eWayBillAPI } from '../../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function GenerateEWayBill() {
  const router = useRouter();

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    {
      voucher_id: '',
      transporter_id: '',
      transporter_name: '',
      transport_mode: 'ROAD',
      vehicle_no: '',
      distance_km: '',
      from_pincode: '',
      to_pincode: '',
    },
    async (vals) => {
      const payload = {
        ...vals,
        distance_km: vals.distance_km ? parseInt(vals.distance_km, 10) : undefined,
      };
      const res = await eWayBillAPI.generate(payload);
      const vId = payload.voucher_id;
      toast.success('E-Way Bill generated');
      router.push(`/client/ewaybill/${vId}`);
      return res;
    }
  );

  return (
    <ProtectedRoute>
      <ClientLayout title="Generate E-Way Bill - Client Portal">
        <Toaster />
        <PageLayout
          title="Generate E-Way Bill"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'E-Way Bill', href: '/client/ewaybill' },
            { label: 'Generate' },
          ]}
        >
          <Card>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="voucher_id"
                label="Sales Voucher ID"
                value={values.voucher_id}
                onChange={handleChange}
                error={errors.voucher_id}
                touched={true}
                placeholder="Paste voucher UUID"
                required
              />
              <FormSelect
                name="transport_mode"
                label="Transport Mode"
                value={values.transport_mode}
                onChange={handleChange}
                options={[
                  { value: 'ROAD', label: 'ROAD' },
                  { value: 'RAIL', label: 'RAIL' },
                  { value: 'AIR', label: 'AIR' },
                  { value: 'SHIP', label: 'SHIP' },
                ]}
              />
              <FormInput
                name="vehicle_no"
                label="Vehicle No"
                value={values.vehicle_no}
                onChange={handleChange}
                error={errors.vehicle_no}
                touched={true}
                placeholder="e.g. GJ01AB1234"
              />
              <FormInput
                name="distance_km"
                label="Distance (KM)"
                value={values.distance_km}
                onChange={handleChange}
                error={errors.distance_km}
                touched={true}
                placeholder="e.g. 120"
              />
              <FormInput
                name="transporter_id"
                label="Transporter ID"
                value={values.transporter_id}
                onChange={handleChange}
                error={errors.transporter_id}
                touched={true}
              />
              <FormInput
                name="transporter_name"
                label="Transporter Name"
                value={values.transporter_name}
                onChange={handleChange}
                error={errors.transporter_name}
                touched={true}
              />
              <FormInput
                name="from_pincode"
                label="From Pincode"
                value={values.from_pincode}
                onChange={handleChange}
                error={errors.from_pincode}
                touched={true}
              />
              <FormInput
                name="to_pincode"
                label="To Pincode"
                value={values.to_pincode}
                onChange={handleChange}
                error={errors.to_pincode}
                touched={true}
              />

              <div className="md:col-span-2 flex gap-2 mt-2">
                <Button type="submit" loading={isSubmitting}>
                  Generate
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/client/ewaybill')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

