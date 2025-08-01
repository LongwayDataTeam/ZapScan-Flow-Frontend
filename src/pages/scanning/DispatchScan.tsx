import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, TruckIcon, ChevronLeftIcon, ChevronRightIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../../config/api';
import PendingShipmentTab from '../../components/PendingShipmentTab';
import CancelledShipmentTab from '../../components/CancelledShipmentTab';
import ConfirmationModal from '../../components/ConfirmationModal';

interface TrackerDetails {
  g_code?: string;
  ean_code?: string;
  product_sku_code?: string;
  amount?: number;
  buyer_city?: string;
  buyer_state?: string;
  buyer_pincode?: string;
  order_id?: string;
  sub_order_id?: string;
  courier?: string;
  channel_name?: string;
  qty?: number;
  payment_mode?: string;
  order_status?: string;
  invoice_number?: string;
  total_sku_count?: number; // Total number of SKUs in the order
  scanned_sku_count?: number; // Number of SKUs already scanned
  remaining_sku_count?: number; // Number of SKUs remaining to scan
  is_multi_sku?: boolean; // Whether this is a multi-SKU order
}

interface ScanRecord {
  id: string;
  tracking_id: string;
  platform: string;
  last_scan: 'Label' | 'Packing' | 'Dispatch';
  scan_status: 'Success' | 'Error';
  distribution: 'Single SKU' | 'Multi SKU';
  scan_time: string;
  amount?: number;
  buyer_city?: string;
  courier?: string;
}

interface PlatformStats {
  courier: string;
  total: number;
  scanned: number;
  pending: number;
  multi_sku_scanned: number;
  single_sku_scanned: number;
  multi_sku_pending: number;
  single_sku_pending: number;
}

interface MultiSkuProgress {
  total: number;
  scanned: number;
  remaining: number;
  trackingId: string;
  selectedSkuGCode?: string;
  selectedSkuEanCode?: string;
  selectedSkuProductCode?: string;
}

const DispatchScan: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [trackerCode, setTrackerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [trackerDetails, setTrackerDetails] = useState<TrackerDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [multiSkuProgress, setMultiSkuProgress] = useState<MultiSkuProgress | null>(null);
  const [selectedSkuName, setSelectedSkuName] = useState<string>('');
  const [scanCountData, setScanCountData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'normal' | 'pending' | 'cancelled'>('normal');
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Real data states
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingScans, setLoadingScans] = useState(true);

  // Add debounce mechanism to prevent multiple rapid scans
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate pagination
  const totalPages = Math.ceil(totalScans / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Fetch platform statistics
  const fetchPlatformStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`${API_ENDPOINTS.PLATFORM_STATS()}?scan_type=dispatch`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlatformStats(data);
      } else {
        console.error('Failed to fetch platform statistics');
        setPlatformStats([]);
      }
    } catch (error) {
      console.error('Error fetching platform statistics:', error);
      setPlatformStats([]);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch recent scans
  const fetchRecentScans = async () => {
    try {
      setLoadingScans(true);
      const response = await fetch(`${API_ENDPOINTS.RECENT_SCANS()}?scan_type=dispatch&page=${currentPage}&limit=${itemsPerPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentScans(data.results || []);
        setTotalScans(data.count || 0);
      } else {
        console.error('Failed to fetch recent dispatch scans');
        setRecentScans([]);
        setTotalScans(0);
      }
    } catch (error) {
      console.error('Error fetching recent scans:', error);
      setRecentScans([]);
      setTotalScans(0);
    } finally {
      setLoadingScans(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (activeTab === 'normal') {
      fetchPlatformStats();
      fetchRecentScans();
    }
  }, [currentPage, activeTab]);

  // Auto-clear timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (trackerCode && (success || error)) {
      timer = setTimeout(() => {
        setTrackerCode('');
        setSuccess(false);
        setError('');
        setTrackerDetails(null);
        setShowDetails(false);
        
        // Only refocus after error, not after success
        if (error && inputRef.current) {
          inputRef.current.focus();
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [trackerCode, success, error]);

  // Keep focus on input field
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Add click listener to refocus
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleScan = async () => {
    if (!trackerCode.trim()) {
      setError('Please enter tracker code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.DISPATCH_SCAN(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracker_code: trackerCode,
          scan_type: 'dispatch'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle new bulk scan API response format
        if (data.total_scanned && data.progress) {
          // Bulk scan completed - update progress
          setMultiSkuProgress({
            total: data.progress.total,
            scanned: data.progress.scanned,
            remaining: data.progress.total - data.progress.scanned,
            trackingId: trackerCode,
            selectedSkuGCode: data.sku_scanned?.g_code,
            selectedSkuEanCode: data.sku_scanned?.ean_code,
            selectedSkuProductCode: data.sku_scanned?.product_sku_code
          });
          
          // Set the selected SKU name for success message
          const skuName = data.sku_scanned?.product_sku_code || data.sku_scanned?.g_code || 'SKU';
          setSelectedSkuName(skuName);
          
          // Check if all SKUs are scanned
          if (data.progress.scanned >= data.progress.total) {
            // All SKUs scanned - complete the order
            setSuccess(true);
            setTrackerCode('');
            setMultiSkuProgress(null);
            setSelectedSkuName('');
            setLastScannedCode(''); // Clear last scanned code to allow re-scanning
            setTimeout(() => setSuccess(false), 3000);
            // Refresh data after successful scan
            fetchPlatformStats();
            fetchRecentScans();
            // Keep focus on input after successful scan
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 100);
          } else {
            // More SKUs to scan - show progress
            setSuccess(true);
            setTrackerCode('');
            setLastScannedCode(''); // Clear last scanned code to allow re-scanning
            setTimeout(() => setSuccess(false), 2000);
            // Keep focus on input for next SKU scan
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 100);
          }
        } else {
          // Single SKU order or old format - normal behavior
          setSuccess(true);
          setTrackerCode('');
          setLastScannedCode(''); // Clear last scanned code
          setTimeout(() => setSuccess(false), 3000);
          // Refresh data after successful scan
          fetchPlatformStats();
          fetchRecentScans();
          // Keep focus on input after successful scan
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        }
      } else {
        setError(data.detail || 'Dispatch scan failed');
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
    const value = e.target.value.toUpperCase(); // Convert to uppercase
    setTrackerCode(value);
    
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
      setTrackerCode(cleanValue);
      setLastScannedCode(cleanValue);
      
      const newTimeout = setTimeout(() => {
        handleScan();
      }, 200); // Increased debounce time to 200ms
      
      setScanTimeout(newTimeout);
    }
  };

  const resetForm = () => {
    setTrackerCode('');
    setTrackerDetails(null);
    setShowDetails(false);
    setError('');
    setSuccess(false);
    setMultiSkuProgress(null); // Clear Multi-SKU progress
    setSelectedSkuName(''); // Clear selected SKU name
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

  const getStatusColor = (status: string) => {
    return status === 'Success' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getScanColor = (scan: string) => {
    switch (scan) {
      case 'Label': return 'bg-blue-100 text-blue-800';
      case 'Packing': return 'bg-green-100 text-green-800';
      case 'Dispatch': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (scanned: number, total: number) => {
    return total > 0 ? Math.round((scanned / total) * 100) : 0;
  };

  const handleSwitchToPending = () => {
    setConfirmationConfig({
      title: 'Switch to Pending Shipment',
      message: 'Are you sure you want to switch to Pending Shipment mode? This will allow you to put shipments on hold.',
      onConfirm: () => {
        setActiveTab('pending');
        setShowConfirmation(false);
        setConfirmationConfig(null);
      }
    });
    setShowConfirmation(true);
  };

  const handleSwitchToNormal = () => {
    setActiveTab('normal');
  };

  const handleSwitchToCancelled = () => {
    setConfirmationConfig({
      title: 'Switch to Cancelled Shipment',
      message: 'Are you sure you want to switch to Cancelled Shipment mode? This will allow you to cancel shipments.',
      onConfirm: () => {
        setActiveTab('cancelled');
        setShowConfirmation(false);
        setConfirmationConfig(null);
      }
    });
    setShowConfirmation(true);
  };

  const handleSwitchToNormalFromCancelled = () => {
    setActiveTab('normal');
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationConfig(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dispatch Scan</h1>
          <p className="text-gray-600">Scan tracker code for dispatch verification</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('normal')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'normal'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <QrCodeIcon className="w-5 h-5" />
                <span>Normal Scan</span>
              </div>
            </button>
            
            <button
              onClick={handleSwitchToPending}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'pending'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">⏸</span>
                <span>Pending Shipment</span>
              </div>
            </button>
            
            <button
              onClick={handleSwitchToCancelled}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'cancelled'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">❌</span>
                <span>Cancelled Shipment</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'normal' && (
          <>
            {/* Left-Right Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Scanning Interface */}
              <div className="space-y-6">
                {/* Scanning Interface */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TruckIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Dispatch Station</h2>
                    <p className="text-gray-600">Scan tracker for dispatch</p>
                  </div>

                  {/* Tracker Code Input */}
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
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-uppercase"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  {/* Multi-SKU Progress Indicator */}
                  {multiSkuProgress && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-800">Multi-SKU Order Progress</span>
                        <span className="text-xs text-purple-600">
                          {multiSkuProgress.scanned}/{multiSkuProgress.total} SKUs
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getProgressPercentage(multiSkuProgress.scanned, multiSkuProgress.total)}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-purple-700">
                        Tracking ID: <span className="font-mono">{multiSkuProgress.trackingId}</span>
                        <br />
                        Remaining: <span className="font-medium">{multiSkuProgress.remaining} SKU(s)</span>
                        {multiSkuProgress.selectedSkuGCode && (
                          <>
                            <br />
                            Selected SKU: <span className="font-mono">{multiSkuProgress.selectedSkuGCode}</span>
                            {multiSkuProgress.selectedSkuEanCode && (
                              <> (EAN: {multiSkuProgress.selectedSkuEanCode})</>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={resetForm}
                    className="w-full mt-3 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Reset
                  </button>

                  {/* Success/Error Messages */}
                  {success && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800 font-medium">
                          {selectedSkuName ? 
                            `Dispatch scan completed successfully! ${multiSkuProgress?.scanned || 1} SKU(s) scanned.` :
                            'Dispatch scan completed successfully!'
                          }
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
              </div>

              {/* Right Side - Platform Statistics */}
              <div className="space-y-6">
                {/* Platform Statistics */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Platform Statistics</h3>
                    <div className="text-sm text-gray-600">
                      {loadingStats ? 'Loading...' : `${platformStats.length} couriers`}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Courier
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Scanned
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pending
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Multi-SKU
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Single-SKU
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {platformStats.map((stat, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {stat.courier}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stat.total}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {stat.scanned}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {stat.pending}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="text-center">
                                <div className="text-green-600 font-medium">{stat.multi_sku_scanned || 0}</div>
                                <div className="text-red-600 text-xs">{stat.multi_sku_pending || 0}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="text-center">
                                <div className="text-green-600 font-medium">{stat.single_sku_scanned || 0}</div>
                                <div className="text-red-600 text-xs">{stat.single_sku_pending || 0}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${getProgressPercentage(stat.scanned, stat.total)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {getProgressPercentage(stat.scanned, stat.total)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Instructions */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8 mt-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Instructions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-700">
                <div className="space-y-2">
                  <p className="font-medium">1. Auto-Verify Previous Scans</p>
                  <p className="text-xs">System automatically checks label and packing scans are completed</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">2. Scan Tracker Code</p>
                  <p className="text-xs">Scan the tracker code - system will auto-verify all requirements</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">3. Auto-Complete Dispatch</p>
                  <p className="text-xs">System automatically completes dispatch scan when all checks pass</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">4. Fulfillment Complete</p>
                  <p className="text-xs">Order is now ready for final delivery (Single/Multi-SKU)</p>
                </div>
              </div>
            </div>

            {/* Recent Scanning Data - Full Width */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Scanning Data</h3>
                <div className="text-sm text-gray-600">
                  {loadingScans ? 'Loading...' : `Showing ${startIndex + 1}-${Math.min(endIndex, totalScans)} of ${totalScans} scans`}
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
                        Last Scan
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {loadingScans ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-4 text-center text-sm text-gray-500">
                          Loading recent scans...
                        </td>
                      </tr>
                    ) : recentScans.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-4 text-center text-sm text-gray-500">
                          No recent scans found
                        </td>
                      </tr>
                    ) : (
                      recentScans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {scan.tracking_id}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.platform}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScanColor(scan.last_scan)}`}>
                              {scan.last_scan}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scan.scan_status)}`}>
                              {scan.scan_status}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.distribution}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{scan.amount}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.buyer_city}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.courier}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scan.scan_time}
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
                    disabled={currentPage === 1 || loadingScans}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || loadingScans}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pending Shipment Tab */}
        {activeTab === 'pending' && (
          <PendingShipmentTab
            scanType="dispatch"
            onSwitchToPending={handleSwitchToPending}
            onSwitchToNormal={handleSwitchToNormal}
            isPendingMode={true}
          />
        )}

        {/* Cancelled Shipment Tab */}
        {activeTab === 'cancelled' && (
          <CancelledShipmentTab
            scanType="dispatch"
            onSwitchToCancelled={handleSwitchToCancelled}
            onSwitchToNormal={handleSwitchToNormalFromCancelled}
            isCancelledMode={true}
          />
        )}

        {/* Confirmation Modal */}
        {showConfirmation && confirmationConfig && (
          <ConfirmationModal
            isOpen={showConfirmation}
            title={confirmationConfig.title}
            message={confirmationConfig.message}
            onConfirm={confirmationConfig.onConfirm}
            onCancel={handleCancelConfirmation}
          />
        )}
      </div>
    </div>
  );
};

export default DispatchScan; 