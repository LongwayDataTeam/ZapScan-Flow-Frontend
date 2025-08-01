// API Configuration - Secure endpoint mapping
// Backend URL is never exposed in client-side code

// API endpoint paths (relative paths only)
const API_PATHS = {
  // Dashboard
  DASHBOARD_STATS: '/api/v1/dashboard/stats',
  TRACKING_STATS: '/api/v1/tracking/stats',
  
  // Trackers
  UPLOADED_TRACKERS: '/api/v1/trackers/uploaded/',
  ALL_TRACKERS: '/api/v1/trackers/',
  UPLOAD_TRACKERS: '/api/v1/trackers/upload/',
  UPLOAD_DETAILED_TRACKERS: '/api/v1/trackers/upload-detailed/',
  
  // Scans
  LABEL_SCAN: '/api/v1/scan/label/',
  PACKING_SCAN: '/api/v1/scan/packing/',
  PACKING_DUAL_SCAN: '/api/v1/scan/packing-dual/',
  DISPATCH_SCAN: '/api/v1/scan/dispatch/',
  CANCELLED_SHIPMENT: '/api/v1/scan/cancelled/',
  PENDING_SHIPMENT: '/api/v1/scan/pending/',
  UNHOLD_SHIPMENT: '/api/v1/scan/unhold/',
  
  // Recent Scans
  RECENT_LABEL_SCANS: '/api/v1/scans/recent/?scan_type=label',
  RECENT_PACKING_SCANS: '/api/v1/scans/recent/?scan_type=packing',
  RECENT_DISPATCH_SCANS: '/api/v1/scans/recent/?scan_type=dispatch',
  RECENT_SCANS: '/api/v1/scans/recent/',
  
  // Statistics
  PLATFORM_STATS: '/api/v1/scan/statistics/platform',
  
  // Pending Shipments
  PENDING_SHIPMENTS: '/api/v1/shipments/pending/',
  PENDING_SHIPMENTS_COUNT: '/api/v1/shipments/pending/count',
  ALL_HOLD_SHIPMENTS: '/api/v1/shipments/pending/all',
  
  // Cancelled Shipments
  CANCELLED_SHIPMENTS: '/api/v1/shipments/cancelled/',
  CANCELLED_SHIPMENTS_COUNT: '/api/v1/shipments/cancelled/count',
  
  // System
  CLEAR_DATA: '/api/v1/system/clear-data/',
  
  // Health
  HEALTH: '/health',
};

// Secure API service that doesn't expose backend URL
class SecureAPIService {
  private static getBaseURL(): string {
    // In development, use the environment variable
    if (process.env.NODE_ENV === 'development') {
      return process.env.REACT_APP_API_URL || 'http://localhost:8000';
    }
    // In production, use Vercel rewrite to proxy API calls
    return '';
  }

  static getEndpoint(path: string): string {
    return `${this.getBaseURL()}${path}`;
  }

  static getTrackerEndpoint(trackerCode: string, endpoint: string): string {
    return `${this.getBaseURL()}/api/v1/tracker/${trackerCode}${endpoint}`;
  }
}

// Export secure endpoints as functions to ensure dynamic URL resolution
export const API_ENDPOINTS = {
  // Dashboard
  DASHBOARD_STATS: () => SecureAPIService.getEndpoint(API_PATHS.DASHBOARD_STATS),
  TRACKING_STATS: () => SecureAPIService.getEndpoint(API_PATHS.TRACKING_STATS),
  
  // Trackers
  UPLOADED_TRACKERS: () => SecureAPIService.getEndpoint(API_PATHS.UPLOADED_TRACKERS),
  ALL_TRACKERS: () => SecureAPIService.getEndpoint(API_PATHS.ALL_TRACKERS),
  UPLOAD_TRACKERS: () => SecureAPIService.getEndpoint(API_PATHS.UPLOAD_TRACKERS),
  UPLOAD_DETAILED_TRACKERS: () => SecureAPIService.getEndpoint(API_PATHS.UPLOAD_DETAILED_TRACKERS),
  
  // Scans
  LABEL_SCAN: () => SecureAPIService.getEndpoint(API_PATHS.LABEL_SCAN),
  PACKING_SCAN: () => SecureAPIService.getEndpoint(API_PATHS.PACKING_SCAN),
  PACKING_DUAL_SCAN: () => SecureAPIService.getEndpoint(API_PATHS.PACKING_DUAL_SCAN),
  DISPATCH_SCAN: () => SecureAPIService.getEndpoint(API_PATHS.DISPATCH_SCAN),
  CANCELLED_SHIPMENT: () => SecureAPIService.getEndpoint(API_PATHS.CANCELLED_SHIPMENT),
  PENDING_SHIPMENT: () => SecureAPIService.getEndpoint(API_PATHS.PENDING_SHIPMENT),
  UNHOLD_SHIPMENT: () => SecureAPIService.getEndpoint(API_PATHS.UNHOLD_SHIPMENT),
  
  // Recent Scans
  RECENT_LABEL_SCANS: () => SecureAPIService.getEndpoint(API_PATHS.RECENT_LABEL_SCANS),
  RECENT_PACKING_SCANS: () => SecureAPIService.getEndpoint(API_PATHS.RECENT_PACKING_SCANS),
  RECENT_DISPATCH_SCANS: () => SecureAPIService.getEndpoint(API_PATHS.RECENT_DISPATCH_SCANS),
  RECENT_SCANS: () => SecureAPIService.getEndpoint(API_PATHS.RECENT_SCANS),
  
  // Statistics
  PLATFORM_STATS: () => SecureAPIService.getEndpoint(API_PATHS.PLATFORM_STATS),
  
  // Pending Shipments
  PENDING_SHIPMENTS: () => SecureAPIService.getEndpoint(API_PATHS.PENDING_SHIPMENTS),
  PENDING_SHIPMENTS_COUNT: () => SecureAPIService.getEndpoint(API_PATHS.PENDING_SHIPMENTS_COUNT),
  ALL_HOLD_SHIPMENTS: () => SecureAPIService.getEndpoint(API_PATHS.ALL_HOLD_SHIPMENTS),
  
  // Cancelled Shipments
  CANCELLED_SHIPMENTS: () => SecureAPIService.getEndpoint(API_PATHS.CANCELLED_SHIPMENTS),
  CANCELLED_SHIPMENTS_COUNT: () => SecureAPIService.getEndpoint(API_PATHS.CANCELLED_SHIPMENTS_COUNT),
  
  // Tracker Details
  TRACKER_COUNT: (trackerCode: string) => SecureAPIService.getTrackerEndpoint(trackerCode, '/count'),
  TRACKER_PACKING_DETAILS: (trackerCode: string) => SecureAPIService.getTrackerEndpoint(trackerCode, '/packing-details'),
  
  // System
  CLEAR_DATA: () => SecureAPIService.getEndpoint(API_PATHS.CLEAR_DATA),
  
  // Health
  HEALTH: () => SecureAPIService.getEndpoint(API_PATHS.HEALTH),
};

export default API_ENDPOINTS; 