import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../ProtectedRoute';
import Button from '../ui/Button';
import { FiDownload, FiCalendar, FiFilter, FiX } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

export default function ReportLayout({ 
  title, 
  description, 
  children, 
  onExport,
  dateRange = true,
  onDateChange
}) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState(router.query.from_date || '');
  const [toDate, setToDate] = useState(router.query.to_date || new Date().toISOString().split('T')[0]);

  const handleExport = (format) => {
    if (onExport) {
      onExport(format, { fromDate, toDate });
    } else {
      toast.info('Export functionality coming soon');
    }
  };

  const handleDateApply = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('from_date', fromDate);
    if (toDate) params.set('to_date', toDate);
    router.push(`${router.pathname}?${params.toString()}`);
    if (onDateChange) {
      onDateChange({ fromDate, toDate });
    }
  };

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout title={title}>
        <Toaster />
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-gray-600 mt-1">{description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FiFilter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                >
                  <FiDownload className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('excel')}
                >
                  <FiDownload className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            {/* Date Range Filter */}
            {dateRange && showFilters && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleDateApply}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Report Content */}
          {children}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
