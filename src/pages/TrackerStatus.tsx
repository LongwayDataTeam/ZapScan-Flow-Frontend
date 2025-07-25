import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import TruckProgress from '../components/TruckProgress';
import TrackingStats from '../components/TrackingStats';
import API_ENDPOINTS from '../config/api';

interface TrackerStatus {
  tracker_code: string;
  original_tracking_id?: string;
  status: {
    label: boolean;
    packing: boolean;
    dispatch: boolean;
  };
  next_available_scan: string;
  details?: {
    channel_id?: string;
    order_id?: string;
    sub_order_id?: string;
    shipment_tracker?: string;
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
  };
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

type StatusFilter = 'all' | 'label' | 'packing' | 'dispatch' | 'completed';

const TrackerStatus: React.FC = () => {
  const [trackers, setTrackers] = useState<TrackerStatus[]>([]);
  const [trackingStats, setTrackingStats] = useState<TrackingStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackers();
    fetchTrackingStats();
  }, []);

  const fetchTrackers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ALL_TRACKERS);
      if (response.ok) {
        const data = await response.json();
        setTrackers(data.trackers || []);
      }
    } catch (error) {
      console.error('Error fetching trackers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TRACKING_STATS);
      if (response.ok) {
        const data = await response.json();
        setTrackingStats(data);
      }
    } catch (error) {
      console.error('Error fetching tracking stats:', error);
    }
  };

  const filteredTrackers = trackers.filter(tracker => {
    // Text search filter
    const matchesSearch = 
      (tracker.tracker_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tracker.original_tracking_id && tracker.original_tracking_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tracker.details?.product_sku_code && tracker.details.product_sku_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tracker.details?.order_id && tracker.details.order_id.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    let matchesStatus = true;
    switch (statusFilter) {
      case 'label':
        matchesStatus = tracker.status.label && !tracker.status.packing && !tracker.status.dispatch;
        break;
      case 'packing':
        matchesStatus = tracker.status.packing && !tracker.status.dispatch;
        break;
      case 'dispatch':
        matchesStatus = tracker.status.dispatch;
        break;
      case 'completed':
        matchesStatus = tracker.status.label && tracker.status.packing && tracker.status.dispatch;
        break;
      case 'all':
      default:
        matchesStatus = true;
        break;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (tracker: TrackerStatus) => {
    if (tracker.status.dispatch) return 'bg-green-100 text-green-800 border-green-200';
    if (tracker.status.label || tracker.status.packing) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (tracker: TrackerStatus) => {
    if (tracker.status.dispatch) return 'completed';
    if (tracker.status.label || tracker.status.packing) return 'in_progress';
    return 'not_started';
  };

  const getTrackerStatus = (tracker: TrackerStatus) => {
    if (tracker.status.dispatch) return 'completed';
    if (tracker.status.label || tracker.status.packing) return 'in_progress';
    return 'not_started';
  };

  const getCurrentStep = (tracker: TrackerStatus): 'label' | 'packing' | 'dispatch' | 'completed' => {
    if (tracker.status.dispatch) return 'completed';
    if (tracker.status.packing) return 'dispatch';
    if (tracker.status.label) return 'packing';
    return 'label';
  };

  const getFilterButtonClass = (filter: StatusFilter) => {
    const baseClass = "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors";
    return statusFilter === filter
      ? `${baseClass} bg-blue-100 text-blue-700 border-blue-300`
      : `${baseClass} bg-white text-gray-600 border-gray-300 hover:bg-gray-50`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracker status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tracker Status</h1>
          <p className="text-gray-600">Monitor the progress of all uploaded trackers</p>
        </div>

        {/* Tracking Statistics */}
        {trackingStats && (
          <div className="mb-6">
            <TrackingStats stats={trackingStats} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search trackers, products, or order IDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-gray-600 self-center">
                  {filteredTrackers.length} of {trackers.length} trackers
                </span>
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={getFilterButtonClass('all')}
                >
                  All Trackers
                </button>
                <button
                  onClick={() => setStatusFilter('label')}
                  className={getFilterButtonClass('label')}
                >
                  Scanned Label
                </button>
                <button
                  onClick={() => setStatusFilter('packing')}
                  className={getFilterButtonClass('packing')}
                >
                  Dual Scan
                </button>
                <button
                  onClick={() => setStatusFilter('dispatch')}
                  className={getFilterButtonClass('dispatch')}
                >
                  Dispatch
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={getFilterButtonClass('completed')}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trackers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrackers.map((tracker) => {
            const status = getTrackerStatus(tracker);
            const isSelected = selectedTracker === tracker.tracker_code;
            const details = tracker.details || {};

            return (
              <div
                key={tracker.tracker_code}
                className={`bg-white rounded-lg shadow-md border transition-all cursor-pointer hover:shadow-lg ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
                }`}
                onClick={() => setSelectedTracker(isSelected ? null : tracker.tracker_code)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-semibold text-gray-900 text-sm">
                        {tracker.original_tracking_id || tracker.tracker_code}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tracker)}`}>
                      {getStatusText(tracker).replace('_', ' ')}
                    </div>
                  </div>

                  {/* Product Information */}
                  {details.product_sku_code && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Product</div>
                      <div className="text-xs text-gray-600 truncate">
                        {details.product_sku_code}
                      </div>
                    </div>
                  )}

                  {/* Order Information */}
                  {details.order_id && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Order ID</div>
                      <div className="text-xs text-gray-600 truncate">
                        {details.order_id}
                      </div>
                    </div>
                  )}

                  {/* Amount */}
                  {details.amount && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <CurrencyRupeeIcon className="h-3 w-3 mr-1" />
                        Amount
                      </div>
                      <div className="text-xs text-gray-600">
                        ₹{details.amount}
                      </div>
                    </div>
                  )}

                  {/* Buyer Location */}
                  {details.buyer_city && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        Destination
                      </div>
                      <div className="text-xs text-gray-600">
                        {details.buyer_city}, {details.buyer_state}
                      </div>
                    </div>
                  )}

                  {/* Progress Indicators */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Label</span>
                      <div className="flex items-center">
                        {tracker.status.label ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Packing</span>
                      <div className="flex items-center">
                        {tracker.status.packing ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Dispatch</span>
                      <div className="flex items-center">
                        {tracker.status.dispatch ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Next Step */}
                  <div className="text-xs text-gray-500">
                    Next: {tracker.next_available_scan}
                  </div>
                </div>

                {/* Expanded View */}
                {isSelected && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                                         <TruckProgress
                       trackerCode={tracker.tracker_code}
                       labelCompleted={tracker.status.label}
                       packingCompleted={tracker.status.packing}
                       dispatchCompleted={tracker.status.dispatch}
                       currentStep={getCurrentStep(tracker)}
                       isDemo={false}
                     />

                    {/* Detailed Information */}
                    {details && Object.keys(details).length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900">Order Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {details.invoice_number && (
                            <div>
                              <span className="font-medium text-gray-700">Invoice:</span>
                              <div className="text-gray-600">{details.invoice_number}</div>
                            </div>
                          )}
                          {details.courier && (
                            <div>
                              <span className="font-medium text-gray-700">Courier:</span>
                              <div className="text-gray-600">{details.courier}</div>
                            </div>
                          )}
                          {details.payment_mode && (
                            <div>
                              <span className="font-medium text-gray-700">Payment:</span>
                              <div className="text-gray-600">{details.payment_mode}</div>
                            </div>
                          )}
                          {details.qty && (
                            <div>
                              <span className="font-medium text-gray-700">Quantity:</span>
                              <div className="text-gray-600">{details.qty}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTrackers.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No trackers found' : 'No trackers uploaded'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Upload tracker codes to start monitoring progress'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerStatus; 