
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const VariantSelectionModal = ({ isOpen, onClose, variants, onSelectVariant }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Variant">
      <div className="p-4">
        <ul className="space-y-2">
          {variants.map((variant) => (
            <li
              key={variant.id}
              onClick={() => onSelectVariant(variant)}
              className="p-2 border rounded-md hover:bg-gray-100 cursor-pointer"
            >
              {Object.entries(variant.variant_attributes)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VariantSelectionModal;
