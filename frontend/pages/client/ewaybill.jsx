import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import ClientLayout from '../../components/layouts/ClientLayout';
import PageLayout from '../../components/layouts/PageLayout';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTable } from '../../hooks/useTable';
import { eWayBillAPI } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { FiPlus, FiSave, FiX, FiEye, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';

export default function EWayBillList() {
  const router = useRouter();
  const { voucher_id, view } = router.query;

  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [formData, setFormData] = useState({
    voucher_id: '',
    transporter_id: '',
    transporter_name: '',
    transport_mode: 'ROAD',
    vehicle_no: '',
    distance_km: '',
    from_pincode: '',
    to_pincode: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch E-Way Bill details
  const { data: ewbData, loading: ewbLoading, execute: fetchEWB } = useApi(
    () => eWayBillAPI.get(selectedVoucherId),
    false
  );

  // Handle router query params
  useEffect(() => {
    if (voucher_id) {
      setSelectedVoucherId(voucher_id);
      if (view === 'detail') {
        setShowDetail(true);
        fetchEWB();
      }
    }
  }, [voucher_id, view]);

  const {
    data: tableData,
    loading,
    pagination,
    handlePageChange,
    handleSort,
    sort,
    refetch,
  } = useTable(eWayBillAPI.list, {});

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.voucher_id.trim()) errors.voucher_id = 'Voucher ID is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const payload = {
        ...formData,
        distance_km: formData.distance_km ? parseInt(formData.distance_km, 10) : undefined,
      };
      const res = await eWayBillAPI.generate(payload);
      toast.success('E-Way Bill generated successfully');
      setShowGenerateForm(false);
      resetForm();
      refetch();
      // Show detail for the generated E-Way Bill
      setSelectedVoucherId(payload.voucher_id);
      setShowDetail(true);
      fetchEWB();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to generate E-Way Bill';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };

  const handleView = (row) => {
    setSelectedVoucherId(row.voucher_id);
    setShowDetail(true);
    fetchEWB();
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this E-Way Bill?')) return;
    try {
      await eWayBillAPI.cancel(selectedVoucherId, { reason: 'Cancelled by user' });
      toast.success('E-Way Bill cancelled successfully');
      fetchEWB();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel E-Way Bill');
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedVoucherId(null);
    router.push('/client/ewaybill', undefined, { shallow: true });
  };

  const resetForm = () => {
    setFormData({
      voucher_id: '',
      transporter_id: '',
      transporter_name: '',
      transport_mode: 'ROAD',
      vehicle_no: '',
      distance_km: '',
      from_pincode: '',
      to_pincode: '',
    });
    setFormErrors({});
  };

  const columns = [
    {
      key: 'eway_bill_no',
      label: 'E-Way Bill No',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'voucher_id',
      label: 'Voucher',
      sortable: false,
      render: (value) => (value ? String(value).slice(0, 8).toUpperCase() : 'N/A'),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const variants = {
          generated: 'success',
          cancelled: 'danger',
          pending: 'warning',
          failed: 'danger',
        };
        return <Badge variant={variants[value] || 'default'}>{value || 'N/A'}</Badge>;
      },
    },
    {
      key: 'generated_at',
      label: 'Generated At',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleString() : ''),
    },
    {
      key: 'valid_upto',
      label: 'Valid Upto',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleString() : ''),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            className="text-primary-600 hover:text-primary-700"
            title="View Details"
          >
            <FiEye className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  const ewb = ewbData?.eWayBill || ewbData?.data?.eWayBill || ewbData?.data || ewbData?.eWayBill || null;

  return (
    <ProtectedRoute>
      <ClientLayout title="E-Way Bill - Client Portal">
        <PageLayout
          title="E-Way Bill"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'E-Way Bill', href: '/client/ewaybill' },
          ]}
          actions={
            <Button
              onClick={() => {
                setShowGenerateForm(true);
                resetForm();
              }}
            >
              <FiPlus className="h-4 w-4 mr-2" />
              Generate E-Way Bill
            </Button>
          }
        >
          {/* Generate Modal */}
          <Modal
            isOpen={showGenerateForm}
            onClose={() => {
              setShowGenerateForm(false);
              resetForm();
            }}
            title="Generate E-Way Bill"
            size="lg"
          >
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="voucher_id"
                  label="Sales Voucher ID"
                  value={formData.voucher_id}
                  onChange={handleChange}
                  error={formErrors.voucher_id}
                  touched={!!formErrors.voucher_id}
                  placeholder="Paste voucher UUID"
                  required
                />

                <FormSelect
                  name="transport_mode"
                  label="Transport Mode"
                  value={formData.transport_mode}
                  onChange={handleChange}
                  error={formErrors.transport_mode}
                  touched={!!formErrors.transport_mode}
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
                  value={formData.vehicle_no}
                  onChange={handleChange}
                  error={formErrors.vehicle_no}
                  touched={!!formErrors.vehicle_no}
                  placeholder="e.g. GJ01AB1234"
                />

                <FormInput
                  name="distance_km"
                  label="Distance (KM)"
                  type="number"
                  value={formData.distance_km}
                  onChange={handleChange}
                  error={formErrors.distance_km}
                  touched={!!formErrors.distance_km}
                  placeholder="e.g. 120"
                />

                <FormInput
                  name="transporter_id"
                  label="Transporter ID"
                  value={formData.transporter_id}
                  onChange={handleChange}
                  error={formErrors.transporter_id}
                  touched={!!formErrors.transporter_id}
                />

                <FormInput
                  name="transporter_name"
                  label="Transporter Name"
                  value={formData.transporter_name}
                  onChange={handleChange}
                  error={formErrors.transporter_name}
                  touched={!!formErrors.transporter_name}
                />

                <FormInput
                  name="from_pincode"
                  label="From Pincode"
                  value={formData.from_pincode}
                  onChange={handleChange}
                  error={formErrors.from_pincode}
                  touched={!!formErrors.from_pincode}
                />

                <FormInput
                  name="to_pincode"
                  label="To Pincode"
                  value={formData.to_pincode}
                  onChange={handleChange}
                  error={formErrors.to_pincode}
                  touched={!!formErrors.to_pincode}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowGenerateForm(false);
                    resetForm();
                  }}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <FiSave className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </form>
          </Modal>

          {/* Detail View Modal */}
          <Modal
            isOpen={showDetail}
            onClose={handleCloseDetail}
            title="E-Way Bill Details"
            size="lg"
          >
            {ewbLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : ewb ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">E-Way Bill No</div>
                    <div className="font-semibold text-lg">{ewb.eway_bill_no || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div>
                      <Badge
                        variant={
                          ewb.status === 'generated'
                            ? 'success'
                            : ewb.status === 'cancelled'
                            ? 'danger'
                            : ewb.status === 'pending'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {ewb.status || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Generated At</div>
                    <div className="font-medium">
                      {ewb.generated_at ? new Date(ewb.generated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Valid Upto</div>
                    <div className="font-medium">
                      {ewb.valid_upto ? new Date(ewb.valid_upto).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Vehicle No</div>
                    <div className="font-medium">{ewb.vehicle_no || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Transport Mode</div>
                    <div className="font-medium">{ewb.transport_mode || 'N/A'}</div>
                  </div>
                </div>

                {ewb.status === 'generated' && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" onClick={async () => {
                        try {
                          const response = await eWayBillAPI.getStatus(ewb.eway_bill_no);
                          const status = response.data?.data || response.data;
                          toast.success('Status: ' + (status.status || 'N/A'));
                          fetchEWB();
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to get status');
                        }
                      }}>
                        <FiRefreshCw className="h-4 w-4 mr-2" />
                        Check Status
                      </Button>
                      <Button variant="outline" onClick={async () => {
                        if (!confirm('Extend E-Way Bill validity?')) return;
                        try {
                          await eWayBillAPI.extend(ewb.eway_bill_no, {
                            extended_upto: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                          });
                          toast.success('E-Way Bill extended successfully');
                          fetchEWB();
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to extend E-Way Bill');
                        }
                      }}>
                        Extend Validity
                      </Button>
                    <Button variant="danger" onClick={handleCancel}>
                      Cancel E-Way Bill
                    </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCloseDetail}>
                    <FiArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">No E-Way Bill found for this voucher.</p>
                <Button onClick={() => {
                  setShowDetail(false);
                  setShowGenerateForm(true);
                }}>
                  Generate E-Way Bill
                </Button>
              </div>
            )}
          </Modal>

          {/* Main List Table */}
          <Card className="shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={tableData?.data || tableData || []}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortField={sort.field}
              sortOrder={sort.order}
              onRowClick={(row) => handleView(row)}
            />
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
