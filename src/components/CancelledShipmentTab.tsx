import React, { useState, useEffect, useRef } from 'react';
import { QrCodeIcon, CheckCircleIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../config/api';

interface CancelledShipmentTabProps {
  scanType: 'packing' | 'dispatch';
  onSwitchToCancelled: () => void;
  onSwitchToNormal: () => void;
  isCancelledMode: boolean;
}

interface RecentActivity {
  id: string;
  tracking_id: string;
  platform: string;
  scan_stage: 'Label' | 'Packing' | 'Dispatch' | 'Cancelled';
  current_stage: 'Label' | 'Packing' | 'Dispatch' | 'Pending' | 'Cancelled';
  current_status: 'Success' | 'Error' | 'Pending' | 'Cancelled';
  scan_time: string;
  amount?: number;
  buyer_city?: string;
  courier?: string;
  distribution: 'Single SKU' | 'Multi SKU';
}

const CancelledShipmentTab: React.FC<CancelledShipmentTabProps> = ({
  scanType,
  onSwitchToCancelled,
  onSwitchToNormal,
  isCancelledMode
}) => {
  const [trackerCode, setTrackerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(totalActivities / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await fetch(`${API_ENDPOINTS.CANCELLED_SHIPMENTS()}?scan_type=${scanType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our interface
        const transformedActivities = (data.cancelled_shipments || []).map((shipment: any) => {
          // Parse the cancellation stage to extract previous and current stages
          const cancellationStage = shipment.cancellation_stage || 'Unknown';
          let scanStage = 'Unknown';
          let currentStage = 'Cancelled';
          
          if (cancellationStage.includes('Post-Dispatch')) {
            scanStage = 'Dispatch';
            currentStage = 'Cancelled';
          } else if (cancellationStage.includes('Post-Packing')) {
            scanStage = 'Packing';
            currentStage = 'Cancelled';
          } else if (cancellationStage.includes('Post-Label')) {
            scanStage = 'Label';
            currentStage = 'Cancelled';
          } else if (cancellationStage.includes('Pre-Processing')) {
            scanStage = 'Pre-Processing';
            currentStage = 'Cancelled';
          }
          
          return {
            id: shipment.tracker_code || 'unknown',
            tracking_id: shipment.tracking_id || 'unknown',
            platform: shipment.details?.channel_name || 'Unknown',
            scan_stage: scanStage,
            current_stage: currentStage,
            current_status: 'Cancelled',
            scan_time: shipment.cancellation_time || 'Unknown',
            amount: shipment.details?.amount || 0,
            buyer_city: shipment.details?.buyer_city || 'Unknown',
            courier: shipment.details?.courier || 'Unknown',
            distribution: 'Single SKU' // Default, can be enhanced later
          };
        });
        setRecentActivities(transformedActivities);
        setTotalActivities(data.count || 0);
      } else {
        console.error('Failed to fetch cancelled shipments');
        setRecentActivities([]);
        setTotalActivities(0);
      }
    } catch (error) {
      console.error('Error fetching cancelled shipments:', error);
      setRecentActivities([]);
      setTotalActivities(0);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRecentActivities();
  }, [currentPage]);

  const handleScan = async () => {
    if (!trackerCode.trim()) {
      setError('Please enter tracker code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.CANCELLED_SHIPMENT(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracker_code: trackerCode.trim(),
          scan_type: scanType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTrackerCode('');
        setTimeout(() => setSuccess(false), 3000);
        
        // Refresh activities after successful scan
        fetchRecentActivities();
        
        // Focus input for next scan
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } else {
        setError(data.detail || 'Failed to cancel shipment');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setTrackerCode(value);
    
    // Auto-scan when barcode data is entered
    if (value.length > 5 && (value.includes('\n') || value.includes('\r'))) {
      const cleanValue = value.replace(/[\r\n]/g, '');
      setTrackerCode(cleanValue);
      setTimeout(() => handleScan(), 100);
    }
  };

  const getStatusColor = (status: string) => {
    // Ensure status is a string
    const statusStr = String(status || 'Unknown');
    switch (statusStr) {
      case 'Success': return 'bg-green-100 text-green-800';
      case 'Error': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    // Ensure stage is a string
    const stageStr = String(stage || 'Unknown');
    switch (stageStr) {
      case 'Label': return 'bg-blue-100 text-blue-800';
      case 'Packing': return 'bg-green-100 text-green-800';
      case 'Dispatch': return 'bg-purple-100 text-purple-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Pre-Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-lg">❌</span>
          </div>
          <h2 className="text-lg font-semibold text-red-800">Active Cancelled Shipment Management</h2>
        </div>
        <p className="text-sm text-red-700">
          Cancel shipments that cannot be fulfilled. Scan the tracker code to mark as cancelled.
        </p>
      </div>

      {/* Scanning Interface */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCodeIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cancellation Scan Station</h3>
          <p className="text-gray-600">Scan tracker code to cancel shipment</p>
        </div>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tracker Code
          </label>
          <input
            ref={inputRef}
            type="text"
            value={trackerCode}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="SCAN TRACKER CODE (AUTO UPPERCASE)"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-uppercase"
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800 font-medium">
                Shipment successfully cancelled!
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{totalActivities}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-lg">❌</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Active</p>
              <p className="text-2xl font-bold text-blue-600">
                {recentActivities.filter(activity => 
                  new Date(activity.scan_time).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Multi-SKU Active</p>
              <p className="text-2xl font-bold text-purple-600">
                {recentActivities.filter(activity => activity.distribution === 'Multi SKU').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Cancelled Activities</h3>
          <div className="text-sm text-gray-600">
            {loadingActivities ? 'Loading...' : `Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalActivities)} of ${totalActivities} active cancellations`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scan Stage
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribution
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingActivities ? (
                <tr>
                  <td colSpan={10} className="px-3 py-4 text-center text-sm text-gray-500">
                    Loading recent activities...
                  </td>
                </tr>
              ) : recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-4 text-center text-sm text-gray-500">
                    No active cancelled shipments found
                  </td>
                </tr>
              ) : (
                recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {String(activity.tracking_id || 'Unknown')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(activity.platform || 'Unknown')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(activity.scan_stage)}`}>
                        {String(activity.scan_stage || 'Unknown')}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(activity.current_stage)}`}>
                        {String(activity.current_stage || 'Unknown')}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.current_status)}`}>
                        {String(activity.current_status || 'Unknown')}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(activity.distribution || 'Unknown')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{Number(activity.amount || 0).toFixed(0)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(activity.buyer_city || 'Unknown')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(activity.courier || 'Unknown')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {String(activity.scan_time || 'Unknown')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loadingActivities}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loadingActivities}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelledShipmentTab; 