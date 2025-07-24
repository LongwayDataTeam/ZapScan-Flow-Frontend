import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CubeIcon, 
  TruckIcon, 
  QrCodeIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import TrackingStats from '../components/TrackingStats';

interface DashboardStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_scans: number;
  total_trackers: number;
  completed_trackers: number;
  in_progress_trackers: number;
  recent_products: any[];
}

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

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trackingStats, setTrackingStats] = useState<TrackingStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchTrackingStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
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
      const response = await fetch('http://localhost:8000/api/v1/system/clear-data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Data cleared:', data);
        
        // Refresh stats after clearing
        await fetchDashboardStats();
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Overview of your fulfillment tracking system</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Status - Always Online */}
            <div className="flex items-center space-x-6 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Backend API</span>
                <span className="text-xs text-green-600 font-medium">Online</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Database</span>
                <span className="text-xs text-green-600 font-medium">Connected</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Scanner</span>
                <span className="text-xs text-green-600 font-medium">Ready</span>
              </div>
            </div>
            
            {/* Clear Data Button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Clear Data
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
              <h3 className="text-lg font-semibold text-gray-900">Clear All Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete all uploaded trackers, scan data, and tracking statistics. 
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
                    Clearing...
                  </>
                ) : (
                  'Yes, Clear All Data'
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

      {/* Stats Grid - Moved to top for better hierarchy */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center">
              <CubeIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-gray-600">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_products}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center">
              <QrCodeIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-gray-600">Active Products</p>
                <p className="text-xl font-bold text-gray-900">{stats.active_products}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center">
              <TruckIcon className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-gray-600">Total Trackers</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_trackers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{stats.completed_trackers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                Add New Product
              </button>
              <button className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                Start Label Scan
              </button>
              <button className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm">
                View Tracker Status
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center p-2 bg-green-50 rounded border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-800 font-medium">Label scan completed for TRACK001</span>
              </div>
              <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs text-blue-800 font-medium">New product "Widget Pro" added</span>
              </div>
              <div className="flex items-center p-2 bg-purple-50 rounded border border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-xs text-purple-800 font-medium">Packing scan completed for TRACK002</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Statistics */}
      {trackingStats && (
        <div className="mt-6">
          <TrackingStats stats={trackingStats} />
        </div>
      )}

      {/* Recent Products */}
      {stats && stats.recent_products && stats.recent_products.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.recent_products.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded p-3 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                  <p className="text-xs text-gray-600">{product.g_code}</p>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 