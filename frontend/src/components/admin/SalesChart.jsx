import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, Package } from 'lucide-react';

const SalesChart = ({ orders, period = 'week' }) => {
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    processData();
  }, [orders, period]);

  const processData = () => {
    const now = new Date();
    let days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
      
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate();
        return orderDate && orderDate.toDateString() === date.toDateString();
      });
      
      const revenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const orderCount = dayOrders.length;
      const profit = dayOrders.reduce((sum, o) => {
        const orderProfit = o.items.reduce((itemSum, item) => 
          itemSum + ((item.sellingPrice - item.buyPrice) * item.quantity), 0);
        return sum + orderProfit;
      }, 0);
      
      data.push({
        date: dateStr,
        revenue,
        orders: orderCount,
        profit,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0
      });
    }
    
    setChartData(data);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-valhala-primary p-3 rounded-lg border border-valhala-nordic">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.name === 'orders' ? p.value : formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-valhala-secondary rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Sales Overview</h3>
        <div className="flex gap-2">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-1 bg-valhala-primary border border-gray-700 rounded-lg text-sm"
          >
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-valhala-primary rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-valhala-gold" />
            <p className="text-xs text-gray-400">Total Revenue</p>
          </div>
          <p className="text-xl font-bold text-valhala-gold">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0))}
          </p>
        </div>
        <div className="bg-valhala-primary rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-valhala-accent" />
            <p className="text-xs text-gray-400">Total Orders</p>
          </div>
          <p className="text-xl font-bold">
            {chartData.reduce((sum, d) => sum + d.orders, 0)}
          </p>
        </div>
        <div className="bg-valhala-primary rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" />
            <p className="text-xs text-gray-400">Average Order Value</p>
          </div>
          <p className="text-xl font-bold text-green-500">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.averageOrderValue, 0) / chartData.length || 0)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis yAxisId="left" stroke="#888" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis yAxisId="right" orientation="right" stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#ffd700" name="Revenue" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#e94560" name="Orders" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#ffd700" fill="#ffd700" fillOpacity={0.3} />
              <Area type="monotone" dataKey="profit" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill="#ffd700" />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;