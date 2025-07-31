import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  QrCodeIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Upload', href: '/upload', icon: CloudArrowUpIcon },
    { name: 'Tracker Status', href: '/tracker-status', icon: ChartBarIcon },
    { name: 'Label Scan', href: '/scan/label', icon: QrCodeIcon },
    { name: 'Packing Scan', href: '/scan/packing', icon: QrCodeIcon },
    { name: 'Dispatch Scan', href: '/scan/dispatch', icon: QrCodeIcon },
  ];

  return (
    <div className="bg-white text-gray-800 w-64 h-screen p-4 shadow-lg border-r border-gray-200 flex-shrink-0">
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LW</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">
          ZapScan Flow
          </h1>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-3"></div>
        
        {/* System Status - Always Online */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>System Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
            >
              <div className={`p-1.5 rounded-md transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 group-hover:text-gray-700 group-hover:bg-gray-100'
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="ml-2.5 font-medium text-sm">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 