import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon, TableCellsIcon, TrashIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import TrackingStats from '../components/TrackingStats';

interface TrackingStatsData {
  total_uploaded: number;
  label_scanned: number;
  packing_scanned: number;
  dispatch_scanned: number;
  completed: number;
  label_percentage: number;
  packing_percentage: number;
  dispatch_percentage: number;
  completion_percentage: number;
}

interface TrackerData {
  channel_id?: string;
  order_id?: string;
  sub_order_id?: string;
  shipment_tracker: string;
  courier?: string;
  channel_name?: string;
  g_code?: string;
  ean_code?: string;
  product_sku_code?: string;
  channel_listing_id?: string;
  qty?: number;
  amount?: number;
  payment_mode?: string;
  order_status?: string;
  buyer_city?: string;
  buyer_state?: string;
  buyer_pincode?: string;
  invoice_number?: string;
}



const Upload: React.FC = () => {
  const [trackerCodes, setTrackerCodes] = useState('');
  const [uploadedTrackers, setUploadedTrackers] = useState<string[]>([]);
  const [trackingStats, setTrackingStats] = useState<TrackingStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState<'simple' | 'detailed'>('simple');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    fetchUploadedTrackers();
    fetchTrackingStats();
  }, []);

  const fetchUploadedTrackers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/trackers/uploaded/');
      if (response.ok) {
        const data = await response.json();
        setUploadedTrackers(data.uploaded_trackers || []);
      }
    } catch (error) {
      console.error('Error fetching uploaded trackers:', error);
    }
  };

  const fetchTrackingStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/tracking/stats');
      if (response.ok) {
        const data = await response.json();
        setTrackingStats(data);
      }
    } catch (error) {
      console.error('Error fetching tracking stats:', error);
    }
  };



  const handleClearData = async () => {
    setClearLoading(true);
    try {
      // Clear all data from local backend
      const response = await fetch('http://localhost:8000/api/v1/system/clear-data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Data cleared:', data);
        
        // Refresh data after clearing
        await fetchUploadedTrackers();
        await fetchTrackingStats();
        
        // Hide confirmation dialog
        setShowClearConfirm(false);
        
        // Show success message
        alert('All tracking data cleared successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to clear data: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setClearLoading(false);
    }
  };

  const handleSimpleUpload = async () => {
    if (!trackerCodes.trim()) {
      setError('Please enter tracker codes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse tracker codes (comma-separated or newline-separated)
      const codes = trackerCodes
        .split(/[,\n]/)
        .map(code => code.trim())
        .filter(code => code.length > 0);

      if (codes.length === 0) {
        setError('Please enter valid tracker codes');
        setLoading(false);
        return;
      }

      // Upload to local backend
      const localResponse = await fetch('http://localhost:8000/api/v1/trackers/upload/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracker_codes: codes
        }),
      });

      const localData = await localResponse.json();

      if (localResponse.ok) {
        setUploadSuccess(true);
        setTrackerCodes('');
        fetchUploadedTrackers();
        fetchTrackingStats();
        
        // Reset success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setError(localData.detail || 'Upload failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedUpload = async () => {
    if (!trackerCodes.trim()) {
      setError('Please enter detailed tracker data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse CSV-like data
      const lines = trackerCodes.trim().split('\n');
      const headers = lines[0].split('\t'); // Tab-separated
      
      const trackers: TrackerData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        if (values.length >= headers.length) {
          const tracker: TrackerData = {
            shipment_tracker: values[3] || '', // Shipment Tracker column
            channel_id: values[0] || '',
            order_id: values[1] || '',
            sub_order_id: values[2] || '',
            courier: values[4] || '',
            channel_name: values[5] || '',
            g_code: values[6] || '',
            ean_code: values[7] || '',
            product_sku_code: values[8] || '',
            channel_listing_id: values[9] || '',
            qty: parseInt(values[10]) || 1,
            amount: parseFloat(values[11]) || 0,
            payment_mode: values[12] || '',
            order_status: values[13] || '',
            buyer_city: values[14] || '',
            buyer_state: values[15] || '',
            buyer_pincode: values[16] || '',
            invoice_number: values[17] || ''
          };
          
          if (tracker.shipment_tracker) {
            trackers.push(tracker);
          }
        }
      }

      if (trackers.length === 0) {
        setError('No valid tracker data found. Please check the format.');
        setLoading(false);
        return;
      }

      // Upload to local backend
      const localResponse = await fetch('http://localhost:8000/api/v1/trackers/upload-detailed/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackers: trackers
        }),
      });

      const localData = await localResponse.json();

      if (localResponse.ok) {
        setUploadSuccess(true);
        setTrackerCodes('');
        fetchUploadedTrackers();
        fetchTrackingStats();
        
        // Reset success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setError(localData.detail || 'Upload failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (uploadMode === 'simple') {
      handleSimpleUpload();
    } else {
      handleDetailedUpload();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTrackerCodes(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Trackers</h1>
              <p className="text-gray-600">Upload tracker codes to start the fulfillment process</p>
            </div>
            
            {/* Clear Data Button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Clear & Move to Database
            </button>
          </div>
        </div>



        {/* Clear Data Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Clear & Move Data</h3>
              </div>
              <p className="text-gray-600 mb-6">
                This will move all data from Scan Processor to Database tab and clear the processor. 
                This action cannot be undone. Are you sure you want to continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearData}
                  disabled={clearLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {clearLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Moving Data...
                    </>
                  ) : (
                    <>
                      <ArrowRightIcon className="h-4 w-4 mr-2" />
                      Move to Database
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudArrowUpIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Tracker Codes</h2>
                <p className="text-gray-600">Enter tracker codes manually or upload a file</p>
              </div>

              {/* Upload Mode Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUploadMode('simple')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uploadMode === 'simple'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Simple Codes
                  </button>
                  <button
                    onClick={() => setUploadMode('detailed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uploadMode === 'detailed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Detailed Data
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload File ({uploadMode === 'simple' ? 'CSV/TXT' : 'Tab-separated'})
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept={uploadMode === 'simple' ? '.csv,.txt' : '.txt,.csv'}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadMode === 'simple' 
                        ? 'CSV, TXT files supported' 
                        : 'Tab-separated files with headers supported'
                      }
                    </p>
                  </label>
                </div>
              </div>

              {/* Manual Input */}
              <div className="mb-6">
                <label htmlFor="trackerCodes" className="block text-sm font-semibold text-gray-700 mb-2">
                  {uploadMode === 'simple' ? 'Tracker Codes' : 'Detailed Tracker Data'}
                </label>
                <textarea
                  id="trackerCodes"
                  value={trackerCodes}
                  onChange={(e) => setTrackerCodes(e.target.value)}
                  placeholder={
                    uploadMode === 'simple' 
                      ? "Enter tracker codes (one per line or comma-separated)\nExample:\nTRACK001\nTRACK002\nTRACK003"
                      : "Paste your tab-separated data with headers\nChannel ID\tOrder ID\tSub Order ID\tShipment Tracker\tCourier\tChannel Name\tG-Code\tEAN-Code\tProduct Sku Code\tChannel Listing ID\tQty\tAmount\tPayment Mode\tOrder Status\tBuyer City\tBuyer State\tBuyer Pincode\tInvoice Number"
                  }
                  className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadMode === 'simple' 
                    ? 'Enter one tracker code per line or separate with commas'
                    : 'Paste your tab-separated data with headers (copy from Excel)'
                  }
                </p>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={loading || !trackerCodes.trim()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5 mr-3" />
                    Upload Trackers
                  </>
                )}
              </button>

              {/* Success/Error Messages */}
              {uploadSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-800 font-medium">
                      Trackers uploaded successfully to Scan Processor tab!
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}
            </div>

            {/* Uploaded Trackers List */}
            {uploadedTrackers.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6 border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Uploaded Trackers</h3>
                <div className="max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {uploadedTrackers.map((tracker, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs font-medium text-gray-700">
                        {tracker}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total: {uploadedTrackers.length} trackers
                </p>
              </div>
            )}
          </div>

          {/* Tracking Statistics */}
          <div className="lg:col-span-1">
            {trackingStats ? (
              <TrackingStats stats={trackingStats} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}



            {/* Sample Data Format */}
            {uploadMode === 'detailed' && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6 border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <TableCellsIcon className="h-5 w-5 mr-2" />
                  Sample Data Format
                </h3>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
                  <p className="font-medium mb-2">Copy your data from Excel and paste here:</p>
                  <div className="font-mono text-xs">
                    Channel ID	Order ID	Sub Order ID	Shipment Tracker	Courier	Channel Name	G-Code	EAN-Code	Product Sku Code	Channel Listing ID	Qty	Amount	Payment Mode	Order Status	Buyer City	Buyer State	Buyer Pincode	Invoice Number<br/>
                    35180	403-9522880-1202765	Uw859PYkf	13371696879100	Amazon DF	VC Amazon DF	DSQW-78688493	8904473902385	JN-Thunder-Pro-Blue-4J-P1	B0DT9Y9Q46	1	1198.88	PREPAID	Shipped	SAPATGRAM	Assam	783337	INS229975
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload; 