import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WorkflowStatus {
  total_orders: number;
  total_scans: number;
  scan_progress: {
    label: { count: number; percentage: number };
    packing: { count: number; percentage: number };
    dispatch: { count: number; percentage: number };
  };
  data_size_mb: number;
  can_clear: boolean;
}

const SheetsWorkflowManager: React.FC = () => {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [sheetsInfo, setSheetsInfo] = useState<any>(null);

  const API_BASE = 'http://localhost:8000/api/v1/sheets-workflow';

  useEffect(() => {
    fetchStatus();
    fetchSheetsInfo();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchSheetsInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sheets-info`);
      setSheetsInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch sheets info:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('❌ File size exceeds 10MB limit');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(`✅ ${response.data.message}`);
      fetchStatus();
    } catch (error: any) {
      setMessage(`❌ Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/process`);
      setMessage(`✅ ${response.data.message}`);
      fetchStatus();
    } catch (error: any) {
      setMessage(`❌ Processing failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = async () => {
    if (!status?.can_clear) {
      setMessage('❌ No data to clear');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ This will move all data from Scan Processor to Database tab and clear the processor. Continue?'
    );

    if (!confirmed) return;

    setClearing(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/clear`);
      setMessage(`✅ ${response.data.message}`);
      fetchStatus();
    } catch (error: any) {
      setMessage(`❌ Clear failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleUploadAndProcess = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage('❌ File size exceeds 10MB limit');
      return;
    }

    setUploading(true);
    setProcessing(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/upload-and-process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(`✅ ${response.data.message}`);
      fetchStatus();
    } catch (error: any) {
      setMessage(`❌ Upload and process failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        📊 Scan Processor & Database Workflow Manager
      </h1>

      {/* Google Sheets Status */}
      {sheetsInfo && (
        <div className={`p-4 rounded-lg mb-6 ${
          sheetsInfo.configured 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">🔗 Google Sheets Connection</h3>
          <p>{sheetsInfo.message}</p>
          {sheetsInfo.configured && (
            <div className="text-sm mt-2 space-y-1">
              <p><strong>Spreadsheet ID:</strong> {sheetsInfo.spreadsheet_id}</p>
              <p><strong>Processor Tab:</strong> {sheetsInfo.processor_tab}</p>
              <p><strong>Database Tab:</strong> {sheetsInfo.database_tab}</p>
            </div>
          )}
        </div>
      )}

      {/* Status Display */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">📦 Orders</h3>
            <p className="text-2xl font-bold text-blue-600">{status.total_orders}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">📱 Scans</h3>
            <p className="text-2xl font-bold text-green-600">{status.total_scans}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">💾 Size</h3>
            <p className="text-2xl font-bold text-purple-600">
              {status.data_size_mb.toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {/* Scan Progress */}
      {status && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📈 Scan Progress</h3>
          <div className="space-y-3">
            {Object.entries(status.scan_progress).map(([type, data]) => (
              <div key={type} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium capitalize">{type}</span>
                  <span className="text-sm text-gray-600">
                    {data.count} / {status.total_orders} ({data.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Upload */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            <div className="text-4xl mb-2">📤</div>
            <h3 className="font-semibold text-gray-700 mb-2">
              {uploading ? 'Uploading...' : 'Upload Data'}
            </h3>
            <p className="text-sm text-gray-500">
              Max 10MB • CSV, Excel, TXT
            </p>
          </label>
        </div>

        {/* Upload & Process */}
        <div className="bg-white border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleUploadAndProcess}
            className="hidden"
            id="file-upload-process"
            disabled={uploading || processing}
          />
          <label
            htmlFor="file-upload-process"
            className="cursor-pointer block"
          >
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-700 mb-2">
              {uploading || processing ? 'Processing...' : 'Upload & Process'}
            </h3>
            <p className="text-sm text-gray-500">
              Upload and process in one step
            </p>
          </label>
        </div>

        {/* Process */}
        <button
          onClick={handleProcess}
          disabled={processing || !status?.total_orders}
          className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <div className="text-4xl mb-2">⚙️</div>
          <h3 className="font-semibold mb-2">
            {processing ? 'Processing...' : 'Process Workflow'}
          </h3>
          <p className="text-sm opacity-90">
            Run all scanning operations
          </p>
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          disabled={clearing || !status?.can_clear}
          className="bg-red-500 text-white p-6 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <div className="text-4xl mb-2">🧹</div>
          <h3 className="font-semibold mb-2">
            {clearing ? 'Clearing...' : 'Clear & Store'}
          </h3>
          <p className="text-sm opacity-90">
            Move to Database tab
          </p>
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : message.includes('❌')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Workflow Steps */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">🔄 Scan Processor & Database Workflow Steps</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <span className="text-gray-700">Upload data file → Store in "Scan Processor" tab</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-gray-700">Process all scanning workflows in "Scan Processor"</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <span className="text-gray-700">Clear button → Move data to "Database" tab</span>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">✨ Benefits of Dual Tab Workflow</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Scan Processor tab:</strong> Active workflow processing</li>
          <li>• <strong>Database tab:</strong> Permanent data storage</li>
          <li>• <strong>Automatic data flow:</strong> Processor → Database</li>
          <li>• <strong>Clean separation:</strong> Processing vs Storage</li>
          <li>• <strong>No data loss:</strong> All processed data preserved</li>
        </ul>
      </div>
    </div>
  );
};

export default SheetsWorkflowManager; 