import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormSelect from '../forms/FormSelect';
import FormInput from '../forms/FormInput';
import { FiBarcode, FiCheck } from 'react-icons/fi';

export default function BarcodeGenerationModal({ 
  isOpen, 
  onClose, 
  items = [], 
  onGenerate 
}) {
  const [barcodeType, setBarcodeType] = useState('EAN13');
  const [barcodePrefix, setBarcodePrefix] = useState('PRD');
  const [loading, setLoading] = useState(false);

  const barcodeTypeOptions = [
    { value: 'EAN13', label: 'EAN-13 (International Standard)' },
    { value: 'EAN8', label: 'EAN-8 (Short Format)' },
    { value: 'CUSTOM', label: 'Custom Sequential' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate({
        barcode_type: barcodeType,
        barcode_prefix: barcodePrefix,
      });
      onClose();
    } catch (error) {
      console.error('Error generating barcodes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Barcodes"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiBarcode className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Barcode Generation
              </h4>
              <p className="text-sm text-blue-700">
                {items.length === 1 
                  ? `Generate a barcode for "${items[0]?.item_description || 'this item'}"`
                  : `Generate barcodes for ${items.length} items without barcodes`
                }
              </p>
            </div>
          </div>
        </div>

        <FormSelect
          name="barcode_type"
          label="Barcode Type"
          value={barcodeType}
          onChange={(name, value) => setBarcodeType(value)}
          options={barcodeTypeOptions}
          required
        />

        {barcodeType === 'CUSTOM' && (
          <FormInput
            name="barcode_prefix"
            label="Barcode Prefix"
            value={barcodePrefix}
            onChange={(name, value) => setBarcodePrefix(value)}
            placeholder="PRD"
            helperText="Prefix for custom sequential barcodes (e.g., PRD, ITEM, SKU)"
            required
          />
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h5 className="font-medium text-gray-900 text-sm">Barcode Format Info:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {barcodeType === 'EAN13' && (
              <>
                <li>• 13-digit international standard barcode</li>
                <li>• Includes country prefix (890 for India)</li>
                <li>• Suitable for retail products</li>
              </>
            )}
            {barcodeType === 'EAN8' && (
              <>
                <li>• 8-digit compact barcode format</li>
                <li>• Suitable for small products</li>
                <li>• Less common than EAN-13</li>
              </>
            )}
            {barcodeType === 'CUSTOM' && (
              <>
                <li>• Custom sequential numbering</li>
                <li>• Format: {barcodePrefix}XXXXXXXXXX</li>
                <li>• Suitable for internal inventory tracking</li>
              </>
            )}
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <FiCheck className="h-4 w-4" />
            <span>{loading ? 'Generating...' : 'Generate Barcodes'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
