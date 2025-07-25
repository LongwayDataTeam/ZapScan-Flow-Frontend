import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductListing from './pages/ProductListing';
import Upload from './pages/Upload';
import TrackerStatus from './pages/TrackerStatus';
import LabelScan from './pages/scanning/LabelScan';
import PackingScan from './pages/scanning/PackingScan';
import DispatchScan from './pages/scanning/DispatchScan';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductListing />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/tracker-status" element={<TrackerStatus />} />
              <Route path="/scan/label" element={<LabelScan />} />
              <Route path="/scan/packing" element={<PackingScan />} />
              <Route path="/scan/dispatch" element={<DispatchScan />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 