import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-center">
      <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
      <p className="text-red-500 mb-3">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;