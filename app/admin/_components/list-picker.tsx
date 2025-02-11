import React from 'react';

interface Item {
  id: string;
  description: string;
}

interface ListPickerProps {
  items: Item[];
  selectedItemIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const ToolList: React.FC<ListPickerProps> = ({ items, selectedItemIds, onSelectionChange }) => {
  const handleCheckboxChange = (itemId: string) => {
    const newSelectedToolIds = selectedItemIds.includes(itemId)
      ? selectedItemIds.filter((id) => id !== itemId)
      : [...selectedItemIds, itemId];

    onSelectionChange(newSelectedToolIds);
  };

  return (
    <div className="h-96 overflow-y-scroll border border-gray-300 rounded-md p-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center">
            <input
              type="checkbox"
              id={`tool-${item.id}`}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={selectedItemIds.includes(item.id)}
              onChange={() => handleCheckboxChange(item.id)}
            />
            <label htmlFor={`tool-${item.id}`} className="ml-2 text-gray-700">
              {item.description}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToolList;