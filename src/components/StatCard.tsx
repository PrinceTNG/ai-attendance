import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  color
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/20',
    green: 'from-green-500/20 to-green-600/20 border-green-400/20',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-400/20',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-400/20'
  };

  const iconColorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400'
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{value}</p>
          <div className="flex items-center mt-1 sm:mt-2">
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 mr-1 flex-shrink-0" />
            )}
            <span className={`text-xs sm:text-sm font-medium ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {change}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconColorClasses[color]} rounded-full flex items-center justify-center flex-shrink-0`}>
          <div className="scale-75 sm:scale-100">
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
};