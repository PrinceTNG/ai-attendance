import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Clock, Shield, Users, Zap, Eye, Sparkles } from 'lucide-react';
import { AIFeaturesShowcase } from '../components/AIFeaturesShowcase';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: "AI Facial Recognition",
      description: "Secure, contactless attendance with advanced facial recognition technology"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Real-time Tracking",
      description: "Track attendance, hours, and productivity in real-time with precision"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Geolocation Security",
      description: "GPS verification ensures attendance is marked from authorized locations"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Smart Analytics",
      description: "AI-powered insights and predictive analytics for better workforce management"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Role Support",
      description: "Tailored dashboards for administrators, employees, and students"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Reports",
      description: "Generate comprehensive reports instantly with automated calculations"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-purple-400 flex-shrink-0" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent leading-tight">
                  Initium Venture
                  <span className="block">Solutions</span>
                </h1>
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-400 flex-shrink-0" />
              </div>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-200 font-light max-w-3xl mx-auto mb-4 px-4">
                AI-Powered Smart Attendance System
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8 px-4">
                <span className="px-2 sm:px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs sm:text-sm whitespace-nowrap">
                  🤖 Neural Networks
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs sm:text-sm whitespace-nowrap">
                  🧠 Machine Learning
                </span>
                <span className="px-2 sm:px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-teal-300 text-xs sm:text-sm whitespace-nowrap">
                  ⚡ Real-time AI
                </span>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-12 px-4"
            >
              Transform your attendance management with cutting-edge <strong className="text-purple-400">Artificial Intelligence</strong>. 
              Powered by neural networks, machine learning, and natural language processing for intelligent automation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
            >
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-glow text-sm sm:text-base"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                Create Account
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating AI Elements - Hidden on mobile for performance */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="hidden md:block absolute top-1/4 right-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [10, -10, 10],
            rotate: [0, -5, 0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="hidden md:block absolute bottom-1/4 left-10 w-32 h-32 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-15 blur-2xl"
        />
      </section>

      {/* AI Features Showcase */}
      <AIFeaturesShowcase />

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 flex-shrink-0" />
              <span className="text-center">Powered by Advanced AI Technology</span>
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 flex-shrink-0" />
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Experience the future of attendance management with our intelligent, secure, and user-friendly platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="h-full p-5 sm:p-6 md:p-8 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-white scale-75 sm:scale-90 md:scale-100">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 border border-white/10"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
              Ready to Transform Your Attendance System?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Join hundreds of organizations already using our AI-powered platform to streamline their attendance management.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-glow text-sm sm:text-base"
            >
              Get Started Today
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};