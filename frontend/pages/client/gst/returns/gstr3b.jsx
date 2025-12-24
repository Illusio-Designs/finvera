import { useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import FormDatePicker from '../../../../components/forms/FormDatePicker';
import { getStartOfMonth, getEndOfMonth } from '../../../../lib/dateUtils';
import { formatCurrency } from '../../../../lib/formatters';
import toast, { Toaster } from 'react-hot-toast';
import { FiFileText, FiDownload, FiAlertCircle } from 'react-icons/fi';

export default function GSTR3BPage() {
  const [loading, setLoading] = useState(false);
  const [gstPayable, setGstPayable] = useState(0);
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
      // TODO: Implement GSTR-3B generation API call
      toast.success('GSTR-3B generation initiated');
    } catch (error) {
      console.error('Error generating GSTR-3B:', error);
      toast.error('Failed to generate GSTR-3B');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      // TODO: Implement GSTR-3B download
      toast.success('GSTR-3B download initiated');
    } catch (error) {
      console.error('Error downloading GSTR-3B:', error);
      toast.error('Failed to download GSTR-3B');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="GSTR-3B">
        <Toaster />
        <PageLayout
          title="GSTR-3B Return"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Compliance', href: '#' },
            { label: 'GSTR-3B' },
          ]}
        >
          <div className="space-y-4">
            {/* GST Payable Summary */}
            <Card className="border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">GST Payable</p>
                  <p className="text-2xl font-semibold text-orange-600">
                    {formatCurrency(gstPayable)}
                  </p>
                </div>
                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                  <FiAlertCircle className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate GSTR-3B</h2>
              
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
                  {loading ? 'Generating...' : 'Generate GSTR-3B'}
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
              <h3 className="text-md font-semibold text-gray-900 mb-2">About GSTR-3B</h3>
              <p className="text-sm text-gray-600">
                GSTR-3B is a monthly self-declaration return that summarizes the details of all 
                outward supplies (sales), input tax credit (ITC) claimed, and tax payable. 
                It needs to be filed by the 20th of the following month.
              </p>
            </Card>
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

