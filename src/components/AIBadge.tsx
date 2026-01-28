import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIBadgeProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const AIBadge: React.FC<AIBadgeProps> = ({ 
  text = 'AI Powered', 
  size = 'md',
  animated = true 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 ${sizeClasses[size]}`}
    >
      {animated ? (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Brain className={iconSizes[size]} />
        </motion.div>
      ) : (
        <Brain className={iconSizes[size]} />
      )}
      <span className="font-medium">{text}</span>
      <Sparkles className={iconSizes[size]} />
    </motion.div>
  );
};
