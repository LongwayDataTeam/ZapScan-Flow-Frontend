import React from 'react';
import { TruckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface TruckProgressProps {
  trackerCode: string;
  labelCompleted: boolean;
  packingCompleted: boolean;
  dispatchCompleted: boolean;
  currentStep: 'label' | 'packing' | 'dispatch' | 'completed';
  isDemo?: boolean;
}

const TruckProgress: React.FC<TruckProgressProps> = ({
  trackerCode,
  labelCompleted,
  packingCompleted,
  dispatchCompleted,
  currentStep,
  isDemo = false
}) => {
  const getTruckPosition = () => {
    if (currentStep === 'completed') return '100%';
    if (currentStep === 'dispatch') return '66.66%';
    if (currentStep === 'packing') return '33.33%';
    return '0%';
  };

  const getStepStatus = (step: 'label' | 'packing' | 'dispatch') => {
    if (step === 'label') return labelCompleted;
    if (step === 'packing') return packingCompleted;
    if (step === 'dispatch') return dispatchCompleted;
    return false;
  };

  const getStepColor = (step: 'label' | 'packing' | 'dispatch') => {
    const isCompleted = getStepStatus(step);
    const isCurrent = currentStep === step;
    
    if (isCompleted) return 'bg-green-500 border-green-500';
    if (isCurrent) return 'bg-blue-500 border-blue-500';
    return 'bg-gray-300 border-gray-300';
  };

  const getStepIcon = (step: 'label' | 'packing' | 'dispatch') => {
    const isCompleted = getStepStatus(step);
    return isCompleted ? (
      <CheckCircleIcon className="w-4 h-4 text-white" />
    ) : (
      <div className="w-4 h-4 rounded-full bg-white" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          {isDemo ? 'Demo Tracker' : `Tracker: ${trackerCode}`}
        </h3>
        <p className="text-xs text-gray-600">Fulfillment Journey</p>
        {isDemo && (
          <p className="text-xs text-blue-600 mt-1 font-medium">Try scanning pages!</p>
        )}
      </div>

      {/* Compact Progress Bar Container */}
      <div className="relative mb-6">
        {/* Background Track */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-green-600 transition-all duration-1000 ease-out"
            style={{ 
              width: getTruckPosition(),
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Compact Truck Icon */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-1000 ease-out"
          style={{ 
            left: `calc(${getTruckPosition()} - 12px)`,
            transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
            <TruckIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Compact Checkpoints */}
        <div className="absolute top-1/2 transform -translate-y-1/2 -mt-1.5 w-full">
          <div className="flex justify-between">
            {/* Label Checkpoint */}
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${getStepColor('label')} transition-all duration-300`}>
                {getStepIcon('label')}
              </div>
              <span className="text-xs font-medium mt-1 text-gray-700">Label</span>
            </div>

            {/* Packing Checkpoint */}
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${getStepColor('packing')} transition-all duration-300`}>
                {getStepIcon('packing')}
              </div>
              <span className="text-xs font-medium mt-1 text-gray-700">Packing</span>
            </div>

            {/* Dispatch Checkpoint */}
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${getStepColor('dispatch')} transition-all duration-300`}>
                {getStepIcon('dispatch')}
              </div>
              <span className="text-xs font-medium mt-1 text-gray-700">Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-2 rounded-lg border transition-all duration-300 ${
          labelCompleted 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          <div className="text-center">
            <div className="font-semibold text-xs mb-1">Label</div>
            <div className="text-xs">{labelCompleted ? '✅ Done' : '⏳ Pending'}</div>
          </div>
        </div>

        <div className={`p-2 rounded-lg border transition-all duration-300 ${
          packingCompleted 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          <div className="text-center">
            <div className="font-semibold text-xs mb-1">Packing</div>
            <div className="text-xs">{packingCompleted ? '✅ Done' : '⏳ Pending'}</div>
          </div>
        </div>

        <div className={`p-2 rounded-lg border transition-all duration-300 ${
          dispatchCompleted 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          <div className="text-center">
            <div className="font-semibold text-xs mb-1">Dispatch</div>
            <div className="text-xs">{dispatchCompleted ? '✅ Done' : '⏳ Pending'}</div>
          </div>
        </div>
      </div>

      {/* Compact Current Status */}
      <div className="mt-3 text-center">
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
          currentStep === 'completed' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : currentStep === 'label'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : currentStep === 'packing'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-purple-100 text-purple-800 border border-purple-300'
        }`}>
          {currentStep === 'completed' && '🎉 Complete!'}
          {currentStep === 'label' && '🚛 Ready for Label'}
          {currentStep === 'packing' && '📦 Ready for Packing'}
          {currentStep === 'dispatch' && '🚚 Ready for Dispatch'}
        </div>
      </div>
    </div>
  );
};

export default TruckProgress; 