import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, AlertCircle } from 'lucide-react';

interface AIStatusIndicatorProps {
  status: 'ready' | 'loading' | 'error';
  message?: string;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ status, message }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          color: 'text-green-400',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: message || 'AI Ready'
        };
      case 'loading':
        return {
          icon: (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-4 h-4 text-blue-400" />
            </motion.div>
          ),
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: message || 'AI Processing...'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: message || 'AI Error'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
      {config.icon}
      <span className={`text-xs font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};
