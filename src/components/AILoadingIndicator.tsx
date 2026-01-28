import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

interface AILoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({ 
  message = 'AI is processing...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain className={`${sizeClasses[size]} text-blue-400`} />
        </motion.div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0"
        >
          <Sparkles className={`${sizeClasses[size]} text-purple-400`} />
        </motion.div>
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
};
