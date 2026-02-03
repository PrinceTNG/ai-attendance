import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Brain, Sparkles, Loader } from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  detectIntentAdvanced, 
  generateAIResponse, 
  conversationMemory,
  type QueryContext 
} from '../services/aiNLP';
import { predictAttendancePatterns, analyzeTrends, generateInsights } from '../services/aiPredictions';
import { attendanceAPI, usersAPI, notificationsAPI } from '../services/api';
import { toast } from 'react-toastify';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
  }>;
  data?: any;
  isAI?: boolean;
}

interface AIChatbotProps {
  onClose: () => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: isAdmin 
        ? '🤖 **AI Assistant Activated**\n\nHello! I\'m your advanced AI assistant powered by natural language processing and machine learning. I can help you with:\n\n• 📊 **Analytics & Insights** - AI-powered attendance analysis\n• 📈 **Predictive Analytics** - Forecast attendance patterns\n• 📄 **Report Generation** - Create comprehensive reports\n• 🔔 **Smart Notifications** - Intelligent alert management\n• 👥 **User Management** - Advanced user analytics\n• 💬 **Natural Conversations** - Ask me anything!\n\nHow can I assist you today?'
        : '🤖 **AI Assistant Activated**\n\nHello! I\'m your advanced AI assistant. I can help you with:\n\n• 📊 **Attendance Insights** - AI-powered analysis of your attendance\n• 📅 **Leave Management** - Smart leave request processing\n• 💰 **Payslip Information** - Detailed salary breakdowns\n• ⏰ **Lateness Reports** - Intelligent reporting system\n• 🎯 **Predictions** - Forecast your attendance patterns\n\nWhat would you like to know?',
      timestamp: new Date(),
      isAI: true,
      actions: isAdmin
        ? [
            { label: '📊 View Analytics', action: 'analytics' },
            { label: '📈 Predictions', action: 'predictions' },
            { label: '📄 Generate Report', action: 'report' },
            { label: '🔔 Notifications', action: 'notifications' }
          ]
        : [
            { label: '📊 My Attendance', action: 'attendance' },
            { label: '💰 Payslip', action: 'payslip' },
            { label: '📅 Apply Leave', action: 'leave' },
            { label: '🔮 Predictions', action: 'predictions' }
          ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation memory
    if (user?.id) {
      conversationMemory.clear(user.id);
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content: string, type: 'user' | 'bot', actions?: Array<{label: string; action: string}>, data?: any, isAI = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      actions,
      data,
      isAI
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Add to conversation memory
    if (user?.id) {
      // Convert 'bot' to 'assistant' for conversation memory
      conversationMemory.addMessage(user.id, type === 'bot' ? 'assistant' : type, content);
    }
  };

  const processAIMessage = async (userMessage: string) => {
    if (!user?.id) return;

    setIsAIProcessing(true);
    setIsTyping(true);

    try {
      // Call the backend conversational AI directly
      const backendResponse = await aiAPI.chat(userMessage);
      console.log('🤖 Backend AI Response:', backendResponse);

      setIsTyping(false);
      setIsAIProcessing(false);

      if (backendResponse?.success && backendResponse?.message) {
        // Use the backend response directly - it handles everything
        addMessage(
          backendResponse.message, 
          'bot', 
          backendResponse.actions, 
          backendResponse.data, 
          true
        );
      } else {
        // Fallback to frontend AI if backend fails
        const context: QueryContext = {
          userId: user.id,
          userRole: user.role as 'admin' | 'employee' | 'student',
          previousMessages: conversationMemory.getContext(user.id),
          currentDate: new Date()
        };

        const aiAnalysis = detectIntentAdvanced(userMessage, context);
        const aiResponse = await generateAIResponse(
          aiAnalysis.intent,
          aiAnalysis.entities,
          context,
          {}
        );
        
        addMessage(aiResponse, 'bot', undefined, undefined, true);
      }

    } catch (error: any) {
      console.error('AI processing error:', error);
      setIsTyping(false);
      setIsAIProcessing(false);
      addMessage(
        'I encountered an error processing your request. Please try rephrasing your question or try again later.',
        'bot'
      );
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && !isTyping) {
      const message = inputValue.trim();
      addMessage(message, 'user');
      setInputValue('');
      processAIMessage(message);
    }
  };

  const handleActionClick = async (action: string) => {
    // Map old action names to new ones if needed
    const actionMap: Record<string, string> = {
      'attendance': 'check_attendance',
      'leave': 'apply_leave',
      'payslip': 'check_attendance',
      'analytics': 'check_attendance',
      'predictions': 'check_attendance',
      'schedule': 'view_schedule'
    };
    
    const mappedAction = actionMap[action] || action;
    
    setIsTyping(true);
    setIsAIProcessing(true);
    
    try {
      // Call the backend with the action (isAction = true)
      const response = await aiAPI.chat(mappedAction, true);
      
      setIsTyping(false);
      setIsAIProcessing(false);
      
      if (response.success && response.message) {
        addMessage(response.message, 'bot', response.actions, response.data, true);
      } else {
        addMessage('I had trouble processing that action. Please try again.', 'bot');
      }
    } catch (error) {
      console.error('Action error:', error);
      setIsTyping(false);
      setIsAIProcessing(false);
      addMessage('Something went wrong. Please try again.', 'bot');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl border border-white/10 w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="w-8 h-8 text-blue-400" />
                {isAIProcessing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Brain className="w-4 h-4 text-purple-400" />
                  </motion.div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  AI Assistant
                  <Sparkles className="w-4 h-4 ml-2 text-yellow-400" />
                </h3>
                <p className="text-xs text-gray-400">
                  {isAIProcessing ? 'AI Processing...' : 'Powered by Advanced NLP & ML'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500' 
                      : message.isAI 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                        : 'bg-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : message.isAI ? (
                      <Brain className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-2xl p-4 ${
                    message.type === 'user'
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <div className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content.split('\n').map((line, i) => {
                        // Format markdown-like text
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <strong key={i} className="text-blue-400">{line.slice(2, -2)}</strong>;
                        }
                        if (line.startsWith('•')) {
                          return <div key={i} className="ml-2">{line}</div>;
                        }
                        return <div key={i}>{line}</div>;
                      })}
                    </div>
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action.action)}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs text-blue-300 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-gray-400 text-sm">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/10 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything... (AI-powered)"
                  disabled={isTyping}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:opacity-50"
                />
                {isAIProcessing && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              💡 Tip: Ask naturally! The AI understands context and learns from our conversation.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
