import React, { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  TruckIcon, 
  QrCodeIcon,
  CheckCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import TrackingStats from '../components/TrackingStats';
import API_ENDPOINTS from '../config/api';

interface DashboardStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_scans: number;
  total_trackers: number;
  completed_trackers: number;
  in_progress_trackers: number;
  pending_trackers: number;
  recent_products: any[];
}

interface TrackingStatsData {
  total_uploaded: number;
  label_scanned: number;
  packing_scanned: number;
  dispatch_scanned: number;
  completed: number;
  pending: number;
  label_percentage: number;
  packing_percentage: number;
  dispatch_percentage: number;
  completion_percentage: number;
  pending_percentage: number;
}

interface RecentActivity {
  id: string;
  tracking_id: string;
  platform: string;
  last_scan: string;
  scan_status: string;
  distribution: string;
  scan_time: string;
  amount: number;
  buyer_city: string;
  courier: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trackingStats, setTrackingStats] = useState<TrackingStatsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchTrackingStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DASHBOARD_STATS());
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
      const response = await fetch(API_ENDPOINTS.TRACKING_STATS());
      if (response.ok) {
        const data = await response.json();
        
        // Validate and provide fallback values to prevent NaN
        const validatedData: TrackingStatsData = {
          total_uploaded: data.total_uploaded || 0,
          label_scanned: data.label_scanned || 0,
          packing_scanned: data.packing_scanned || 0,
          dispatch_scanned: data.dispatch_scanned || 0,
          completed: data.completed || 0,
          pending: data.pending || 0,
          label_percentage: data.label_percentage || 0,
          packing_percentage: data.packing_percentage || 0,
          dispatch_percentage: data.dispatch_percentage || 0,
          completion_percentage: data.completion_percentage || 0,
          pending_percentage: data.pending_percentage || 0
        };
        
        setTrackingStats(validatedData);
      }
    } catch (error) {
      console.error('Error fetching tracking stats:', error);
      // Set default values on error
      setTrackingStats({
        total_uploaded: 0,
        label_scanned: 0,
        packing_scanned: 0,
        dispatch_scanned: 0,
        completed: 0,
        pending: 0,
        label_percentage: 0,
        packing_percentage: 0,
        dispatch_percentage: 0,
        completion_percentage: 0,
        pending_percentage: 0
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent scans from all types using the new generic endpoint
      const labelUrl = `${API_ENDPOINTS.RECENT_SCANS()}?scan_type=label&page=1&limit=5`;
      const packingUrl = `${API_ENDPOINTS.RECENT_SCANS()}?scan_type=packing&page=1&limit=5`;
      const dispatchUrl = `${API_ENDPOINTS.RECENT_SCANS()}?scan_type=dispatch&page=1&limit=5`;
      
      const [labelResponse, packingResponse, dispatchResponse] = await Promise.all([
        fetch(labelUrl),
        fetch(packingUrl),
        fetch(dispatchUrl)
      ]);

      const allActivities: RecentActivity[] = [];

      if (labelResponse.ok) {
        const labelData = await labelResponse.json();
        if (labelData.results && Array.isArray(labelData.results)) {
          allActivities.push(...labelData.results);
        }
      } else {
        console.error('Label response not ok:', labelResponse.status);
        const errorText = await labelResponse.text();
        console.error('Label error:', errorText);
      }

      if (packingResponse.ok) {
        const packingData = await packingResponse.json();
        if (packingData.results && Array.isArray(packingData.results)) {
          allActivities.push(...packingData.results);
        }
      } else {
        console.error('Packing response not ok:', packingResponse.status);
        const errorText = await packingResponse.text();
        console.error('Packing error:', errorText);
      }

      if (dispatchResponse.ok) {
        const dispatchData = await dispatchResponse.json();
        if (dispatchData.results && Array.isArray(dispatchData.results)) {
          allActivities.push(...dispatchData.results);
        }
      } else {
        console.error('Dispatch response not ok:', dispatchResponse.status);
        const errorText = await dispatchResponse.text();
        console.error('Dispatch error:', errorText);
      }

      // Sort by scan time (most recent first) and take top 6
      allActivities.sort((a, b) => {
        try {
          return new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime();
        } catch {
          return 0; // If date parsing fails, keep original order
        }
      });
      
      setRecentActivity(allActivities.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]); // Set empty array on error
    }
  };

  const handleClearData = async () => {
    setClearLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.CLEAR_DATA(), {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh data after clearing
        await Promise.all([
          fetchDashboardStats(),
          fetchTrackingStats(),
          fetchRecentActivity()
        ]);
        setShowClearConfirm(false);
      } else {
        console.error('Failed to clear data');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setClearLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-product':
        window.location.href = '/products';
        break;
      case 'label-scan':
        window.location.href = '/scanning/label';
        break;
      case 'tracker-status':
        window.location.href = '/tracker-status';
        break;
      case 'hold-shipments':
        window.location.href = '/hold-shipments';
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const getActivityIcon = (scanType: string) => {
    switch (scanType.toLowerCase()) {
      case 'label':
        return <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>;
      case 'packing':
        return <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>;
      case 'dispatch':
        return <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>;
    }
  };

  const getActivityBgColor = (scanType: string) => {
    switch (scanType.toLowerCase()) {
      case 'label':
        return 'bg-green-50 border-green-200';
      case 'packing':
        return 'bg-blue-50 border-blue-200';
      case 'dispatch':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActivityTextColor = (scanType: string) => {
    switch (scanType.toLowerCase()) {
      case 'label':
        return 'text-green-800';
      case 'packing':
        return 'text-blue-800';
      case 'dispatch':
        return 'text-purple-800';
      default:
        return 'text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Clear All Data
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-3" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending/Hold</p>
                  <p className="text-xl font-bold text-gray-900">{stats.pending_trackers || 0}</p>
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
                <button 
                  onClick={() => handleQuickAction('add-product')}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Add New Product
                </button>
                <button 
                  onClick={() => handleQuickAction('label-scan')}
                  className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Start Label Scan
                </button>
                <button 
                  onClick={() => handleQuickAction('tracker-status')}
                  className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                >
                  View Tracker Status
                </button>
                <button 
                  onClick={() => handleQuickAction('hold-shipments')}
                  className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
                >
                  View Hold Shipments
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={activity.id || index} className={`flex items-center p-2 rounded border ${getActivityBgColor(activity.last_scan)}`}>
                      {getActivityIcon(activity.last_scan)}
                      <span className={`text-xs font-medium ${getActivityTextColor(activity.last_scan)}`}>
                        {activity.last_scan} scan completed for {activity.tracking_id} ({activity.distribution})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No recent activity found
                  </div>
                )}
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

        {/* Recent Products - Only show if there are products */}
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
    </div>
  );
};

export default Dashboard; 