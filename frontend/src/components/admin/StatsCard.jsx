import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, change, color = 'valhala-accent' }) => {
  const isPositive = change > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-valhala-secondary rounded-xl p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 bg-${color}/10 rounded-lg`}>
          <Icon className={`text-${color}`} size={24} />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )}
          <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs last week</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;