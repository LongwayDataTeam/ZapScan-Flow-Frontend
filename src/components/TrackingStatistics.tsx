import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  CubeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../config/api';

interface TrackerStatus {
  label: boolean;
  packing: boolean;
  dispatch: boolean;
  pending?: boolean;
  cancelled?: boolean;
}

interface TrackerData {
  tracker_code: string;
  original_tracking_id: string;
  status: TrackerStatus;
  next_available_scan: string;
  details: any;
}

interface TrackingStatisticsData {
  total_uploaded: number;
  label_scanned: number;
  packing_scanned: number;
  dispatch_scanned: number;
  packing_hold: number;
  dispatch_pending: number;
  cancelled: number;
  verification: {
    total_minus_completed: number;
    label_equals_packing_equals_dispatch: boolean;
    packing_hold_zero: boolean;
  };
}

interface TrackingStatisticsProps {
  refreshTrigger?: number;
}

const TrackingStatistics: React.FC<TrackingStatisticsProps> = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState<TrackingStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [refreshTrigger]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.ALL_TRACKERS());
      if (response.ok) {
        const data = await response.json();
        const trackers = data.trackers || [];
        calculateStatistics(trackers);
      } else {
        setError('Failed to fetch tracker data');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Error fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (trackers: TrackerData[]) => {
    let total_uploaded = trackers.length;
    let label_scanned = 0;
    let packing_scanned = 0;
    let dispatch_scanned = 0;
    let packing_hold = 0;
    let dispatch_pending = 0;
    let cancelled = 0;

    trackers.forEach(tracker => {
      const status = tracker.status;
      
      if (status.cancelled) {
        cancelled++;
      } else if (status.dispatch) {
        dispatch_scanned++;
      } else if (status.label && status.packing && status.pending) {
        dispatch_pending++;
      } else if (status.packing) {
        packing_scanned++;
      } else if (status.label && status.pending) {
        packing_hold++;
      } else if (status.label) {
        label_scanned++;
      }
    });

    // Verification calculations
    const total_minus_completed = total_uploaded - (dispatch_scanned + dispatch_pending + cancelled);
    const label_equals_packing_equals_dispatch = (label_scanned === packing_scanned) && (packing_scanned === dispatch_scanned);
    const packing_hold_zero = packing_hold === 0;

    setStats({
      total_uploaded,
      label_scanned,
      packing_scanned,
      dispatch_scanned,
      packing_hold,
      dispatch_pending,
      cancelled,
      verification: {
        total_minus_completed,
        label_equals_packing_equals_dispatch,
        packing_hold_zero
      }
    });
  };

  const getKpiColor = (type: string, value: number, expectedValue?: number): string => {
    if (type === 'verification') {
      if (expectedValue !== undefined) {
        return value === expectedValue ? 'text-green-600' : 'text-red-600';
      }
      return value === 0 ? 'text-green-600' : 'text-red-600';
    }
    
    if (type === 'packing_hold') {
      return value === 0 ? 'text-green-600' : 'text-orange-600';
    }
    
    return 'text-blue-600';
  };

  const getKpiIcon = (type: string, value: number, expectedValue?: number) => {
    if (type === 'verification') {
      if (expectedValue !== undefined) {
        return value === expectedValue ? 
          <CheckCircleIcon className="h-6 w-6 text-green-500" /> : 
          <XCircleIcon className="h-6 w-6 text-red-500" />;
      }
      return value === 0 ? 
        <CheckCircleIcon className="h-6 w-6 text-green-500" /> : 
        <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
    }
    
    if (type === 'packing_hold') {
      return value === 0 ? 
        <CheckCircleIcon className="h-6 w-6 text-green-500" /> : 
        <ClockIcon className="h-6 w-6 text-orange-500" />;
    }
    
    return <ChartBarIcon className="h-6 w-6 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchStatistics}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking Statistics</h3>
      <p className="text-sm text-gray-600 mb-6">Showing scanned counts till now</p>
      
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Upload */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Upload</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_uploaded}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Label Scanned */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Label Scanned</p>
              <p className="text-2xl font-bold text-green-900">{stats.label_scanned}</p>
              <p className="text-xs text-green-600">Scanned till now</p>
            </div>
            <TagIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Packing Scanned */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Packing Scanned</p>
              <p className="text-2xl font-bold text-orange-900">{stats.packing_scanned}</p>
              <p className="text-xs text-orange-600">Scanned till now</p>
            </div>
            <CubeIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        {/* Dispatch Scanned */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Dispatch Scanned</p>
              <p className="text-2xl font-bold text-purple-900">{stats.dispatch_scanned}</p>
              <p className="text-xs text-purple-600">Scanned till now</p>
            </div>
            <TruckIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Packing Hold */}
        <div className={`rounded-lg p-4 ${stats.packing_hold === 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stats.packing_hold === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                Packing Hold
              </p>
              <p className={`text-2xl font-bold ${stats.packing_hold === 0 ? 'text-green-900' : 'text-orange-900'}`}>
                {stats.packing_hold}
              </p>
            </div>
            {getKpiIcon('packing_hold', stats.packing_hold)}
          </div>
        </div>

        {/* Dispatch Pending */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Dispatch Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.dispatch_pending}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Verification Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Verification Checks</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Total - (Dispatch + Dispatch Pending + Cancelled) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining Items</p>
                <p className={`text-xl font-bold ${getKpiColor('verification', stats.verification.total_minus_completed)}`}>
                  {stats.verification.total_minus_completed}
                </p>
                <p className="text-xs text-gray-500">
                  Total - (Dispatch + Pending + Cancelled)
                </p>
              </div>
              {getKpiIcon('verification', stats.verification.total_minus_completed, 0)}
            </div>
          </div>

          {/* Label = Packing = Dispatch */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flow Balance</p>
                <p className={`text-xl font-bold ${getKpiColor('verification', stats.verification.label_equals_packing_equals_dispatch ? 1 : 0)}`}>
                  {stats.verification.label_equals_packing_equals_dispatch ? '✓' : '✗'}
                </p>
                <p className="text-xs text-gray-500">
                  Label = Packing = Dispatch
                </p>
              </div>
              {getKpiIcon('verification', stats.verification.label_equals_packing_equals_dispatch ? 1 : 0, 1)}
            </div>
          </div>

          {/* Packing Hold Zero */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Packing Hold</p>
                <p className={`text-xl font-bold ${getKpiColor('verification', stats.packing_hold)}`}>
                  {stats.packing_hold === 0 ? '✓' : '✗'}
                </p>
                <p className="text-xs text-gray-500">
                  Should be zero for OK report
                </p>
              </div>
              {getKpiIcon('verification', stats.packing_hold)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingStatistics; 