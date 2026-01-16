
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import PageLayout from '../../../components/layouts/PageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';
import FormDatePicker from '../../../components/forms/FormDatePicker';
import FormTextarea from '../../../components/forms/FormTextarea';
import SearchableHSNSelect from '../../../components/forms/SearchableHSNSelect';
import Checkbox from '../../../components/ui/Checkbox';
import BarcodeGenerationModal from '../../../components/modals/BarcodeGenerationModal';
import VariantSelectionModal from '../../../components/modals/VariantSelectionModal';
import { accountingAPI } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import { formatCurrency } from '../../../lib/formatters';

// ... (calculateGST function remains the same)

export default function PurchaseInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partyLedger, setPartyLedger] = useState(null);
  const [supplierState, setSupplierState] = useState('Maharashtra');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [createdItems, setCreatedItems] = useState([]);

  // State for variant selection
  const [isVariantModalOpen, setVariantModalOpen] = useState(false);
  const [variantsForItem, setVariantsForItem] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);

  const [formData, setFormData] = useState({
    // ... (formData state remains the same)
  });

  const [items, setItems] = useState([
    // ... (items state remains the same)
  ]);

  const [errors, setErrors] = useState({});

  // ... (useApi hooks for ledgers, inventory, and warehouses remain the same)
  // ... (useMemo for ledgers, inventoryItems, warehouses remains the same)
  // ... (useMemo for supplierLedgers and ledgerOptions remains the same)

  const inventoryOptions = useMemo(() => {
    // Filter out variants from the main item list
    return inventoryItems
      .filter(item => !item.variant_of_id)
      .map((item) => ({
        value: item.id,
        label: `${item.item_name}${item.item_code ? ` (${item.item_code})` : ''}`,
        item,
      }));
  }, [inventoryItems]);

  // ... (warehouseOptions and useEffect for partyLedger remain the same)
  // ... (handleFormChange and handleItemChange remain the same)

  const handleInventoryItemSelect = async (itemId, selectedInventoryId) => {
    if (!selectedInventoryId) {
      // ... (reset item logic remains the same)
      return;
    }

    const inventoryItem = inventoryItems.find((item) => item.id === selectedInventoryId);
    if (!inventoryItem) return;

    // Check for variants
    const variants = inventoryItems.filter(item => item.variant_of_id === selectedInventoryId);
    if (variants.length > 0) {
      setVariantsForItem(variants);
      setCurrentItemId(itemId);
      setVariantModalOpen(true);
    } else {
      // No variants, proceed as normal
      updateItemWithInventoryData(itemId, inventoryItem);
    }
  };

  const handleVariantSelect = (variant) => {
    if (currentItemId && variant) {
      updateItemWithInventoryData(currentItemId, variant);
    }
    setVariantModalOpen(false);
    setVariantsForItem([]);
    setCurrentItemId(null);
  };

  const updateItemWithInventoryData = (itemId, inventoryData) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = {
          ...item,
          inventory_item_id: inventoryData.id,
          item_code: inventoryData.item_code || '',
          item_description: inventoryData.item_name || '',
          hsn_sac_code: inventoryData.hsn_sac_code || '',
          uqc: inventoryData.uqc || '',
          gst_rate: inventoryData.gst_rate ? String(inventoryData.gst_rate) : '18',
          rate: inventoryData.avg_cost ? String(inventoryData.avg_cost) : item.rate,
          warehouse_id: item.warehouse_id || '',
        };

        // ... (recalculation logic remains the same)

        return updated;
      })
    );
    
    const currentItem = items.find((i) => i.id === itemId);
    if (currentItem?.warehouse_id) {
      fetchWarehouseStock(itemId, inventoryData.id, currentItem.warehouse_id);
    }
  };

  // ... (fetchWarehouseStock, handleWarehouseSelect, handleHSNSelect, addItem, removeItem, totals, validate, handleSubmit, etc. remain the same)

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Purchase Invoice">
        <PageLayout /* ... */ >
          {/* ... (form content remains the same) */}

          {/* Variant Selection Modal */}
          <VariantSelectionModal
            isOpen={isVariantModalOpen}
            onClose={() => setVariantModalOpen(false)}
            variants={variantsForItem}
            onSelectVariant={handleVariantSelect}
          />

          {/* Barcode Generation Modal */}
          <BarcodeGenerationModal
            isOpen={showBarcodeModal}
            onClose={handleSkipBarcode}
            items={createdItems}
            onGenerate={handleBarcodeGeneration}
          />
        </PageLayout>
      </ClientLayout>
    </ProtectedRoute>
  );
}
