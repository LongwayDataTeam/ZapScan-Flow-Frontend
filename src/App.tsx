import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductListing from './pages/ProductListing';
import TrackerStatus from './pages/TrackerStatus';
import Upload from './pages/Upload';
import HoldShipments from './pages/HoldShipments';
import PackingScan from './pages/scanning/PackingScan';
import DispatchScan from './pages/scanning/DispatchScan';
import LabelScan from './pages/scanning/LabelScan';

function App() {
  return (
    <Router>
      <div className="App flex h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-50 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/tracker-status" element={<TrackerStatus />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/hold-shipments" element={<HoldShipments />} />
            <Route path="/scan/packing" element={<PackingScan />} />
            <Route path="/scan/dispatch" element={<DispatchScan />} />
            <Route path="/scan/label" element={<LabelScan />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 