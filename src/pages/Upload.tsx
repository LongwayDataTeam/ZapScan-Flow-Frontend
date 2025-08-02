import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon, TableCellsIcon, TrashIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import TrackingStats from '../components/TrackingStats';
import TrackingStatistics from '../components/TrackingStatistics';
import TrackerTable from '../components/TrackerTable';
import API_ENDPOINTS from '../config/api';

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
    const [uploadProgress, setUploadProgress] = useState(0);
  const [processingData, setProcessingData] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
     const [uploadMode, setUploadMode] = useState<'simple' | 'detailed'>('detailed');
    const [duplicateHandling, setDuplicateHandling] = useState<'allow' | 'skip' | 'update'>('allow');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCompleteClearConfirm, setShowCompleteClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [completeClearLoading, setCompleteClearLoading] = useState(false);
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchUploadedTrackers();
    fetchTrackingStats();
  }, []);

  const fetchUploadedTrackers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.UPLOADED_TRACKERS());
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
      const response = await fetch(API_ENDPOINTS.TRACKING_STATS());
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
      const response = await fetch(API_ENDPOINTS.CLEAR_DATA(), {
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

  const handleCompleteClearData = async () => {
    setCompleteClearLoading(true);
    try {
      // Clear ALL data from local backend (including pending shipments)
      const response = await fetch(API_ENDPOINTS.CLEAR_ALL_DATA(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Complete data cleared:', data);
        
        // Refresh data after clearing
        await fetchUploadedTrackers();
        await fetchTrackingStats();
        
        // Hide confirmation dialog
        setShowCompleteClearConfirm(false);
        
        // Show success message
        alert('ALL data cleared completely (including pending shipments)!');
      } else {
        const errorData = await response.json();
        alert(`Failed to clear all data: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      alert('Failed to clear all data. Please try again.');
    } finally {
      setCompleteClearLoading(false);
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
              const localResponse = await fetch(`${API_ENDPOINTS.UPLOAD_TRACKERS()}?duplicate_handling=${duplicateHandling}`, {
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
        setTableRefreshTrigger(prev => prev + 1);
        
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
    setProcessingData(true);
    setUploadProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    setError('');

    try {
      // Parse CSV-like data with progress indication
      const lines = trackerCodes.trim().split('\n');
      
      // Detect separator (comma or tab)
      const firstLine = lines[0];
      const hasCommas = firstLine.includes(',');
      const hasTabs = firstLine.includes('\t');
      
      let separator = '\t'; // default to tab
      if (hasCommas && !hasTabs) {
        separator = ',';
      } else if (hasTabs) {
        separator = '\t';
      }
      
      const headers = lines[0].split(separator);
      
      const trackers: TrackerData[] = [];
      
      // ULTRA-OPTIMIZED: Process data in very small chunks for instant feedback
      const chunkSize = 50; // Reduced from 100 for faster processing
      const totalLines = lines.length - 1;
      
      console.log(`🚀 Starting ultra-optimized upload processing for ${totalLines} lines`);
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator);
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
        
        // ULTRA-OPTIMIZED: Update progress more frequently for instant feedback
        if (i % chunkSize === 0) {
          const progress = Math.min(50, Math.round((i / totalLines) * 50));
          setUploadProgress(progress);
          console.log(`📊 Processing progress: ${progress}% (${i}/${totalLines} lines)`);
          // Use immediate promise resolution for fastest UI updates
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      if (trackers.length === 0) {
        setError('No valid tracker data found. Please check the format.');
        setLoading(false);
        setProcessingData(false);
        return;
      }

      console.log(`✅ Processing complete. ${trackers.length} valid trackers found`);

      // Switch to upload phase
      setProcessingData(false);
      setUploadProgress(50);

      // ULTRA-OPTIMIZED: Upload in much smaller chunks for faster processing
      const uploadChunkSize = 100; // Reduced from 500 for faster uploads
      const totalChunks = Math.ceil(trackers.length / uploadChunkSize);
      setTotalChunks(totalChunks);
      let uploadedCount = 0;

      console.log(`📤 Starting ultra-optimized chunked upload: ${totalChunks} chunks of ${uploadChunkSize} trackers each`);

      // ULTRA-OPTIMIZED: Process chunks with minimal delays
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIndex = chunkIndex * uploadChunkSize;
        const endIndex = Math.min(startIndex + uploadChunkSize, trackers.length);
        const chunk = trackers.slice(startIndex, endIndex);

        setCurrentChunk(chunkIndex + 1);
        console.log(`📦 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} trackers)`);

        // Upload chunk to local backend with shorter timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout per chunk

        try {
          const localResponse = await fetch(`${API_ENDPOINTS.UPLOAD_DETAILED_TRACKERS()}?duplicate_handling=${duplicateHandling}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trackers: chunk
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const localData = await localResponse.json();

          if (localResponse.ok) {
            uploadedCount += chunk.length;
            const uploadProgress = 50 + Math.round((uploadedCount / trackers.length) * 50);
            setUploadProgress(uploadProgress);
            console.log(`✅ Chunk ${chunkIndex + 1} uploaded successfully. Progress: ${uploadProgress}%`);
          } else {
            throw new Error(localData.detail || 'Upload failed');
          }
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            throw new Error(`Upload timed out at chunk ${chunkIndex + 1}. Please try with a smaller file.`);
          } else {
            throw fetchError;
          }
        }

        // ULTRA-OPTIMIZED: Minimal delay between chunks
        if (chunkIndex < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 100ms
        }
      }

      setUploadProgress(100);
      console.log(`🎉 Upload complete! ${uploadedCount} trackers uploaded successfully`);

      setUploadSuccess(true);
      setTrackerCodes('');
      
      // Refresh data in background
      Promise.all([
        fetchUploadedTrackers(),
        fetchTrackingStats()
      ]).then(() => {
        setTableRefreshTrigger(prev => prev + 1);
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setProcessingData(false);
      setUploadProgress(0);
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
      // Check file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size too large. Please use a file smaller than 50MB.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTrackerCodes(content);
        setError(''); // Clear any previous errors
      };
      reader.onerror = () => {
        setError('Error reading file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <div className="w-full px-4 py-8">
        <div className="w-full">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Trackers</h1>
              <p className="text-gray-600">Upload tracker codes to start the fulfillment process</p>
            </div>
            
            {/* Clear Data Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Clear & Move to Database
              </button>
              <button
                onClick={() => setShowCompleteClearConfirm(true)}
                className="flex items-center px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
                title="Clear ALL data including pending shipments"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Complete Clear
              </button>
            </div>
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

        {/* Complete Clear Data Confirmation Modal */}
        {showCompleteClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-800 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Complete Data Clear</h3>
              </div>
              <p className="text-gray-600 mb-6">
                <strong className="text-red-800">⚠️ WARNING:</strong> This will clear ALL data including pending shipments. 
                This action cannot be undone and will remove everything from the system. Are you absolutely sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCompleteClearData}
                  disabled={completeClearLoading}
                  className="flex-1 bg-red-800 text-white py-2 px-4 rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {completeClearLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Clearing ALL Data...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Clear Everything
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCompleteClearConfirm(false)}
                  disabled={completeClearLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           {/* Upload Form */}
           <div className="xl:col-span-1">
             <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 h-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudArrowUpIcon className="w-8 h-8 text-blue-600" />
                </div>
                                 <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Tracker Codes</h2>
                 <p className="text-gray-600">Upload detailed tracker data files</p>
              </div>

                             

                             {/* File Upload */}
               <div className="mb-4">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Upload File (CSV/Tab-separated)
                 </label>
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                   <input
                     type="file"
                     accept=".txt,.csv"
                     onChange={handleFileUpload}
                     className="hidden"
                     id="file-upload"
                   />
                   <label htmlFor="file-upload" className="cursor-pointer">
                     <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                     <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                     <p className="text-xs text-gray-500 mt-1">
                       CSV, Tab-separated files with headers supported
                     </p>
                   </label>
                 </div>
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
                     {processingData ? 'Processing Data...' : 'Uploading...'}
                   </>
                 ) : (
                   <>
                     <CloudArrowUpIcon className="h-5 w-5 mr-3" />
                     {trackerCodes.trim() ? 'Upload Trackers' : 'Select File to Upload'}
                   </>
                 )}
               </button>

                               {/* Progress Bar */}
                {loading && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>
                        {processingData ? 'Processing data...' : 'Uploading to server...'}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <span className="ml-2 text-blue-600 font-medium">
                            {uploadProgress}% complete
                          </span>
                        )}
                      </span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {processingData ? 'Parsing and validating data...' : 
                         totalChunks > 0 ? `Uploading chunk ${currentChunk} of ${totalChunks}...` : 'Sending data to server...'}
                      </div>
                    )}
                  </div>
                )}

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

             
           </div>

           {/* Upload Page Statistics */}
           <div className="xl:col-span-1">
             <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 h-full">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Statistics</h3>
               <p className="text-sm text-gray-600 mb-6">Scanned counts till now</p>
               
               <div className="grid grid-cols-2 gap-4">
                 {/* Label Scanned */}
                 <div className="bg-green-50 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-green-600">Label Scanned</p>
                       <p className="text-2xl font-bold text-green-900">{trackingStats?.label_scanned || 0}</p>
                       <p className="text-xs text-green-600">Scanned till now</p>
                     </div>
                     <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                       <span className="text-green-600 text-sm font-bold">L</span>
                     </div>
                   </div>
                 </div>

                 {/* Packing Scanned */}
                 <div className="bg-orange-50 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-orange-600">Packing Scanned</p>
                       <p className="text-2xl font-bold text-orange-900">{trackingStats?.packing_scanned || 0}</p>
                       <p className="text-xs text-orange-600">Scanned till now</p>
                     </div>
                     <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                       <span className="text-orange-600 text-sm font-bold">P</span>
                     </div>
                   </div>
                 </div>

                 {/* Dispatch Scanned */}
                 <div className="bg-purple-50 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-purple-600">Dispatch Scanned</p>
                       <p className="text-2xl font-bold text-purple-900">{trackingStats?.dispatch_scanned || 0}</p>
                       <p className="text-xs text-purple-600">Scanned till now</p>
                     </div>
                     <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                       <span className="text-purple-600 text-sm font-bold">D</span>
                     </div>
                   </div>
                 </div>

                 {/* Total Upload */}
                 <div className="bg-blue-50 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-blue-600">Total Upload</p>
                       <p className="text-2xl font-bold text-blue-900">{trackingStats?.total_uploaded || 0}</p>
                       <p className="text-xs text-blue-600">Total items</p>
                     </div>
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                       <span className="text-blue-600 text-sm font-bold">T</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Progress Summary */}
               {trackingStats && (
                 <div className="mt-6 pt-4 border-t border-gray-200">
                   <h4 className="text-sm font-medium text-gray-700 mb-3">Progress Summary</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-600">Label Progress:</span>
                       <span className="font-medium text-green-600">
                         {trackingStats.total_uploaded > 0 ? Math.round((trackingStats.label_scanned / trackingStats.total_uploaded) * 100) : 0}%
                       </span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-600">Packing Progress:</span>
                       <span className="font-medium text-orange-600">
                         {trackingStats.total_uploaded > 0 ? Math.round((trackingStats.packing_scanned / trackingStats.total_uploaded) * 100) : 0}%
                       </span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-600">Dispatch Progress:</span>
                       <span className="font-medium text-purple-600">
                         {trackingStats.total_uploaded > 0 ? Math.round((trackingStats.dispatch_scanned / trackingStats.total_uploaded) * 100) : 0}%
                       </span>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>

         {/* Full Tracking Statistics */}
         <div className="mt-6">
           <TrackingStatistics refreshTrigger={tableRefreshTrigger} />
         </div>
        </div>

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

        {/* Tabular Data Section */}
        <div className="mt-8">
          <TrackerTable refreshTrigger={tableRefreshTrigger} />
        </div>
      </div>
    </>
  );
};

export default Upload; 