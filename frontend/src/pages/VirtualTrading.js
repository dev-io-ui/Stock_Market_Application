import React from 'react';
import Portfolio from '../components/virtual-trading/Portfolio';
import TradeForm from '../components/virtual-trading/TradeForm';

const VirtualTrading = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Virtual Trading</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Portfolio />
        </div>
        <div>
          <TradeForm />
        </div>
      </div>
    </div>
  );
};

export default VirtualTrading;
