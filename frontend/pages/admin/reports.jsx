import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/layouts/AdminLayout';
import PageLayout from '../../components/layouts/PageLayout';
import Card from '../../components/ui/Card';
import {
  FiBarChart2, FiDollarSign, FiTrendingUp, FiUsers,
  FiTarget, FiPieChart, FiFileText, FiCalendar
} from 'react-icons/fi';

const reportCategories = [
  {
    title: 'Revenue Reports',
    icon: FiDollarSign,
    color: 'text-green-600 bg-green-50',
    reports: [
      {
        name: 'Total Revenue Report',
        description: 'Complete revenue breakdown with monthly trends and plan-wise analysis',
        href: '/admin/reports/revenue/total',
        icon: FiBarChart2,
      },
      {
        name: 'Revenue Comparison Report',
        description: 'Compare revenue between two periods with growth analysis',
        href: '/admin/reports/revenue/comparison',
        icon: FiTrendingUp,
      },
      {
        name: 'Revenue by Type Report',
        description: 'Revenue breakdown by acquisition channel, plan, and commission type',
        href: '/admin/reports/revenue/by-type',
        icon: FiPieChart,
      },
      {
        name: 'Revenue Trend Report',
        description: 'Revenue trends over time (monthly, quarterly, yearly)',
        href: '/admin/reports/revenue/trend',
        icon: FiTrendingUp,
      },
    ],
  },
  {
    title: 'Commission Reports',
    icon: FiDollarSign,
    color: 'text-yellow-600 bg-yellow-50',
    reports: [
      {
        name: 'Commission Summary Report',
        description: 'Total commissions by status, type, and monthly breakdown',
        href: '/admin/reports/commission/summary',
        icon: FiFileText,
      },
      {
        name: 'Commission Distribution Report',
        description: 'Commissions by distributor and salesman with top earners',
        href: '/admin/reports/commission/distribution',
        icon: FiUsers,
      },
    ],
  },
  {
    title: 'Performance Reports',
    icon: FiTarget,
    color: 'text-blue-600 bg-blue-50',
    reports: [
      {
        name: 'Distributor Performance Report',
        description: 'Performance metrics for all distributors with rankings',
        href: '/admin/reports/performance/distributor',
        icon: FiUsers,
      },
      {
        name: 'Salesman Performance Report',
        description: 'Performance metrics for all salesmen with rankings',
        href: '/admin/reports/performance/salesman',
        icon: FiUsers,
      },
      {
        name: 'Target Achievement Report',
        description: 'Target vs achieved comparison for all active targets',
        href: '/admin/reports/performance/targets',
        icon: FiTarget,
      },
    ],
  },
  {
    title: 'Categorization Reports',
    icon: FiPieChart,
    color: 'text-purple-600 bg-purple-50',
    reports: [
      {
        name: 'Distributor Categorization Report',
        description: 'Distributors grouped by performance tiers and revenue ranges',
        href: '/admin/reports/categorization/distributor',
        icon: FiUsers,
      },
      {
        name: 'Salesman Categorization Report',
        description: 'Salesmen grouped by performance tiers and revenue ranges',
        href: '/admin/reports/categorization/salesman',
        icon: FiUsers,
      },
      {
        name: 'Tenant Acquisition Report',
        description: 'Tenant acquisition breakdown by category, plan, and status',
        href: '/admin/reports/tenant/acquisition',
        icon: FiBarChart2,
      },
    ],
  },
  {
    title: 'Summary Reports',
    icon: FiFileText,
    color: 'text-primary-600 bg-primary-50',
    reports: [
      {
        name: 'Executive Summary Report',
        description: 'High-level overview with key metrics and top performers',
        href: '/admin/reports/summary/executive',
        icon: FiFileText,
      },
      {
        name: 'Financial Summary Report',
        description: 'Complete financial overview with revenue, commissions, and profit',
        href: '/admin/reports/summary/financial',
        icon: FiDollarSign,
      },
    ],
  },
];

export default function ReportsIndex() {
  const router = useRouter();

  return (
    <ProtectedRoute portalType="admin">
      <AdminLayout>
        <PageLayout
          title="Reports Dashboard"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Reports' },
          ]}
        >
          <div className="space-y-6">
            <Card>
              <p className="text-gray-600">
                Generate comprehensive reports for revenue, commissions, performance, and more.
              </p>
            </Card>

            {reportCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;
              return (
                <Card key={categoryIndex} className="overflow-hidden">
                  <div className={`${category.color} p-4 flex items-center rounded-t-xl`}>
                    <CategoryIcon className="h-6 w-6 mr-3" />
                    <h2 className="text-lg font-semibold">{category.title}</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.reports.map((report, reportIndex) => {
                      const ReportIcon = report.icon;
                      return (
                        <Card
                          key={reportIndex}
                          onClick={() => router.push(report.href)}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary-300 group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <ReportIcon className="h-5 w-5 text-primary-600 mr-2" />
                              <h3 className="font-semibold text-gray-900">{report.name}</h3>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                          <div className="text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            View Report <span className="ml-1">→</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
