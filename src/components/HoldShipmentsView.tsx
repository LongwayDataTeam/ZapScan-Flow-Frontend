import React, { useState, useEffect } from 'react';
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../config/api';

interface HoldShipment {
  tracker_code: string;
  tracking_id: string;
  scan_type: string;
  hold_stage: string;
  hold_time: string;
  items_count: number;
  reason: string;
  details: any;
  status: {
    label: boolean;
    packing: boolean;
    dispatch: boolean;
    pending: boolean;
  };
  progress: {
    label: string;
    packing: string;
    dispatch: string;
    hold: string;
  };
}

interface HoldShipmentsSummary {
  dispatch_hold: number;
  packing_hold: number;
  label_hold: number;
  total: number;
}

const HoldShipmentsView: React.FC = () => {
  const [holdShipments, setHoldShipments] = useState<HoldShipment[]>([]);
  const [summary, setSummary] = useState<HoldShipmentsSummary>({
    dispatch_hold: 0,
    packing_hold: 0,
    label_hold: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHoldShipments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_ENDPOINTS.ALL_HOLD_SHIPMENTS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hold shipments');
      }

      const data = await response.json();
      setHoldShipments(data.hold_shipments || data.held_shipments || []);
      
      // Calculate summary
      const dispatchHold = (data.hold_shipments || data.held_shipments || [])?.filter((s: HoldShipment) => s.hold_stage === 'Dispatch Hold').length || 0;
      const packingHold = (data.hold_shipments || data.held_shipments || [])?.filter((s: HoldShipment) => s.hold_stage === 'Packing Hold').length || 0;
      const labelHold = (data.hold_shipments || data.held_shipments || [])?.filter((s: HoldShipment) => s.hold_stage === 'Label Hold').length || 0;
      
      setSummary({
        dispatch_hold: dispatchHold,
        packing_hold: packingHold,
        label_hold: labelHold,
        total: (data.hold_shipments || data.held_shipments || []).length || 0
      });
    } catch (error) {
      console.error('Error fetching hold shipments:', error);
      setError('Failed to fetch hold shipments');
      setHoldShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldShipments();
  }, []);

  const getHoldStageColor = (stage: string) => {
    switch (stage) {
      case 'Dispatch Hold':
        return 'bg-purple-100 text-purple-800';
      case 'Packing Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Label Hold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHoldStageIcon = (stage: string) => {
    switch (stage) {
      case 'Dispatch Hold':
        return '🚚';
      case 'Packing Hold':
        return '📦';
      case 'Label Hold':
        return '🏷️';
      default:
        return '⏸️';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading hold shipments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
          <span className="text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClockIcon className="h-6 w-6 text-orange-500 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">All Hold Shipments</h2>
        </div>
        <div className="text-sm text-gray-600">
          Total: {holdShipments.length} shipments
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🚚</span>
            <div>
              <div className="text-sm font-medium text-purple-800">Dispatch Hold</div>
              <div className="text-2xl font-bold text-purple-900">{summary.dispatch_hold}</div>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">📦</span>
            <div>
              <div className="text-sm font-medium text-orange-800">Packing Hold</div>
              <div className="text-2xl font-bold text-orange-900">{summary.packing_hold}</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏷️</span>
            <div>
              <div className="text-sm font-medium text-blue-800">Label Hold</div>
              <div className="text-2xl font-bold text-blue-900">{summary.label_hold}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hold Shipments List */}
      {holdShipments.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hold Shipments</h3>
          <p className="text-gray-600">All shipments are currently active and processing normally.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hold Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holdShipments.map((shipment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.tracking_id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {shipment.tracker_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {getHoldStageIcon(shipment.hold_stage)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHoldStageColor(shipment.hold_stage)}`}>
                        {shipment.hold_stage}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2">🏷️</span>
                        <span className={shipment.status.label ? 'text-green-600' : 'text-gray-500'}>
                          {shipment.progress.label}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2">📦</span>
                        <span className={shipment.status.packing ? 'text-green-600' : 'text-gray-500'}>
                          {shipment.progress.packing}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2">🚚</span>
                        <span className={shipment.status.dispatch ? 'text-green-600' : 'text-gray-500'}>
                          {shipment.progress.dispatch}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2">⏸️</span>
                        <span className="text-red-600 font-medium">
                          {shipment.progress.hold}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shipment.details?.channel_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{shipment.details?.amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shipment.details?.buyer_city || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shipment.details?.courier || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchHoldShipments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default HoldShipmentsView; 