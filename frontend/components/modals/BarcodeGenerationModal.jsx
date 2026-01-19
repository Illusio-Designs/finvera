import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FiHash, FiCheck } from 'react-icons/fi';

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
            <FiHash className="h-5 w-5 text-blue-600 mt-0.5" />
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

        {/* Barcode Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barcode Type
          </label>
          <select
            value={barcodeType}
            onChange={(e) => setBarcodeType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {barcodeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Barcode Prefix Input (only for CUSTOM type) */}
        {barcodeType === 'CUSTOM' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode Prefix
            </label>
            <input
              type="text"
              value={barcodePrefix}
              onChange={(e) => setBarcodePrefix(e.target.value)}
              placeholder="PRD"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Prefix for custom sequential barcodes (e.g., PRD, ITEM, SKU)
            </p>
          </div>
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
