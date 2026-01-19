
import { useState, useEffect } from 'react';
import { ClientLayout } from '@/components/layouts';
import { Card, FormInput, Button, IconButton } from '@/components/ui';
import { attributeAPI } from '@/lib/api';
import { FaTrash } from 'react-icons/fa';

const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [newAttribute, setNewAttribute] = useState('');
  const [newValue, setNewValue] = useState({});

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const res = await attributeAPI.list();
      setAttributes(res.data);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  const handleAddAttribute = async () => {
    if (!newAttribute.trim()) return;
    try {
      await attributeAPI.create(newAttribute);
      setNewAttribute('');
      fetchAttributes();
    } catch (error) {
      console.error('Error adding attribute:', error);
    }
  };

  const handleDeleteAttribute = async (id) => {
    try {
      await attributeAPI.delete(id);
      fetchAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
    }
  };

  const handleAddValue = async (attributeId) => {
    const value = newValue[attributeId];
    if (!value || !value.trim()) return;
    try {
      await attributeAPI.addValue(attributeId, value);
      setNewValue({ ...newValue, [attributeId]: '' });
      fetchAttributes();
    } catch (error) {
      console.error('Error adding value:', error);
    }
  };

  const handleDeleteValue = async (valueId) => {
    try {
      await attributeAPI.removeValue(valueId);
      fetchAttributes();
    } catch (error) {
      console.error('Error deleting value:', error);
    }
  };

  return (
    <ClientLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Product Attributes</h1>

        <Card className="mb-4">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Add New Attribute</h2>
            <div className="flex items-center gap-2">
              <FormInput
                name="new_attribute"
                placeholder="e.g., Color, Size"
                value={newAttribute}
                onChange={(e) => setNewAttribute(e.target.value)}
              />
              <Button onClick={handleAddAttribute}>Add Attribute</Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributes.map((attr) => (
            <Card key={attr.id}>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{attr.name}</h3>
                  <IconButton
                    icon={<FaTrash />}
                    onClick={() => handleDeleteAttribute(attr.id)}
                    variant="danger"
                    size="sm"
                  />
                </div>

                <div className="mb-2">
                  {attr.values && attr.values.map((val) => (
                    <div
                      key={val.id}
                      className="flex items-center justify-between bg-gray-100 rounded-md px-2 py-1 mb-1"
                    >
                      <span>{val.value}</span>
                      <IconButton
                        icon={<FaTrash />}
                        onClick={() => handleDeleteValue(val.id)}
                        variant="danger"
                        size="xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <FormInput
                    name={`new_value_${attr.id}`}
                    placeholder="Add new value"
                    value={newValue[attr.id] || ''}
                    onChange={(e) =>
                      setNewValue({ ...newValue, [attr.id]: e.target.value })
                    }
                  />
                  <Button onClick={() => handleAddValue(attr.id)} size="sm">
                    Add Value
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
};

export default AttributesPage;
