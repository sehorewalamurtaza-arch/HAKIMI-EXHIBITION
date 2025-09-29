import React from 'react';

const EnhancedPOS = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
          <p className="text-gray-600 mt-1">Process sales and transactions</p>
        </div>
      </div>
      
      <div className="card p-8 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Point of Sale System</h2>
        <p className="text-gray-600">POS functionality will be available soon.</p>
      </div>
    </div>
  );
};

export default EnhancedPOS;