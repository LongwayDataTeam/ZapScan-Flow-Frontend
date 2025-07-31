import React, { useState, useRef, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../config/api';

interface PendingShipment {
  tracking_id: string;
  scan_type: string;
  reason?: string;
  hold_time: string;
  items_count?: number;
  hold_stage?: string;
}

interface RecentHoldScan {
  id: string;
  tracking_id: string;
  scan_type: string;
  action: 'hold' | 'unhold_complete';
  scan_time: string;
  reason?: string;
  hold_stage?: string;
  items_count?: number;
  current_status?: string;
  last_scan?: string;
}

interface PendingShipmentTabProps {
  scanType: 'packing' | 'dispatch';
  onSwitchToPending: () => void;
  onSwitchToNormal: () => void;
  isPendingMode: boolean;
}

interface UnifiedPendingData {
  tracking_id: string;
  hold_stage: string;  // Packing Hold, Dispatch Hold, etc.
  current_stage: string;  // Packing, Dispatch, etc.
  current_status: string;  // On Hold, Unhold Complete, etc.
  items_count: number;
  hold_time: string;
  reason: string;
  action: string;  // hold, unhold_complete
  scan_time: string;
  platform: string;
  amount: number;
  buyer_city: string;
  courier: string;
}

const PendingShipmentTab: React.FC<PendingShipmentTabProps> = ({
  scanType,
  onSwitchToPending,
  onSwitchToNormal,
  isPendingMode
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([]);
  const [recentHoldScans, setRecentHoldScans] = useState<RecentHoldScan[]>([]);
  const [unifiedData, setUnifiedData] = useState<UnifiedPendingData[]>([]);
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add debounce mechanism to prevent multiple rapid scans
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  // Function to combine data into unified format
  const combineData = () => {
    const combined: UnifiedPendingData[] = [];
    
    // Only add current pending shipments (these are the ones actually on hold)
    pendingShipments.forEach(shipment => {
      // Determine current stage based on hold stage
      let currentStage = 'Unknown';
      if (shipment.hold_stage === 'Packing Hold') {
        currentStage = 'Packing';
      } else if (shipment.hold_stage === 'Dispatch Hold') {
        currentStage = 'Packing'; // Packing is completed, so current stage is Packing
      } else if (shipment.hold_stage === 'Label Hold') {
        currentStage = 'Label';
      } else {
        // Fallback based on scan_type
        currentStage = shipment.scan_type === 'packing' ? 'Packing' : 'Dispatch';
      }

      combined.push({
        tracking_id: shipment.tracking_id || 'Unknown',
        hold_stage: shipment.hold_stage || `${(shipment.scan_type || 'UNKNOWN').toUpperCase()} HOLD`,
        current_stage: currentStage,
        current_status: 'On Hold',
        items_count: shipment.items_count || 1,
        hold_time: shipment.hold_time || 'Unknown',
        reason: shipment.reason || 'No reason provided',
        action: 'hold',
        scan_time: shipment.hold_time || 'Unknown',
        platform: 'Unknown',
        amount: 0,
        buyer_city: 'Unknown',
        courier: 'Unknown'
      });
    });
    
    // Only add recent unhold activities (completed unholds) that are NOT currently pending
    recentHoldScans.forEach(scan => {
      // Only include if it's an unhold_complete action AND not currently pending
      if (scan.action === 'unhold_complete') {
        const isCurrentlyPending = pendingShipments.some(shipment => 
          shipment.tracking_id === scan.tracking_id
        );
        
        if (!isCurrentlyPending) {
          const holdStage = scan.hold_stage || (scan.scan_type === 'pending' ? 'PENDING' : scan.scan_type || 'UNKNOWN');
          
          // Determine current stage based on hold stage
          let currentStage = 'Unknown';
          if (scan.hold_stage === 'Packing Hold') {
            currentStage = 'Packing';
          } else if (scan.hold_stage === 'Dispatch Hold') {
            currentStage = 'Packing'; // Packing is completed, so current stage is Packing
          } else if (scan.hold_stage === 'Label Hold') {
            currentStage = 'Label';
          } else {
            // Fallback based on scan_type
            currentStage = scan.hold_stage === 'Packing Hold' ? 'Packing' : 'Dispatch';
          }
          
          combined.push({
            tracking_id: scan.tracking_id || 'Unknown',
            hold_stage: holdStage,
            current_stage: currentStage,
            current_status: 'Unhold Complete',
            items_count: scan.items_count || 1,
            hold_time: scan.scan_time || 'Unknown',
            reason: scan.reason || 'No reason provided',
            action: scan.action || 'unknown',
            scan_time: scan.scan_time || 'Unknown',
            platform: 'Unknown',
            amount: 0,
            buyer_city: 'Unknown',
            courier: 'Unknown'
          });
        }
      }
    });
    
    // Sort by scan time (most recent first)
    combined.sort((a, b) => {
      const timeA = new Date(a.scan_time).getTime();
      const timeB = new Date(b.scan_time).getTime();
      return timeB - timeA;
    });
    
    setUnifiedData(combined);
  };

  // Fetch pending shipments
  const fetchPendingShipments = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PENDING_SHIPMENTS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingShipments(data.pending_shipments || []);
      } else {
        console.error('Failed to fetch pending shipments');
        setPendingShipments([]);
      }
    } catch (error) {
      console.error('Error fetching pending shipments:', error);
      setPendingShipments([]);
    }
  };

  // Fetch pending count
  const fetchPendingCount = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PENDING_SHIPMENTS_COUNT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const count = scanType === 'packing' ? data.packing_pending : data.dispatch_pending;
        setPendingCount(count || 0);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
      setPendingCount(0);
    }
  };

  // Fetch recent hold scans
  const fetchRecentHoldScans = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RECENT_SCANS}?scan_type=pending&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentHoldScans(data.results || []);
      } else {
        console.error('Failed to fetch recent hold scans');
        setRecentHoldScans([]);
      }
    } catch (error) {
      console.error('Error fetching recent hold scans:', error);
      setRecentHoldScans([]);
    }
  };

  useEffect(() => {
    if (isPendingMode) {
      fetchPendingShipments();
      fetchPendingCount();
      fetchRecentHoldScans();
    }
  }, [isPendingMode]);

  // Combine data whenever recent scans or pending shipments change
  useEffect(() => {
    if (isPendingMode) {
      combineData();
    }
  }, [recentHoldScans, pendingShipments, isPendingMode]);

  // Debug function to log data
  const debugData = () => {
    console.log('=== DEBUG DATA ===');
    console.log('Pending Shipments:', pendingShipments);
    console.log('Recent Hold Scans:', recentHoldScans);
    console.log('Unified Data:', unifiedData);
    console.log('==================');
  };

  // Debug on data change
  useEffect(() => {
    if (isPendingMode) {
      debugData();
    }
  }, [pendingShipments, recentHoldScans, unifiedData, isPendingMode]);

  // Auto-clear timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (trackingId && (success || error)) {
      timer = setTimeout(() => {
        setTrackingId('');
        setSuccess(false);
        setError('');
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [trackingId, success, error]);

  // Keep focus on input field
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current && isPendingMode) {
        inputRef.current.focus();
      }
    };

    // Focus on input
    if (inputRef.current && isPendingMode) {
      inputRef.current.focus();
    }

    // Add click listener to refocus
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isPendingMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase
    setTrackingId(value);
    
    // Auto-scan when barcode data is entered (typically ends with Enter or is a complete barcode)
    if (value.length > 5 && (value.includes('\n') || value.includes('\r'))) {
      // Remove any line breaks and get clean value
      const cleanValue = value.replace(/[\r\n]/g, '');
      
      // Prevent multiple rapid scans of the same code
      if (cleanValue === lastScannedCode && loading) {
        return; // Don't scan if it's the same code and we're already loading
      }
      
      // Clear any existing timeout
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      
      // Set the clean value and debounce the scan
      setTrackingId(cleanValue);
      setLastScannedCode(cleanValue);
      
      const newTimeout = setTimeout(() => {
        handleScan();
      }, 200); // Increased debounce time to 200ms
      
      setScanTimeout(newTimeout);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleScan = async () => {
    if (!trackingId.trim()) {
      setError('Please enter tracking ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.PENDING_SHIPMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_id: trackingId,
          scan_type: scanType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTrackingId('');
        setLastScannedCode(''); // Clear last scanned code to allow re-scanning
        setTimeout(() => setSuccess(false), 2000);
        
        // Refresh data after successful scan
        fetchPendingShipments();
        fetchPendingCount();
        fetchRecentHoldScans();
        
        // Keep focus on input after successful scan
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } else {
        setError(data.detail || 'Failed to put shipment on hold');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTrackingId('');
    setError('');
    setSuccess(false);
    setLastScannedCode(''); // Clear last scanned code
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    // Refocus input after reset
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'hold':
        return 'bg-red-100 text-red-800';
      case 'unhold_complete':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'hold':
        return '🔴';
      case 'unhold_complete':
        return '✅';
      default:
        return '⏸️';
    }
  };

  const handleSwitchToPending = () => {
    setShowConfirmation(true);
  };

  const confirmSwitch = () => {
    setShowConfirmation(false);
    onSwitchToPending();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
      {/* Unified Pending Shipment Transition UI */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mr-6 shadow-lg">
              <span className="text-orange-600 text-2xl font-bold">
                {isPendingMode ? '⏸' : '📦'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isPendingMode ? 'Pending Shipment Mode' : 'Normal Scanning Mode'}
              </h3>
              <p className="text-sm text-gray-600">
                {isPendingMode 
                  ? 'Manage holds and pending shipments' 
                  : 'Switch to pending shipment management'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isPendingMode ? (
              <button
                onClick={onSwitchToNormal}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <span className="mr-3">↩️</span>
                Back to Normal
              </button>
            ) : (
              <button
                onClick={handleSwitchToPending}
                className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <span className="mr-3">⏸</span>
                Switch to Pending
              </button>
            )}
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-orange-200">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${
                isPendingMode ? 'bg-orange-400' : 'bg-green-400'
              }`}></span>
              <span className="text-sm font-medium text-gray-700">
                {isPendingMode ? 'Pending Mode Active' : 'Normal Mode Active'}
              </span>
            </div>
            {isPendingMode && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-3">Pending Count:</span>
                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  {pendingShipments.length}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {isPendingMode ? 'Manage holds and releases' : 'Access hold functionality'}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mr-6 shadow-lg">
                <span className="text-orange-600 text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Switch to Pending Mode?</h3>
                <p className="text-sm text-gray-600">This will change the scanning interface to handle pending shipments.</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={confirmSwitch}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Yes, Switch
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Shipments Interface */}
      {isPendingMode && (
        <div className="space-y-8">
          {/* Scanning Interface */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Put Shipment on Hold</h3>
                <p className="text-sm text-gray-600">Scan tracking ID to put shipment on hold for {scanType}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  <span className="w-3 h-3 bg-orange-400 rounded-full mr-3"></span>
                  Hold Mode
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-3">
                  Tracking ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleScan();
                      }
                    }}
                    placeholder="Scan or enter tracking ID..."
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 font-mono text-lg"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-gray-400">📱</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={handleScan}
                  disabled={loading || !trackingId.trim()}
                  className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 ${
                    loading || !trackingId.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-3">⏸</span>
                      Put on Hold
                    </div>
                  )}
                </button>
                
                <div className="text-sm text-gray-500">
                  Press Enter to scan automatically
                </div>
              </div>
            </div>
            
            {(success || error) && (
              <div className={`mt-6 p-4 rounded-lg border ${
                success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <span className="mr-3">
                    {success ? '✅' : '❌'}
                  </span>
                  {success ? 'Shipment put on hold successfully!' : error}
                </div>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-2">Currently On Hold</p>
                  <p className="text-3xl font-bold text-red-800">{pendingShipments.length}</p>
                  <p className="text-xs text-red-600 mt-1">Active holds</p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-red-700 text-lg font-bold">⏸</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-2">Recently Unhold</p>
                  <p className="text-3xl font-bold text-green-800">
                    {recentHoldScans.filter(scan => scan.action === 'unhold_complete').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Completed releases</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-green-700 text-lg font-bold">✅</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 mb-2">Total Activities</p>
                  <p className="text-3xl font-bold text-blue-800">{unifiedData.length}</p>
                  <p className="text-xs text-blue-600 mt-1">All records</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-blue-700 text-lg font-bold">📊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 mb-2">Recent Scans</p>
                  <p className="text-3xl font-bold text-purple-800">{recentHoldScans.length}</p>
                  <p className="text-xs text-purple-600 mt-1">Hold activities</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-purple-700 text-lg font-bold">🕒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Pending Shipments Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All Pending Shipment Activities</h3>
                  <p className="text-sm text-gray-600">Comprehensive view of all hold and release activities</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Live Data
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tracking ID
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hold Stage
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Current Stage
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hold Time
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {unifiedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-8 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <span className="text-gray-400 text-2xl">📦</span>
                          </div>
                          <p className="text-lg font-medium text-gray-900 mb-2">No pending shipment activities</p>
                          <p className="text-sm text-gray-500">Start by putting shipments on hold to see them here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    unifiedData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 shadow-md">
                              <span className="text-gray-600 text-xs font-bold">📋</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 font-mono">
                              {item.tracking_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                            {item.hold_stage}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                            {item.current_stage}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${
                            item.current_status === 'On Hold' 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              item.current_status === 'On Hold' ? 'bg-red-400' : 'bg-green-400'
                            }`}></span>
                            {item.current_status}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{item.items_count}</span>
                            <span className="text-xs text-gray-500 ml-1">item{item.items_count !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${
                            item.action === 'hold' 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            <span className="mr-2">{item.action === 'hold' ? '⏸' : '✅'}</span>
                            {item.action === 'hold' ? 'Hold' : 'Unhold Complete'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{item.hold_time}</span>
                            {item.hold_time !== 'Unknown' && (
                              <span className="ml-2 text-xs text-gray-400">🕒</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="max-w-xs">
                            <span className="text-sm text-gray-600 truncate block">
                              {item.reason}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingShipmentTab; 