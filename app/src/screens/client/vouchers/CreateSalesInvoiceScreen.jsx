import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import CreateSalesInvoiceModal from '../../../components/modals/CreateSalesInvoiceModal';

export default function CreateSalesInvoiceScreen() {
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => navigation.goBack(), 300);
  };

  const handleInvoiceCreated = (invoice) => {
    // Navigate back after successful creation
    navigation.goBack();
  };

  return (
    <CreateSalesInvoiceModal
      visible={showModal}
      onClose={handleClose}
      onInvoiceCreated={handleInvoiceCreated}
    />
  );
}
