import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiFileText, FiPackage } from 'react-icons/fi';

export default function ReportsIndex() {
  const router = useRouter();

  const reports = [
    {
      title: 'Trial Balance',
      description: 'View trial balance report for a specific date range',
      icon: FiBarChart2,
      href: '/client/reports/trial-balance',
      color: 'bg-blue-500',
    },
    {
      title: 'Balance Sheet',
      description: 'View balance sheet report',
      icon: FiTrendingUp,
      href: '/client/reports/balance-sheet',
      color: 'bg-green-500',
    },
    {
      title: 'Profit & Loss',
      description: 'View profit and loss statement',
      icon: FiTrendingDown,
      href: '/client/reports/profit-loss',
      color: 'bg-red-500',
    },
    {
      title: 'Ledger Statement',
      description: 'View detailed ledger statement',
      icon: FiFileText,
      href: '/client/reports/ledger-statement',
      color: 'bg-purple-500',
    },
    {
      title: 'Stock Summary',
      description: 'View stock summary report',
      icon: FiPackage,
      href: '/client/reports/stock-summary',
      color: 'bg-orange-500',
    },
    {
      title: 'Stock Ledger',
      description: 'View detailed stock ledger',
      icon: FiFileText,
      href: '/client/reports/stock-ledger',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Reports">
        <PageLayout
          title="Reports"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Reports' },
          ]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report, index) => {
              const Icon = report.icon;
              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`${report.color} text-white p-3 rounded-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {report.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(report.href);
                        }}
                      >
                        View Report
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}

