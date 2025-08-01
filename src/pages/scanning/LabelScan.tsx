import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCodeIcon, CheckCircleIcon, ExclamationTriangleIcon, TruckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../../config/api';

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

const LabelScan: React.FC = () => {
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
  const [currentSkuIndex, setCurrentSkuIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
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
  const fetchPlatformStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`${API_ENDPOINTS.PLATFORM_STATS()}?scan_type=label`, {
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
  }, []);

  // Fetch recent scans
  const fetchRecentScans = useCallback(async () => {
    try {
      setLoadingScans(true);
      const url = `${API_ENDPOINTS.RECENT_LABEL_SCANS()}?page=${currentPage}&limit=${itemsPerPage}`;
      console.log('🔍 Fetching recent label scans from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Received data:', data);
        console.log('📋 Results count:', data.results?.length || 0);
        setRecentScans(data.results || []);
        setTotalScans(data.count || 0);
      } else {
        console.error('❌ Failed to fetch recent label scans:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
        setRecentScans([]);
        setTotalScans(0);
      }
    } catch (error) {
      console.error('❌ Error fetching recent scans:', error);
      setRecentScans([]);
      setTotalScans(0);
    } finally {
      setLoadingScans(false);
    }
  }, [currentPage, itemsPerPage]);

  const fetchScanCountData = async (trackerCode: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.TRACKER_COUNT(trackerCode));
      if (response.ok) {
        const data = await response.json();
        setScanCountData(data);
      }
    } catch (error) {
      console.error('Error fetching scan count data:', error);
    }
  };

  // ULTRA-FAST: Load data on component mount - NON-BLOCKING
  useEffect(() => {
    console.log('🚀 LabelScan component mounted');
    console.log('🔗 RECENT_LABEL_SCANS endpoint:', API_ENDPOINTS.RECENT_LABEL_SCANS());
    
    // ULTRA-FAST: Non-blocking data fetch to prevent UI delays
    setTimeout(() => {
      fetchPlatformStats();
      fetchRecentScans();
    }, 100); // Small delay to ensure UI is ready first
  }, []);

  // Refetch scans when page changes
  useEffect(() => {
    fetchRecentScans();
  }, [currentPage]);

  // ULTRA-FAST: Auto-clear timer - FLASH MESSAGES (0.3 seconds total)
  useEffect(() => {
    if (success || error) {
      // ULTRA-FAST: Show message for exactly 0.3 seconds then clear everything
      const flashTimer = setTimeout(() => {
        setTrackerCode('');
        setSuccess(false);
        setError('');
        setTrackerDetails(null);
        setShowDetails(false);
        
        // ULTRA-FAST: Single immediate focus after flash
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300); // Exactly 0.3 seconds flash duration
      
      return () => clearTimeout(flashTimer);
    }
  }, [success, error]);

  // ULTRA-FAST: Keep focus on input field - SIMPLIFIED for speed
  useEffect(() => {
    // Focus on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Simple click handler for focus
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // ULTRA-FAST: Focus when loading completes
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const handleScan = async () => {
    if (!trackerCode.trim()) {
      setError('Please enter tracker code');
      return;
    }

    const scannedCode = trackerCode.trim(); // Store the value immediately
    
    // ULTRA-FAST: Clear input and show flash INSTANTLY
    setTrackerCode(''); // Clear input INSTANTLY
    setLastScannedCode(''); // Clear last scanned code INSTANTLY
    setError(''); // Clear previous errors INSTANTLY
    setSuccess(false); // Clear previous success INSTANTLY
    setLoading(true);

    // ULTRA-FAST: Show success flash immediately for instant feedback
    setSuccess(true);

    try {
      const response = await fetch(API_ENDPOINTS.LABEL_SCAN(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracker_code: scannedCode, // Use the stored value
          scan_type: 'label'
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
            trackingId: scannedCode,
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
            setMultiSkuProgress(null);
            setSelectedSkuName('');
            setScanCountData(null);
            // Success flash is already shown - will be cleared by useEffect after 0.3 seconds
          } else {
            // More SKUs to scan - show progress with selected SKU name
            // Fetch updated scan count data
            fetchScanCountData(scannedCode);
            // Success flash is already shown - will be cleared by useEffect after 0.3 seconds
          }
        } else {
          // Single SKU order or old format - normal behavior
          // Success flash is already shown - will be cleared by useEffect after 0.3 seconds
        }
        
        // ULTRA-FAST: Immediate focus after success
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        // ULTRA-FAST: Show error flash immediately
        setSuccess(false);
        setError(data.detail || 'Label scan failed');
        // ULTRA-FAST: Immediate focus after error
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (error) {
      // ULTRA-FAST: Show error flash immediately
      setSuccess(false);
      setError('Network error. Please try again.');
      // ULTRA-FAST: Immediate focus after network error
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessScan = async () => {
    if (!trackerCode.trim()) {
      setError('Please enter tracker code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.LABEL_SCAN(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracker_code: trackerCode.trim(),
          scan_type: 'label'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTrackerCode('');
        setTrackerDetails(null);
        setShowDetails(false);
        
        // Refresh data after successful scan
        fetchPlatformStats();
        fetchRecentScans();
        
        // FLASH: Success will be cleared by useEffect after 0.3 seconds
      } else {
        setError(data.detail || 'Scan failed');
        // ROBUST: Multiple focus attempts after error
        const focusAfterProcessError = () => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        };
        focusAfterProcessError();
        setTimeout(focusAfterProcessError, 10);
        setTimeout(focusAfterProcessError, 50);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      // ROBUST: Multiple focus attempts after network error
      const focusAfterProcessNetworkError = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      focusAfterProcessNetworkError();
      setTimeout(focusAfterProcessNetworkError, 10);
      setTimeout(focusAfterProcessNetworkError, 50);
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
    
    // ULTRA-FAST: Auto-scan when barcode data is entered (typically ends with Enter or is a complete barcode)
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
      
      // ULTRA-FAST: Set the clean value and INSTANT scan
      setTrackerCode(cleanValue);
      setLastScannedCode(cleanValue);
      
      // ULTRA-FAST: Immediate scan without any delays
      handleScan();
    }
  };

  const resetForm = () => {
    setTrackerCode('');
    setTrackerDetails(null);
    setShowDetails(false);
    setError('');
    setSuccess(false);
    setMultiSkuProgress(null); // Clear Multi-SKU progress
    setCurrentSkuIndex(0); // Reset SKU index
    setSelectedSkuName(''); // Clear selected SKU name
    setScanCountData(null); // Clear scan count data
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
    return status === 'Success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getScanColor = (scan: string) => {
    switch (scan) {
      case 'Label': return 'text-blue-600 bg-blue-50';
      case 'Packing': return 'text-green-600 bg-green-50';
      case 'Dispatch': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = (scanned: number, total: number) => {
    return total > 0 ? Math.round((scanned / total) * 100) : 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Label Scan</h1>
          <p className="text-gray-600">Scan tracker code to begin the fulfillment journey</p>
        </div>

        {/* Top Section - Scanning and Statistics (1/2 layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Side - Scanning Interface */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCodeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Label Station</h2>
              <p className="text-gray-600">Scan tracker to start fulfillment</p>
            </div>

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
                 placeholder="SCAN OR ENTER TRACKER CODE (AUTO UPPERCASE)"
                 className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg font-bold text-center tracking-wider bg-white shadow-sm hover:border-blue-400"
                 disabled={loading}
                 autoFocus
                 autoComplete="off"
                 spellCheck="false"
                 style={{ 
                   fontSize: '18px',
                   letterSpacing: '2px',
                   textTransform: 'uppercase'
                 }}
               />
            </div>

            {/* Multi-SKU Progress Indicator */}
            {multiSkuProgress && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Multi-SKU Order Progress</span>
                  <span className="text-xs text-blue-600">
                    {multiSkuProgress.scanned}/{multiSkuProgress.total} SKUs
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getProgressPercentage(multiSkuProgress.scanned, multiSkuProgress.total)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-blue-700">
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

            {/* Scan Count and Progress Display */}
            {scanCountData && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-green-800">Scan Count & Progress</span>
                  <span className="text-xs text-green-600">
                    Tracking ID: {scanCountData.tracker_code}
                  </span>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-green-700 mb-1">
                      <span>Label Scan</span>
                      <span>{scanCountData.label_scanned}/{scanCountData.total_sku_count}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                                             <div 
                         className="bg-green-600 h-2 rounded-full" 
                         style={{ width: `${getProgressPercentage(scanCountData.label_scanned, scanCountData.total_sku_count)}%` }}
                       ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-green-700 mb-1">
                      <span>Packing Scan</span>
                      <span>{scanCountData.packing_scanned}/{scanCountData.total_sku_count}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                                             <div 
                         className="bg-green-600 h-2 rounded-full" 
                         style={{ width: `${getProgressPercentage(scanCountData.packing_scanned, scanCountData.total_sku_count)}%` }}
                       ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-green-700 mb-1">
                      <span>Dispatch Scan</span>
                      <span>{scanCountData.dispatch_scanned}/{scanCountData.total_sku_count}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                                             <div 
                         className="bg-green-600 h-2 rounded-full" 
                         style={{ width: `${getProgressPercentage(scanCountData.dispatch_scanned, scanCountData.total_sku_count)}%` }}
                       ></div>
                    </div>
                  </div>
                </div>
                
                {/* SKU Details */}
                <div className="mt-3">
                  <span className="text-xs font-medium text-green-700">SKU Details (by Channel ID):</span>
                  <div className="mt-1 space-y-1">
                    {scanCountData.sku_details.map((sku: any, index: number) => (
                      <div key={index} className="text-xs text-green-600 flex items-center space-x-2">
                        <span className="font-mono">{sku.channel_id || sku.order_id}</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          sku.is_scanned_label ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          L
                        </span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          sku.is_scanned_packing ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          P
                        </span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          sku.is_scanned_dispatch ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          D
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showDetails && trackerDetails && (
              <button
                onClick={handleProcessScan}
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <TruckIcon className="h-5 w-5" />
                Ready for Label
              </button>
            )}

                         <button
               onClick={resetForm}
               className="w-full mt-3 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
                      `Label scan completed successfully! ${multiSkuProgress?.scanned || 1} SKU(s) scanned.` :
                      'Label scan completed successfully!'
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

          {/* Right Side - Platform Statistics Table */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Platform Statistics</h3>
              {loadingStats && (
                <div className="text-sm text-gray-500">Loading...</div>
              )}
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

        {/* Full Width Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-700">
            <div className="space-y-2">
              <p className="font-medium">1. Scan Tracker Code</p>
              <p className="text-xs">Scan or enter the tracker code - system will auto-verify</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Auto-Verify Order</p>
              <p className="text-xs">System automatically verifies order details and product information</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">3. Complete Label Scan</p>
              <p className="text-xs">System marks label scan as complete automatically</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">4. Ready for Packing</p>
              <p className="text-xs">Order is now ready for packing scan (Single/Multi-SKU)</p>
            </div>
          </div>
        </div>

        {/* Last Scanning Data - Full Width */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
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
      </div>
    </div>
  );
};

export default LabelScan; 