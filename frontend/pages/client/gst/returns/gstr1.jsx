import { useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import FormDatePicker from '../../../../components/forms/FormDatePicker';
import { getStartOfMonth, getEndOfMonth } from '../../../../lib/dateUtils';
import toast, { Toaster } from 'react-hot-toast';
import { FiFileText, FiDownload, FiUpload } from 'react-icons/fi';

export default function GSTR1Page() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from_date: getStartOfMonth(),
    to_date: getEndOfMonth(),
  });

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      // TODO: Implement GSTR-1 generation API call
      toast.success('GSTR-1 generation initiated');
    } catch (error) {
      console.error('Error generating GSTR-1:', error);
      toast.error('Failed to generate GSTR-1');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      // TODO: Implement GSTR-1 download
      toast.success('GSTR-1 download initiated');
    } catch (error) {
      console.error('Error downloading GSTR-1:', error);
      toast.error('Failed to download GSTR-1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="GSTR-1">
        <Toaster />
        <PageLayout
          title="GSTR-1 Return"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Compliance', href: '#' },
            { label: 'GSTR-1' },
          ]}
        >
          <div className="space-y-4">
            <Card className="border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate GSTR-1</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormDatePicker
                  label="From Date"
                  value={dateRange.from_date}
                  onChange={(value) => handleDateChange('from_date', value)}
                />
                <FormDatePicker
                  label="To Date"
                  value={dateRange.to_date}
                  onChange={(value) => handleDateChange('to_date', value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  variant="primary"
                >
                  <FiFileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate GSTR-1'}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={loading}
                  variant="outline"
                >
                  <FiDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>

            <Card className="border border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-2">About GSTR-1</h3>
              <p className="text-sm text-gray-600">
                GSTR-1 is a monthly or quarterly return that contains details of all outward supplies (sales) 
                made during the tax period. It needs to be filed by the 11th of the following month.
              </p>
            </Card>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

