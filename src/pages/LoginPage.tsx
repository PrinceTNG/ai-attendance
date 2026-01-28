import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Camera, Loader, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { FacialRecognition } from '../components/FacialRecognition';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithFace } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFacialLogin, setShowFacialLogin] = useState(false);
  const isProcessingFaceLogin = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login for:', formData.email);
      const result = await login(formData.email, formData.password);
      
      if (result.success && result.user) {
        console.log('✅ Login successful:', result.user);
        toast.success(`✅ ${result.message || 'Login successful!'}`);
        setTimeout(() => {
          navigate(`/${result.user.role}`);
        }, 500);
      } else {
        console.error('❌ Login failed:', result.message);
        toast.error(`❌ ${result.message || 'Login failed. Please check your credentials.'}`);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacialLogin = async (facialData: number[]) => {
    // Prevent multiple simultaneous calls
    if (isProcessingFaceLogin.current) {
      console.log('⚠️ Face login already in progress, ignoring duplicate call');
      return;
    }
    
    try {
      isProcessingFaceLogin.current = true;
      setIsLoading(true);
      const result = await loginWithFace(facialData);
      
      if (result.success && result.user) {
        toast.success(`✅ ${result.message || 'Facial recognition successful!'}`);
        setTimeout(() => {
          navigate(`/${result.user.role}`);
        }, 500);
      } else {
        const errorMsg = result.message || 'Face not recognized';
        toast.error(`❌ ${errorMsg}. Please ensure you're using the same account you signed up with.`);
        setShowFacialLogin(false);
      }
    } catch (error: any) {
      console.error('Facial login error:', error);
      toast.error(`❌ ${error.message || 'Facial recognition failed. Please try traditional login.'}`);
      setShowFacialLogin(false);
    } finally {
      setIsLoading(false);
      isProcessingFaceLogin.current = false;
    }
  };

  if (showFacialLogin) {
    return (
      <FacialRecognition
        mode="login"
        onSuccess={handleFacialLogin}
        onCancel={() => setShowFacialLogin(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-6 sm:space-y-8"
      >
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 sm:mb-8 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300">
              Sign in to your account
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10"
        >
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all pr-10 sm:pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl text-sm sm:text-base hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-4 sm:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-slate-900 text-gray-400">Or continue with</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFacialLogin(true)}
              className="mt-4 w-full flex justify-center items-center px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg sm:rounded-xl text-sm sm:text-base border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Sign In with Face Recognition</span>
              <span className="sm:hidden">Face Recognition</span>
            </motion.button>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign up here
              </Link>
            </p>
          </div>

          {/* By Prince */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg sm:rounded-xl"
          >
            <p className="text-xs text-blue-300 font-medium mb-2">By Prince:</p>
            
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};