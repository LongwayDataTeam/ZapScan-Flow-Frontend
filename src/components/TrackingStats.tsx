import React from 'react';
import { ChartBarIcon, TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TrackingStats {
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

interface TrackingStatsProps {
  stats: TrackingStats;
  loading?: boolean;
}

const TrackingStats: React.FC<TrackingStatsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-base font-semibold text-gray-900">Tracking Statistics</h3>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.total_uploaded}</div>
          <div className="text-xs text-blue-700 font-medium">Total Uploaded</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.label_scanned}</div>
          <div className="text-xs text-green-700 font-medium">Label Scanned</div>
        </div>

        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.packing_scanned}</div>
          <div className="text-xs text-yellow-700 font-medium">Packing Scanned</div>
        </div>

        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{stats.dispatch_scanned}</div>
          <div className="text-xs text-purple-700 font-medium">Dispatch Scanned</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Label Scan Progress</span>
            <span className="text-xs font-bold text-blue-600">{stats.label_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.label_percentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Packing Scan Progress</span>
            <span className="text-xs font-bold text-yellow-600">{stats.packing_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.packing_percentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Dispatch Scan Progress</span>
            <span className="text-xs font-bold text-purple-600">{stats.dispatch_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.dispatch_percentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Overall Completion</span>
            <span className="text-xs font-bold text-green-600">{stats.completion_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-xs font-medium text-gray-700">Completed Trackers</span>
          </div>
          <span className="text-sm font-bold text-green-600">{stats.completed}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-xs font-medium text-gray-700">In Progress</span>
          </div>
          <span className="text-sm font-bold text-blue-600">{stats.total_uploaded - stats.completed}</span>
        </div>
      </div>
    </div>
  );
};

export default TrackingStats; 