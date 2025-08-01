import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import API_ENDPOINTS from '../config/api';

interface TrackerStatus {
  label: boolean;
  packing: boolean;
  dispatch: boolean;
  pending?: boolean;
  cancelled?: boolean;
  packing_pending?: boolean;
}

interface TrackerDetails {
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

interface TrackerData {
  tracker_code: string;
  original_tracking_id: string;
  status: TrackerStatus;
  next_available_scan: string;
  details: TrackerDetails;
  last_updated?: string;
}

interface TrackerTableProps {
  refreshTrigger?: number;
}

const TrackerTable: React.FC<TrackerTableProps> = ({ refreshTrigger = 0 }) => {
  const [trackers, setTrackers] = useState<TrackerData[]>([]);
  const [filteredTrackers, setFilteredTrackers] = useState<TrackerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [currentStageFilter, setCurrentStageFilter] = useState<string>('all');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort states
  const [sortField, setSortField] = useState<string>('tracker_code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetchTrackers();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [trackers, currentStageFilter, currentStatusFilter, searchTerm, sortField, sortDirection]);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.ALL_TRACKERS());
      if (response.ok) {
        const data = await response.json();
        setTrackers(data.trackers || []);
        setError('');
      } else {
        setError('Failed to fetch tracker data');
      }
    } catch (error) {
      console.error('Error fetching trackers:', error);
      setError('Error fetching tracker data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStage = (tracker: TrackerData): string => {
    const status = tracker.status;
    
    // Debug logging
    console.log('Tracker:', tracker.tracker_code, 'Status:', status);
    
    if (status.cancelled) return 'Dispatch Cancelled';
    if (status.dispatch) return 'Dispatch';
    // Dispatch Pending: label = true, packing = true, pending = true
    if (status.label && status.packing && status.pending) return 'Dispatch Pending';
    if (status.packing) return 'Packing';
    // Packing Hold: label = true, pending = true (but packing = false)
    if (status.label && status.pending) return 'Packing Hold';
    if (status.label) return 'Packing Pending';
    return 'Label';
  };

  const getCurrentStatus = (tracker: TrackerData): string => {
    const status = tracker.status;
    
    if (status.cancelled) return 'Cancelled';
    if (status.dispatch) return 'Dispatched';
    if (status.pending) return 'Dispatch Pending';
    if (status.packing) return 'Packing Scanned';
    if (status.label) return 'Label Scanned';
    return 'Label yet to Scan';
  };

  const getCurrentStatusWithPackingPending = (tracker: TrackerData): string => {
    const status = tracker.status;
    
    if (status.cancelled) return 'Cancelled';
    if (status.dispatch) return 'Dispatched';
    // Dispatch Pending: label = true, packing = true, pending = true
    if (status.label && status.packing && status.pending) return 'Dispatch Pending';
    if (status.packing) return 'Packing Scanned';
    // Packing Hold: label = true, pending = true (but packing = false)
    if (status.label && status.pending) return 'Packing Hold';
    if (status.label) return 'Packing Pending Shipment';
    return 'Label yet to Scan';
  };

  const applyFilters = () => {
    let filtered = [...trackers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tracker => 
        tracker.tracker_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracker.original_tracking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracker.details.shipment_tracker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracker.details.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply stage filter
    if (currentStageFilter !== 'all') {
      filtered = filtered.filter(tracker => getCurrentStage(tracker) === currentStageFilter);
    }

    // Apply status filter
    if (currentStatusFilter !== 'all') {
      filtered = filtered.filter(tracker => getCurrentStatusWithPackingPending(tracker) === currentStatusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'tracker_code':
          aValue = a.tracker_code;
          bValue = b.tracker_code;
          break;
        case 'original_tracking_id':
          aValue = a.original_tracking_id;
          bValue = b.original_tracking_id;
          break;
        case 'current_stage':
          aValue = getCurrentStage(a);
          bValue = getCurrentStage(b);
          break;
        case 'current_status':
          aValue = getCurrentStatusWithPackingPending(a);
          bValue = getCurrentStatusWithPackingPending(b);
          break;
        case 'order_id':
          aValue = a.details.order_id || '';
          bValue = b.details.order_id || '';
          break;
        default:
          aValue = a.tracker_code;
          bValue = b.tracker_code;
      }

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredTrackers(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'Label': return 'bg-blue-100 text-blue-800';
      case 'Packing Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Packing Hold': return 'bg-orange-100 text-orange-800';
      case 'Packing': return 'bg-orange-100 text-orange-800';
      case 'Dispatch Pending': return 'bg-purple-100 text-purple-800';
      case 'Dispatch': return 'bg-green-100 text-green-800';
      case 'Dispatch Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Label yet to Scan': return 'bg-gray-100 text-gray-800';
      case 'Packing Pending Shipment': return 'bg-yellow-100 text-yellow-800';
      case 'Packing Hold': return 'bg-orange-100 text-orange-800';
      case 'Packing Scanned': return 'bg-orange-100 text-orange-800';
      case 'Dispatch Pending': return 'bg-purple-100 text-purple-800';
      case 'Dispatched': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateTrackerCode = (code: string): string => {
    if (code.length <= 10) return code;
    return `${code.substring(0, 6)}...${code.substring(code.length - 4)}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrackers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTrackers = filteredTrackers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const stageOptions = [
    'all',
    'Label',
    'Packing Pending',
    'Packing Hold',
    'Packing',
    'Dispatch Pending',
    'Dispatch',
    'Dispatch Cancelled'
  ];

  const statusOptions = [
    'all',
    'Label yet to Scan',
    'Packing Pending Shipment',
    'Packing Hold',
    'Packing Scanned',
    'Dispatch Pending',
    'Dispatched',
    'Cancelled'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchTrackers}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Tracker Data</h3>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trackers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Stage Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={currentStageFilter}
              onChange={(e) => setCurrentStageFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {stageOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Stages' : option}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={currentStatusFilter}
              onChange={(e) => setCurrentStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Status' : option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count and Page Size Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredTrackers.length)} of {filteredTrackers.length} trackers (Total: {trackers.length})
        </div>
        
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>

             {/* Table */}
       <div className="overflow-x-auto w-full">
         <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1800px' }}>
           <thead className="bg-gray-50">
             <tr>
                               <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ width: '6%' }}
                  onClick={() => handleSort('tracker_code')}
                >
                  <div className="flex items-center">
                    Tracker Code
                    {sortField === 'tracker_code' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                               <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ width: '6%' }}
                  onClick={() => handleSort('original_tracking_id')}
                >
                  <div className="flex items-center">
                    Tracking ID
                    {sortField === 'original_tracking_id' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                               <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ width: '6%' }}
                  onClick={() => handleSort('order_id')}
                >
                  <div className="flex items-center">
                    Order ID
                    {sortField === 'order_id' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
               <th 
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 style={{ width: '6%' }}
                 onClick={() => handleSort('current_stage')}
               >
                 <div className="flex items-center">
                   Stage
                   {sortField === 'current_stage' && (
                     sortDirection === 'asc' ? 
                       <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                       <ArrowDownIcon className="ml-1 h-4 w-4" />
                   )}
                 </div>
               </th>
               <th 
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 style={{ width: '6%' }}
                 onClick={() => handleSort('current_status')}
               >
                 <div className="flex items-center">
                   Status
                   {sortField === 'current_status' && (
                     sortDirection === 'asc' ? 
                       <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                       <ArrowDownIcon className="ml-1 h-4 w-4" />
                   )}
                 </div>
               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  Pincode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '3%' }}>
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '5%' }}>
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '7%' }}>
                  G-Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '7%' }}>
                  EAN-Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '7%' }}>
                  Product SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '7%' }}>
                  Listing ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '7%' }}>
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '7%' }}>
                  Sub Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" style={{ width: '8%' }} onClick={() => handleSort('last_updated')}>
                  <div className="flex items-center">
                    Last Updated
                    {sortField === 'last_updated' && (
                      sortDirection === 'asc' ? 
                        <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
             </tr>
           </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                         {paginatedTrackers.map((tracker, index) => {
               const currentStage = getCurrentStage(tracker);
               const currentStatus = getCurrentStatusWithPackingPending(tracker);
              
              return (
                                                                    <tr key={tracker.tracker_code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900" title={tracker.tracker_code}>
                      {truncateTrackerCode(tracker.tracker_code)}
                    </td>
                                         <td className="px-6 py-4 text-sm text-gray-900" title={tracker.original_tracking_id}>
                       {tracker.original_tracking_id}
                     </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.order_id || '-'}>
                      {truncateTrackerCode(tracker.details.order_id || '-')}
                    </td>
                   <td className="px-6 py-4">
                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(currentStage)}`}>
                       {currentStage}
                     </span>
                   </td>
                   <td className="px-6 py-4">
                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
                       {currentStatus}
                     </span>
                   </td>
                                       <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.channel_name || '-'}>
                      {truncateTrackerCode(tracker.details.channel_name || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.courier || '-'}>
                      {truncateTrackerCode(tracker.details.courier || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.buyer_city || '-'}>
                      {tracker.details.buyer_city || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.buyer_state || '-'}>
                      {tracker.details.buyer_state || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.buyer_pincode || '-'}>
                      {tracker.details.buyer_pincode || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.amount ? `₹${tracker.details.amount}` : '-'}>
                      {tracker.details.amount ? `₹${tracker.details.amount}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.qty?.toString() || '-'}>
                      {tracker.details.qty || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.payment_mode || '-'}>
                      {tracker.details.payment_mode || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.order_status || '-'}>
                      {tracker.details.order_status || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.g_code || '-'}>
                      {truncateTrackerCode(tracker.details.g_code || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.ean_code || '-'}>
                      {truncateTrackerCode(tracker.details.ean_code || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.product_sku_code || '-'}>
                      {truncateTrackerCode(tracker.details.product_sku_code || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.channel_listing_id || '-'}>
                      {truncateTrackerCode(tracker.details.channel_listing_id || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.invoice_number || '-'}>
                      {truncateTrackerCode(tracker.details.invoice_number || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.details.sub_order_id || '-'}>
                      {truncateTrackerCode(tracker.details.sub_order_id || '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900" title={tracker.last_updated || '-'}>
                      {tracker.last_updated ? new Date(tracker.last_updated).toLocaleString() : '-'}
                    </td>
                 </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredTrackers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trackers found matching the current filters.
        </div>
      )}

      {/* Pagination Controls */}
      {filteredTrackers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
                         {/* Page Numbers */}
             <div className="flex items-center gap-1">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                 let pageNum: number;
                 if (totalPages <= 5) {
                   pageNum = i + 1;
                 } else if (currentPage <= 3) {
                   pageNum = i + 1;
                 } else if (currentPage >= totalPages - 2) {
                   pageNum = totalPages - 4 + i;
                 } else {
                   pageNum = currentPage - 2 + i;
                 }
                 
                 return (
                   <button
                     key={pageNum}
                     onClick={() => handlePageChange(pageNum)}
                     className={`px-3 py-1 text-sm border rounded-md ${
                       currentPage === pageNum
                         ? 'bg-blue-600 text-white border-blue-600'
                         : 'border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     {pageNum}
                   </button>
                 );
               })}
             </div>
            
            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerTable; 