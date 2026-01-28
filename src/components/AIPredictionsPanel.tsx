import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { predictAttendancePatterns, analyzeTrends, generateInsights } from '../services/aiPredictions';

export const AIPredictionsPanel: React.FC = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIPredictions();
  }, []);

  const fetchAIPredictions = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Fetch from both frontend and backend AI
      const [attendanceResponse, backendPredictions, backendInsights] = await Promise.all([
        attendanceAPI.getHistory({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }),
        // Try to get backend AI predictions (will fail silently if not available)
        import('../services/api').then(api => api.aiAPI.getPredictions()).catch(() => null),
        import('../services/api').then(api => api.aiAPI.getInsights('month')).catch(() => null)
      ]);

      if (attendanceResponse.attendance && user?.id) {
        const attendanceData = attendanceResponse.attendance;
        
        // Get AI predictions - prefer backend, fallback to frontend
        if (backendPredictions?.predictions && backendPredictions.predictions.length > 0) {
          // Transform backend predictions to match our format
          const formattedPredictions = backendPredictions.predictions.map((p: any) => ({
            prediction: p.prediction || `${p.day || 'Upcoming'}: ${p.prediction || 'Unknown'}`,
            confidence: p.confidence || 75,
            factors: [
              p.expectedHours ? `Expected hours: ${p.expectedHours}h` : 'Based on historical patterns',
              p.type ? `Type: ${p.type}` : 'AI-powered analysis'
            ],
            recommendation: p.recommendation || 'Continue maintaining good attendance habits'
          }));
          setPredictions(formattedPredictions);
        } else {
          const aiPredictions = await predictAttendancePatterns(attendanceData, user.id);
          setPredictions(aiPredictions);
        }

        // Get trend analysis
        const trendAnalysis = await analyzeTrends(attendanceData);
        setTrends(trendAnalysis);

        // Get insights - prefer backend, merge with frontend
        const frontendInsights = await generateInsights(attendanceData, {});
        if (backendInsights?.insights && backendInsights.insights.length > 0) {
          // Merge backend and frontend insights, remove duplicates
          const allInsights = [...backendInsights.insights, ...frontendInsights];
          const uniqueInsights = [...new Set(allInsights)];
          setInsights(uniqueInsights.slice(0, 5));
        } else {
          setInsights(frontendInsights);
        }
      }
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
      // Try frontend-only fallback
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const attendanceResponse = await attendanceAPI.getHistory({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        if (attendanceResponse.attendance && user?.id) {
          const aiPredictions = await predictAttendancePatterns(attendanceResponse.attendance, user.id);
          setPredictions(aiPredictions);
          const trendAnalysis = await analyzeTrends(attendanceResponse.attendance);
          setTrends(trendAnalysis);
          const aiInsights = await generateInsights(attendanceResponse.attendance, {});
          setInsights(aiInsights);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3 text-gray-400">
            <Brain className="w-5 h-5 animate-pulse" />
            <span>AI is analyzing your attendance patterns...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">AI Insights</h3>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <p className="text-gray-300 text-sm">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Predictions */}
      {predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">AI Predictions</h3>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">ML Powered</span>
          </div>
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{prediction.prediction}</h4>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    {prediction.confidence}% confidence
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Factors:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {prediction.factors.map((factor: string, idx: number) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-300">
                      💡 <strong>Recommendation:</strong> {prediction.recommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trend Analysis */}
      {trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Pattern Analysis</h3>
          </div>
          <div className="space-y-3">
            {trends.map((trend, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-xl border ${
                  trend.strength === 'strong'
                    ? 'bg-green-500/10 border-green-500/20'
                    : trend.strength === 'moderate'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-orange-500/10 border-orange-500/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white flex items-center space-x-2">
                    {trend.strength === 'strong' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                    <span>{trend.pattern}</span>
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    trend.strength === 'strong'
                      ? 'bg-green-500/20 text-green-400'
                      : trend.strength === 'moderate'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {trend.strength}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{trend.description}</p>
                <p className="text-xs text-gray-400">Impact: {trend.impact}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {predictions.length === 0 && trends.length === 0 && insights.length === 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Not enough data for AI predictions yet.</p>
          <p className="text-sm text-gray-500 mt-2">Keep using the system to generate personalized insights!</p>
        </div>
      )}
    </div>
  );
};
