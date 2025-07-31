import React from 'react';
import HoldShipmentsView from '../components/HoldShipmentsView';

const HoldShipments: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hold Shipments</h1>
          <p className="text-gray-600">View and manage all shipments currently on hold</p>
        </div>

        {/* Hold Shipments View */}
        <HoldShipmentsView />
      </div>
    </div>
  );
};

export default HoldShipments; 