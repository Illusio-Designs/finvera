import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import ClientLayout from '../../../../components/layouts/ClientLayout';
import PageLayout from '../../../../components/layouts/PageLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import FormInput from '../../../../components/forms/FormInput';
import SearchableHSNSelect from '../../../../components/forms/SearchableHSNSelect';
import { accountingAPI } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { FiSave, FiX, FiArrowLeft } from 'react-icons/fi';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    hsn_sac_code: '',
    uqc: '',
    gst_rate: '',
    quantity_on_hand: '0',
    avg_cost: '0',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleHSNSelect = (hsnData) => {
    // Auto-fill GST rate and UQC when HSN is selected
    setFormData((prev) => ({
      ...prev,
      hsn_sac_code: hsnData.hsn_sac_code,
      gst_rate: hsnData.gst_rate ? hsnData.gst_rate.toString() : prev.gst_rate,
      uqc: hsnData.uqc || prev.uqc,
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.item_name?.trim()) {
      newErrors.item_name = 'Item name is required';
    }

    if (formData.gst_rate && (isNaN(formData.gst_rate) || parseFloat(formData.gst_rate) < 0 || parseFloat(formData.gst_rate) > 100)) {
      newErrors.gst_rate = 'GST rate must be between 0 and 100';
    }

    if (formData.quantity_on_hand && (isNaN(formData.quantity_on_hand) || parseFloat(formData.quantity_on_hand) < 0)) {
      newErrors.quantity_on_hand = 'Quantity must be a positive number';
    }

    if (formData.avg_cost && (isNaN(formData.avg_cost) || parseFloat(formData.avg_cost) < 0)) {
      newErrors.avg_cost = 'Average cost must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        item_code: formData.item_code || null,
        item_name: formData.item_name.trim(),
        hsn_sac_code: formData.hsn_sac_code || null,
        uqc: formData.uqc || null,
        gst_rate: formData.gst_rate ? parseFloat(formData.gst_rate) : null,
        quantity_on_hand: parseFloat(formData.quantity_on_hand) || 0,
        avg_cost: parseFloat(formData.avg_cost) || 0,
        is_active: formData.is_active,
      };

      await accountingAPI.inventory.items.create(payload);
      toast.success('Item created successfully');
      // Use replace instead of push to avoid adding to history and prevent back navigation issues
      router.replace('/client/inventory/items');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create item';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="New Inventory Item">
        <PageLayout
          title="New Inventory Item"
          breadcrumbs={[
            { label: 'Client', href: '/client/dashboard' },
            { label: 'Inventory', href: '/client/inventory/items' },
            { label: 'Items', href: '/client/inventory/items' },
            { label: 'New' },
          ]}
          actions={
            <Button
              onClick={() => router.push('/client/inventory/items')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          }
        >
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  name="item_name"
                  label="Item Name"
                  value={formData.item_name}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.item_name}
                  required
                  placeholder="Enter item name"
                />

                <FormInput
                  name="item_code"
                  label="Item Code"
                  value={formData.item_code}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.item_code}
                  placeholder="Enter item code (optional)"
                />

                <SearchableHSNSelect
                  name="hsn_sac_code"
                  label="HSN/SAC Code"
                  value={formData.hsn_sac_code}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.hsn_sac_code}
                  placeholder="Search HSN/SAC code..."
                  onHSNSelect={handleHSNSelect}
                />

                <FormInput
                  name="uqc"
                  label="Unit of Measurement (UQC)"
                  value={formData.uqc}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.uqc}
                  placeholder="e.g., NOS, KGS, LTR (optional)"
                />

                <FormInput
                  name="gst_rate"
                  label="GST Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.gst_rate}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.gst_rate}
                  placeholder="Enter GST rate (optional)"
                />

                <FormInput
                  name="quantity_on_hand"
                  label="Initial Stock Quantity"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.quantity_on_hand}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.quantity_on_hand}
                  placeholder="0"
                />

                <FormInput
                  name="avg_cost"
                  label="Average Cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.avg_cost}
                  onChange={(name, value) => handleChange(name, value)}
                  error={errors.avg_cost}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <FiSave className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Item'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/client/inventory/items')}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <FiX className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            </form>
          </Card>
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
