import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, X, AlertCircle, Brain } from 'lucide-react';
import Webcam from 'react-webcam';
import { detectFaceWithAI, areModelsLoaded, calculateFaceSimilarity, detectFaceWithConfidence } from '../utils/faceDetection';
import {
  detectFaceWithQualityCheck,
  checkForMultipleFaces,
  performLivenessCheck,
  type FaceQualityMetrics,
  type LivenessCheck
} from '../utils/aiFaceEnhancement';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

interface AIFaceVerificationProps {
  onVerify: (verified: boolean, similarity?: number) => void;
  onCancel: () => void;
  purpose: 'clockin' | 'clockout';
}

export const AIFaceVerification: React.FC<AIFaceVerificationProps> = ({
  onVerify,
  onCancel,
  purpose
}) => {
  const { user } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'ready' | 'detecting' | 'verifying' | 'success' | 'failed'>('ready');
  const [faceDetected, setFaceDetected] = useState(false);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiModelsReady, setAiModelsReady] = useState(false);
  const [storedDescriptors, setStoredDescriptors] = useState<number[] | null>(null);
  const [faceQuality, setFaceQuality] = useState<FaceQualityMetrics | null>(null);
  const [livenessCheck, setLivenessCheck] = useState<LivenessCheck | null>(null);
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false);

  useEffect(() => {
    checkAIModels();
    preloadFacialDescriptors();
  }, []);

  const checkAIModels = async () => {
    const loaded = areModelsLoaded();
    if (!loaded) {
      // Try to load models
      const { loadFaceAPIModels } = await import('../utils/faceDetection');
      const modelsLoaded = await loadFaceAPIModels();
      setAiModelsReady(modelsLoaded);
    } else {
      setAiModelsReady(true);
    }
  };

  // Pre-load facial descriptors to avoid API call during verification
  const preloadFacialDescriptors = async () => {
    try {
      console.log('🔄 Pre-loading facial descriptors...');
      console.log('User context:', user ? { id: user.id, email: user.email, hasDescriptors: !!user.facialDescriptors } : 'null');
      
      // Try to get from user context first
      if (user?.facialDescriptors && Array.isArray(user.facialDescriptors) && user.facialDescriptors.length === 128) {
        console.log('✅ Using facial descriptors from user context');
        setStoredDescriptors(user.facialDescriptors);
        return;
      }
      
      // Fallback to API - but do it in background
      console.log('📡 Fetching facial descriptors from API...');
      const profile = await authAPI.getProfile();
      console.log('Profile response:', profile.user ? { 
        id: profile.user.id, 
        email: profile.user.email,
        hasFacialDescriptors: !!profile.user.facial_descriptors,
        descriptorsType: typeof profile.user.facial_descriptors
      } : 'null');
      
      if (profile.user?.facial_descriptors) {
        const descriptors = typeof profile.user.facial_descriptors === 'string' 
          ? JSON.parse(profile.user.facial_descriptors)
          : profile.user.facial_descriptors;
        if (Array.isArray(descriptors) && descriptors.length === 128) {
          console.log('✅ Facial descriptors loaded from API');
          setStoredDescriptors(descriptors);
        } else {
          console.warn('⚠️ Invalid descriptor format from API:', {
            isArray: Array.isArray(descriptors),
            length: descriptors?.length
          });
        }
      } else {
        console.warn('⚠️ No facial_descriptors in profile response');
      }
    } catch (error) {
      console.error('❌ Error pre-loading facial descriptors:', error);
      // Don't fail - will try again during verification
    }
  };

  const startVerification = async () => {
    setIsVerifying(true);
    setVerificationStep('detecting');
    setError(null);
    setFaceDetected(false);

    try {
      // Wait for camera to be ready
      let video = webcamRef.current?.video;
      let attempts = 0;
      const maxAttempts = 10;
      
      while ((!video || video.readyState !== video.HAVE_ENOUGH_DATA) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        video = webcamRef.current?.video;
        attempts++;
        console.log(`Waiting for camera... (attempt ${attempts}/${maxAttempts})`);
      }

      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.error('❌ Camera not ready after waiting');
        setError('Camera not ready. Please check permissions and ensure your camera is working.');
        setVerificationStep('failed');
        setIsVerifying(false);
        return;
      }

      console.log('✅ Camera ready, starting enhanced AI face verification...');

      // Check for multiple faces first (security)
      const multipleFaces = await checkForMultipleFaces(video);
      if (multipleFaces.multipleFaces) {
        setMultipleFacesDetected(true);
        setError('Multiple faces detected. Please ensure only you are in the frame.');
        setVerificationStep('failed');
        setIsVerifying(false);
        return;
      } else {
        setMultipleFacesDetected(false);
      }

      // Detect face with enhanced AI quality check
      console.log('🤖 Starting enhanced AI face verification with quality assessment...');
      const faceResult = await detectFaceWithQualityCheck(video, 0.55); // Minimum 55% quality for verification
      
      if (!faceResult || !faceResult.descriptor || faceResult.descriptor.length !== 128) {
        setError('No face detected or face quality too low. Please ensure good lighting and face the camera directly.');
        setVerificationStep('failed');
        setIsVerifying(false);
        return;
      }

      const descriptor = faceResult.descriptor;
      setFaceQuality(faceResult.quality);
      
      console.log('🔍 Face detection result:', {
        descriptorLength: descriptor.length,
        qualityScore: (faceResult.quality.score * 100).toFixed(1) + '%',
        lighting: faceResult.quality.lighting,
        angle: faceResult.quality.angle
      });

      // Perform liveness check
      console.log('🔍 Performing AI liveness check...');
      const liveness = await performLivenessCheck(video);
      setLivenessCheck(liveness);
      
      if (!liveness.isLive && liveness.confidence < 0.5) {
        console.warn('⚠️ Liveness check failed or low confidence');
        // Don't block, but log it
      }

      setFaceDetected(true);
      setVerificationStep('verifying');

      // Use pre-loaded descriptors if available, otherwise fetch
      let descriptorsToUse: number[] | null = storedDescriptors;
      console.log('🔍 Checking for stored descriptors:', {
        fromState: storedDescriptors ? `Length: ${storedDescriptors.length}` : 'null',
        fromUserContext: user?.facialDescriptors ? `Length: ${user.facialDescriptors.length}` : 'null'
      });
      
      if (!descriptorsToUse) {
        // Try to get from user context
        if (user?.facialDescriptors && Array.isArray(user.facialDescriptors) && user.facialDescriptors.length === 128) {
          console.log('✅ Using descriptors from user context');
          descriptorsToUse = user.facialDescriptors;
        } else {
          // Fallback to API (only if not pre-loaded)
          console.log('📡 Fetching descriptors from API as fallback...');
          try {
            const profile = await authAPI.getProfile();
            console.log('Profile API response:', {
              hasUser: !!profile.user,
              hasFacialDescriptors: !!profile.user?.facial_descriptors,
              type: typeof profile.user?.facial_descriptors
            });
            
            if (profile.user?.facial_descriptors) {
              descriptorsToUse = typeof profile.user.facial_descriptors === 'string' 
                ? JSON.parse(profile.user.facial_descriptors)
                : profile.user.facial_descriptors;
              
              if (Array.isArray(descriptorsToUse) && descriptorsToUse.length === 128) {
                console.log('✅ Descriptors loaded from API fallback');
              } else {
                console.error('❌ Invalid descriptor format from API:', {
                  isArray: Array.isArray(descriptorsToUse),
                  length: descriptorsToUse?.length
                });
                descriptorsToUse = null;
              }
            } else {
              console.error('❌ No facial_descriptors in profile response');
            }
          } catch (apiError) {
            console.error('❌ Error fetching profile:', apiError);
          }
        }
      } else {
        console.log('✅ Using pre-loaded descriptors');
      }

      if (!descriptorsToUse || !Array.isArray(descriptorsToUse) || descriptorsToUse.length !== 128) {
        console.error('❌ No facial descriptors found. Stored descriptors:', descriptorsToUse ? `Length: ${descriptorsToUse.length}` : 'null');
        setError('No facial data found. Please set up facial recognition first in your profile.');
        setVerificationStep('failed');
        setIsVerifying(false);
        onVerify(false, 0);
        return;
      }
      
      console.log('✅ Facial descriptors loaded, calculating similarity...');
      const calculatedSimilarity = calculateFaceSimilarity(descriptor, descriptorsToUse);
      console.log(`📊 Similarity calculated: ${(calculatedSimilarity * 100).toFixed(2)}%`);

      setSimilarity(calculatedSimilarity);

      // Verify threshold - lowered to 55% for easier matching (same as login)
      const SIMILARITY_THRESHOLD = 0.55;
      if (calculatedSimilarity >= SIMILARITY_THRESHOLD) {
        console.log(`✅ AI Verification Successful: ${(calculatedSimilarity * 100).toFixed(2)}% match`);
        setVerificationStep('success');
        // Reduced delay - proceed immediately after showing success
        setTimeout(() => {
          setIsVerifying(false);
          onVerify(true, calculatedSimilarity);
        }, 500); // Reduced from 1500ms to 500ms
      } else {
        console.log(`❌ AI Verification Failed: ${(calculatedSimilarity * 100).toFixed(2)}% match (threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%)`);
        setError(`Face verification failed. Match: ${(calculatedSimilarity * 100).toFixed(1)}% (required: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%). Please ensure you're using the same account you signed up with.`);
        setVerificationStep('failed');
        setTimeout(() => {
          setIsVerifying(false);
          onVerify(false, calculatedSimilarity);
        }, 1500); // Reduced from 2000ms to 1500ms
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message || 'Face verification error. Please try again.');
      setVerificationStep('failed');
      setIsVerifying(false);
      // Make sure to call onVerify even on error
      setTimeout(() => {
        onVerify(false, 0);
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl border border-white/10 w-full max-w-md p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">AI Face Verification</h3>
                <p className="text-xs text-gray-400">Powered by Neural Networks</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Feed */}
          <div className="relative mb-6">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                width="100%"
                height="100%"
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                mirrored
                onUserMedia={() => console.log('Camera ready')}
                onUserMediaError={(error) => {
                  setError('Camera access denied. Please enable camera permissions.');
                  setVerificationStep('failed');
                }}
              />
              
              {/* Detection Overlay */}
              {verificationStep === 'detecting' && (
                <motion.div
                  animate={{ borderColor: ['#3b82f6', '#8b5cf6', '#3b82f6'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-64 h-64 border-4 rounded-full border-blue-400" />
                </motion.div>
              )}

              {/* Status Indicator */}
              {verificationStep !== 'ready' && (
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    verificationStep === 'success'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : verificationStep === 'failed'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {verificationStep === 'detecting' && (
                      <>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>AI Detecting...</span>
                      </>
                    )}
                    {verificationStep === 'verifying' && (
                      <>
                        <Brain className="w-4 h-4 animate-pulse" />
                        <span>AI Verifying...</span>
                      </>
                    )}
                    {verificationStep === 'success' && (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </>
                    )}
                    {verificationStep === 'failed' && (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Failed</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {verificationStep === 'ready' && (
            <div className="text-center space-y-4 mb-6">
              <p className="text-gray-300">
                Position your face in the camera frame. AI will verify your identity.
              </p>
              {!aiModelsReady && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">Loading AI models...</p>
                </div>
              )}
            </div>
          )}

          {verificationStep === 'detecting' && (
            <div className="text-center space-y-2 mb-6">
              <p className="text-blue-400 font-medium">AI is detecting your face...</p>
              <p className="text-sm text-gray-400">Please look directly at the camera</p>
            </div>
          )}

          {verificationStep === 'verifying' && (
            <div className="text-center space-y-2 mb-6">
              <p className="text-purple-400 font-medium">AI is verifying your identity...</p>
              <p className="text-sm text-gray-400">Comparing with stored facial data</p>
              {faceQuality && (
                <div className="mt-2 text-xs text-gray-500">
                  Quality: {(faceQuality.score * 100).toFixed(0)}% • 
                  Lighting: {faceQuality.lighting} • 
                  Angle: {faceQuality.angle}
                </div>
              )}
              {livenessCheck && (
                <div className="mt-1 text-xs text-gray-500">
                  Liveness: {livenessCheck.isLive ? '✅ Live' : '⚠️ Check'} ({(livenessCheck.confidence * 100).toFixed(0)}%)
                </div>
              )}
            </div>
          )}

          {verificationStep === 'success' && similarity !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-2 mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
            >
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <p className="text-green-400 font-bold">AI Verification Successful!</p>
              <p className="text-sm text-gray-300">
                Match: <span className="font-semibold text-green-400">{(similarity * 100).toFixed(1)}%</span>
              </p>
              {faceQuality && (
                <p className="text-xs text-gray-400">
                  Quality: {(faceQuality.score * 100).toFixed(0)}% • 
                  {faceQuality.lighting === 'excellent' && '💡 Excellent'}
                  {faceQuality.angle === 'front' && ' • 🎯 Perfect angle'}
                </p>
              )}
              {livenessCheck && livenessCheck.isLive && (
                <p className="text-xs text-green-400">✅ Liveness verified</p>
              )}
              <p className="text-xs text-gray-400 mt-2">You are authorized to {purpose === 'clockin' ? 'clock in' : 'clock out'}</p>
            </motion.div>
          )}
          
          {multipleFacesDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">⚠️ Multiple faces detected. Please ensure only you are in frame.</p>
              </div>
            </motion.div>
          )}

          {verificationStep === 'failed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-2 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-red-400 font-bold">Verification Failed</p>
              {error && <p className="text-sm text-gray-300">{error}</p>}
              {similarity !== null && (
                <p className="text-xs text-gray-400">
                  Match: {(similarity * 100).toFixed(1)}% (Required: 60%)
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            {verificationStep === 'ready' && (
              <>
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startVerification}
                  disabled={!aiModelsReady || isVerifying}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start AI Verification
                </button>
              </>
            )}
            {(verificationStep === 'failed' || verificationStep === 'success') && (
              <button
                onClick={onCancel}
                className="w-full px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
