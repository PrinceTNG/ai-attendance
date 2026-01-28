import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, MapPin, MessageCircle, BarChart3, Sparkles, Zap, Shield } from 'lucide-react';

export const AIFeaturesShowcase: React.FC = () => {
  const features = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'AI Facial Recognition',
      description: 'Advanced neural networks for real-time face detection and identity verification',
      color: 'from-blue-500 to-cyan-500',
      details: [
        '128-dimensional face descriptors',
        'Real-time face detection',
        '99%+ accuracy',
        'Automatic capture'
      ]
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Chatbot',
      description: 'Natural language processing with context awareness and intelligent responses',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Natural language understanding',
        'Context-aware conversations',
        'Database integration',
        'Predictive insights'
      ]
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'AI Analytics & Predictions',
      description: 'Machine learning algorithms analyze patterns and predict attendance trends',
      color: 'from-green-500 to-teal-500',
      details: [
        'Pattern recognition',
        'Trend analysis',
        'Predictive modeling',
        'Smart recommendations'
      ]
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'Smart Location Verification',
      description: 'Intelligent geolocation with distance calculation and verification',
      color: 'from-orange-500 to-red-500',
      details: [
        'GPS-based verification',
        'Radius calculation',
        'Automatic validation',
        'Security enforcement'
      ]
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'AI Smart Notifications',
      description: 'Intelligent notification prioritization and insights',
      color: 'from-yellow-500 to-orange-500',
      details: [
        'Priority detection',
        'Pattern analysis',
        'Smart filtering',
        'Contextual insights'
      ]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'AI Security',
      description: 'Multi-layer AI security with identity verification and fraud detection',
      color: 'from-indigo-500 to-purple-500',
      details: [
        'Identity verification',
        'Fraud detection',
        'Anomaly detection',
        'Secure authentication'
      ]
    }
  ];

  return (
    <div className="py-8 sm:py-10 md:py-12 px-4">
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4"
        >
          <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI-Powered Features
          </h2>
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
        </motion.div>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg px-4">
          Advanced Artificial Intelligence integrated throughout the system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer`}
          >
            <div className="text-white mb-3 sm:mb-4 scale-90 sm:scale-100">
              {feature.icon}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">{feature.description}</p>
            <ul className="space-y-1.5 sm:space-y-2">
              {feature.details.map((detail, idx) => (
                <li key={idx} className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                  <Zap className="w-3 h-3 text-yellow-300 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
