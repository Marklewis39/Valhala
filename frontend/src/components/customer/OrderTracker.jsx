import React from 'react';
import { CheckCircle, Clock, Package, Truck, Home } from 'lucide-react';

const steps = [
  { id: 'pending_payment', label: 'Pending Payment', icon: Clock },
  { id: 'awaiting_driver', label: 'Awaiting Driver', icon: Package },
  { id: 'picked_up', label: 'Picked Up', icon: Truck },
  { id: 'en_route', label: 'En Route', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home }
];

const OrderTracker = ({ currentStatus }) => {
  const getStepStatus = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700">
        <div 
          className="h-full bg-valhala-accent transition-all duration-500"
          style={{ 
            width: `${(steps.findIndex(s => s.id === currentStatus) / (steps.length - 1)) * 100}%` 
          }}
        />
      </div>
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="text-center">
              <div className={`
                relative z-10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2
                ${status === 'completed' ? 'bg-green-500' : ''}
                ${status === 'current' ? 'bg-valhala-accent ring-4 ring-valhala-accent/30' : ''}
                ${status === 'pending' ? 'bg-gray-700' : ''}
              `}>
                {status === 'completed' ? (
                  <CheckCircle size={20} className="text-white" />
                ) : (
                  <Icon size={20} className="text-white" />
                )}
              </div>
              <p className={`text-xs font-medium ${
                status === 'current' ? 'text-valhala-accent' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;