import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar, Download } from 'lucide-react';

const ProfitLossCalculator = ({ orders, products }) => {
  const [period, setPeriod] = useState('month');
  const [profitLossData, setProfitLossData] = useState(null);
  const [productPerformance, setProductPerformance] = useState([]);

  useEffect(() => {
    calculateProfitLoss();
  }, [orders, products, period]);

  const calculateProfitLoss = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      startDate = new Date(0);
    }
    
    const filteredOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate();
      return orderDate && orderDate >= startDate && order.status === 'delivered';
    });
    
    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const productMap = new Map();
    
    filteredOrders.forEach(order => {
      totalRevenue += order.total || 0;
      
      order.items.forEach(item => {
        const cost = (item.buyPrice || 0) * item.quantity;
        const revenue = (item.sellingPrice || 0) * item.quantity;
        const profit = revenue - cost;
        
        totalCost += cost;
        totalProfit += profit;
        
        if (productMap.has(item.productId)) {
          const existing = productMap.get(item.productId);
          productMap.set(item.productId, {
            ...existing,
            unitsSold: existing.unitsSold + item.quantity,
            revenue: existing.revenue + revenue,
            cost: existing.cost + cost,
            profit: existing.profit + profit
          });
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            name: item.name,
            unitsSold: item.quantity,
            revenue: revenue,
            cost: cost,
            profit: profit
          });
        }
      });
    });
    
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    setProfitLossData({
      totalRevenue,
      totalCost,
      totalProfit,
      margin,
      orderCount: filteredOrders.length
    });
    
    // Sort products by profit
    const productsArray = Array.from(productMap.values())
      .sort((a, b) => b.profit - a.profit);
    setProductPerformance(productsArray);
  };

  const exportData = () => {
    const data = {
      period,
      ...profitLossData,
      products: productPerformance
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!profitLossData) {
    return (
      <div className="bg-valhala-secondary rounded-xl p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-400">Calculating profits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center">
        <h2 className="text-xl font-bold">Profit & Loss Analysis</h2>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportData}
            className="px-3 py-2 bg-valhala-primary rounded-lg hover:bg-valhala-nordic transition-colors"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-valhala-gold" />
            <span className="text-xs text-gray-400">{profitLossData.orderCount} orders</span>
          </div>
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-valhala-gold">{formatCurrency(profitLossData.totalRevenue)}</p>
        </div>
        
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-400">Total Cost</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(profitLossData.totalCost)}</p>
        </div>
        
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-sm text-gray-400">Net Profit</p>
          <p className={`text-2xl font-bold ${profitLossData.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(profitLossData.totalProfit)}
          </p>
        </div>
        
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-valhala-accent" />
          </div>
          <p className="text-sm text-gray-400">Profit Margin</p>
          <p className="text-2xl font-bold text-valhala-accent">
            {profitLossData.margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-valhala-secondary rounded-xl overflow-hidden">
        <div className="p-4 border-b border-valhala-nordic">
          <h3 className="font-semibold">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-valhala-primary">
              <tr>
                <th className="p-3 text-left text-sm">Product</th>
                <th className="p-3 text-left text-sm">Units Sold</th>
                <th className="p-3 text-left text-sm">Revenue</th>
                <th className="p-3 text-left text-sm">Cost</th>
                <th className="p-3 text-left text-sm">Profit</th>
                <th className="p-3 text-left text-sm">Margin</th>
              </tr>
            </thead>
            <tbody>
              {productPerformance.map((product, index) => {
                const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                return (
                  <tr key={product.productId} className="border-t border-valhala-nordic">
                    <td className="p-3">
                      <p className="font-semibold">{product.name}</p>
                    </td>
                    <td className="p-3">{product.unitsSold}</td>
                    <td className="p-3 text-valhala-gold">{formatCurrency(product.revenue)}</td>
                    <td className="p-3 text-red-500">{formatCurrency(product.cost)}</td>
                    <td className="p-3 text-green-500">{formatCurrency(product.profit)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${margin >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {productPerformance.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No sales data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitLossCalculator;