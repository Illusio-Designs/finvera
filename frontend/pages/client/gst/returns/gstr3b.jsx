import { useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Card from '../../../../components/ui/Card';
import FormSelect from '../../../../components/forms/FormSelect';
import Button from '../../../../components/ui/Button';
import { useApi } from '../../../../hooks/useApi';
import { gstAPI } from '../../../../lib/api';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';
import { getGSTPeriod } from '../../../../lib/dateUtils';

export default function GSTR3B() {
  const [period, setPeriod] = useState(getGSTPeriod());
  const [gstinId, setGstinId] = useState('');

  const { data: gstinsData } = useApi(() => gstAPI.gstins.list({ limit: 1000 }), true);
  const { data, loading, execute } = useApi(
    () => gstAPI.returns.generateGSTR3B({ period, gstin_id: gstinId }),
    false
  );

  const gstins = gstinsData?.data || gstinsData || [];
  const gstinOptions = gstins.map((g) => ({
    value: g.id,
    label: `${g.gstin} - ${g.business_name || 'N/A'}`,
  }));

  const handleGenerate = () => {
    if (!gstinId) {
      toast.error('Please select a GSTIN');
      return;
    }
    execute();
  };

  const handleDownload = () => {
    if (data?.data?.json_file) {
      const link = document.createElement('a');
      link.href = data.data.json_file;
      link.download = `GSTR3B_${period}.json`;
      link.click();
    } else {
      toast.error('No file available for download');
    }
  };

  return (
    <ProtectedRoute>
      <ClientLayout title="GSTR-3B - Client Portal">
        <Toaster />
        <PageLayout
          title="Generate GSTR-3B"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'GST', href: '/client/gst' },
            { label: 'GSTR-3B' },
          ]}
          actions={
            data?.data && (
              <Button variant="outline" onClick={handleDownload}>
                Download JSON
              </Button>
            )
          }
        >
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                name="gstin_id"
                label="GSTIN"
                value={gstinId}
                onChange={(name, value) => setGstinId(value)}
                options={gstinOptions}
                required
              />
              <FormSelect
                name="period"
                label="Period (MM-YYYY)"
                value={period}
                onChange={(name, value) => setPeriod(value)}
                options={[
                  ...Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return {
                      value: `${month}-${year}`,
                      label: `${month}-${year}`,
                    };
                  }),
                ]}
              />
            </div>
            <div className="mt-4">
              <Button onClick={handleGenerate} loading={loading}>
                Generate GSTR-3B
              </Button>
            </div>
          </Card>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {data?.data && (
            <Card title="GSTR-3B Summary">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">{data.data.period || period}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{data.data.status || 'Generated'}</dd>
                </div>
              </dl>
            </Card>
          )}
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

