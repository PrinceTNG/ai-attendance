import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Camera, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AIFaceVerification } from './AIFaceVerification';

interface ClockInOutProps {
  onStatusChange?: () => void;
}

export const ClockInOut: React.FC<ClockInOutProps> = ({ onStatusChange }) => {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clockin' | 'clockout' | null>(null);
  const [verifiedLocation, setVerifiedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [officeLocation, setOfficeLocation] = useState({
    lat: -26.1942,
    lng: 28.0578,
    radius: 5000,
    address: "Office Location"
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch current status on component mount
    fetchCurrentStatus();
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Use defaults if not logged in
        return;
      }

      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setOfficeLocation({
            lat: parseFloat(data.settings.office_latitude || '-26.1942'),
            lng: parseFloat(data.settings.office_longitude || '28.0578'),
            radius: parseFloat(data.settings.location_radius_meters || '5000'),
            address: data.settings.company_name ? `${data.settings.company_name} Office` : 'Office Location'
          });
        }
      } else if (response.status === 403) {
        // Non-admin users can't access settings - use defaults
        console.log('Settings access restricted (non-admin). Using default location.');
        // Keep default values already set in state
      }
    } catch (error) {
      console.error('Error fetching office location:', error);
      // Use defaults on error
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus();
      if (response.attendance) {
        setIsClockedIn(response.attendance.clock_out === null);
        if (response.attendance.clock_in) {
          setClockInTime(response.attendance.clock_in);
        }
      }
    } catch (error) {
      console.error('Error fetching current status:', error);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  };

  const getLocation = (): Promise<{ lat: number; lng: number; address: string } | null> => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: officeLocation.address
            });
          },
          (error) => {
            console.error('Geolocation error:', error.message);
            reject(new Error('Unable to get your location. Please enable location services.'));
          },
          {
            enableHighAccuracy: false, // Faster - don't need high accuracy
            timeout: 5000, // Reduced from 10s to 5s
            maximumAge: 30000 // Accept cached location up to 30 seconds old
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by your browser.'));
      }
    });
  };

  const verifyLocation = async (lat: number, lng: number): Promise<boolean> => {
    const distance = calculateDistance(lat, lng, officeLocation.lat, officeLocation.lng);
    
    console.log('📍 Location verification:', {
      userLocation: { lat, lng },
      officeLocation: { lat: officeLocation.lat, lng: officeLocation.lng },
      distance: Math.round(distance),
      radius: officeLocation.radius,
      withinRadius: distance <= officeLocation.radius
    });
    
    if (distance > officeLocation.radius) {
      const distanceKm = (distance / 1000).toFixed(2);
      const radiusKm = (officeLocation.radius / 1000).toFixed(1);
      console.error('❌ Location verification failed:', {
        distance: `${distanceKm}km`,
        required: `${radiusKm}km`,
        difference: `${((distance - officeLocation.radius) / 1000).toFixed(2)}km`
      });
      toast.error(`You are ${distanceKm}km away from the office. Please be within ${radiusKm}km to clock in/out.`);
      return false;
    }
    
    console.log('✅ Location verified - within radius');
    return true;
  };

  const handleClockAction = async () => {
    // FIRST: Verify location BEFORE showing face verification
    setIsProcessing(true);
    
    try {
      console.log('🕐 Starting clock action:', isClockedIn ? 'clockout' : 'clockin');
      
      // Get current location
      console.log('📍 Requesting location...');
      const location = await getLocation();
      
      if (!location) {
        console.error('❌ No location returned');
        toast.error('Unable to get your location. Please enable location services.');
        setIsProcessing(false);
        return;
      }

      console.log('📍 Location received:', {
        lat: location.lat,
        lng: location.lng,
        office: { lat: officeLocation.lat, lng: officeLocation.lng },
        radius: officeLocation.radius
      });

      // Verify location is within allowed radius
      const isLocationValid = await verifyLocation(location.lat, location.lng);
      
      if (!isLocationValid) {
        console.error('❌ Location verification failed');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Location verified successfully');

      // Store verified location to avoid re-checking
      setVerifiedLocation({ lat: location.lat, lng: location.lng });

      // Location verified - now show facial recognition
      setPendingAction(isClockedIn ? 'clockout' : 'clockin');
      setShowFaceVerification(true);
      setIsProcessing(false);
      console.log('✅ Showing face verification modal');
    } catch (locationError: any) {
      console.error('❌ Location error:', locationError);
      console.error('Error details:', {
        message: locationError.message,
        code: locationError.code,
        name: locationError.name
      });
      
      let errorMessage = 'Location verification failed. Clock in/out blocked.';
      
      if (locationError.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
      } else if (locationError.code === 2) {
        errorMessage = 'Location unavailable. Please check your device location settings.';
      } else if (locationError.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (locationError.message) {
        errorMessage = locationError.message;
      }
      
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleFaceVerification = async (verified: boolean, matchSimilarity?: number) => {
    console.log('🔐 Face verification callback:', { verified, matchSimilarity, pendingAction });
    setShowFaceVerification(false);
    
    if (!verified) {
      console.log('❌ Face verification failed, aborting clock in/out');
      setIsProcessing(false);
      setPendingAction(null);
      setVerifiedLocation(null); // Clear cached location
      toast.error('Face verification failed. Please try again.');
      return;
    }

    console.log('✅ Face verification successful, proceeding with clock in/out...');
    setIsProcessing(true);

    try {
      // Use cached location (already verified) - no need to re-check
      const location = verifiedLocation 
        ? { lat: verifiedLocation.lat, lng: verifiedLocation.lng }
        : null;

      if (!location) {
        console.warn('⚠️ Cached location missing, fetching fresh location...');
        // Fallback: get location if cache is missing (shouldn't happen)
        try {
          const freshLocation = await getLocation();
          if (freshLocation) {
            const isLocationValid = await verifyLocation(freshLocation.lat, freshLocation.lng);
            if (!isLocationValid) {
              console.error('❌ Fresh location verification failed');
              setIsProcessing(false);
              setPendingAction(null);
              setVerifiedLocation(null);
              return;
            }
            // Use fresh location
            const finalLocation = { lat: freshLocation.lat, lng: freshLocation.lng };
            
            // Perform clock in/out
            if (pendingAction === 'clockout') {
              console.log('🕐 Attempting clock out with fresh location...');
              const response = await attendanceAPI.clockOut(finalLocation.lat, finalLocation.lng);
              console.log('🕐 Clock out response:', response);
              if (response && response.success) {
                setIsClockedIn(false);
                setClockInTime(null);
                toast.success(`✅ ${response.message || 'Successfully clocked out! Have a great day.'} (AI Verified: ${matchSimilarity ? (matchSimilarity * 100).toFixed(1) : 'N/A'}% match)`);
                if (onStatusChange) onStatusChange();
              } else {
                const errorMsg = response?.message || (response as any)?.error || 'Failed to clock out. Please try again.';
                console.error('❌ Clock out failed:', errorMsg);
                toast.error(errorMsg);
              }
            } else {
              console.log('🕐 Attempting clock in with fresh location...');
              const response = await attendanceAPI.clockIn(finalLocation.lat, finalLocation.lng);
              console.log('🕐 Clock in response:', response);
              if (response && response.success) {
                setIsClockedIn(true);
                if (response.attendance?.clock_in) {
                  setClockInTime(response.attendance.clock_in);
                }
                toast.success(`✅ ${response.message || 'Successfully clocked in! Welcome to Initium Venture Solution.'} (AI Verified: ${matchSimilarity ? (matchSimilarity * 100).toFixed(1) : 'N/A'}% match)`);
                if (onStatusChange) onStatusChange();
              } else {
                const errorMsg = response?.message || (response as any)?.error || 'Failed to clock in. Please try again.';
                console.error('❌ Clock in failed:', errorMsg);
                toast.error(errorMsg);
              }
            }
          } else {
            console.error('❌ No location available');
            toast.error('Location is required. Clock in/out blocked.');
            setIsProcessing(false);
            setPendingAction(null);
            setVerifiedLocation(null);
            return;
          }
        } catch (locationError: any) {
          console.error('❌ Location error in fallback:', locationError);
          toast.error(locationError.message || 'Location verification failed. Clock in/out blocked.');
          setIsProcessing(false);
          setPendingAction(null);
          setVerifiedLocation(null);
          return;
        }
      } else {
        // Use cached location - much faster!
        console.log('📍 Using cached location:', location);
        // Perform clock in/out
        if (pendingAction === 'clockout') {
          console.log('🕐 Attempting clock out...');
          try {
            const response = await attendanceAPI.clockOut(location.lat, location.lng);
            console.log('🕐 Clock out response:', response);
            if (response && response.success) {
              setIsClockedIn(false);
              setClockInTime(null);
              toast.success(`✅ ${response.message || 'Successfully clocked out! Have a great day.'} (AI Verified: ${matchSimilarity ? (matchSimilarity * 100).toFixed(1) : 'N/A'}% match)`);
              if (onStatusChange) onStatusChange();
            } else {
              const errorMsg = response?.message || (response as any)?.error || 'Failed to clock out. Please try again.';
              console.error('❌ Clock out failed:', errorMsg);
              toast.error(errorMsg);
            }
          } catch (apiError: any) {
            console.error('❌ Clock out API error:', apiError);
            console.error('Error details:', {
              message: apiError.message,
              response: apiError.response,
              stack: apiError.stack
            });
            const errorMsg = apiError.message || apiError.response?.data?.error || 'Failed to clock out. Please check your connection and try again.';
            toast.error(errorMsg);
          }
        } else {
          console.log('🕐 Attempting clock in...');
          try {
            const response = await attendanceAPI.clockIn(location.lat, location.lng);
            console.log('🕐 Clock in response:', response);
            if (response && response.success) {
              setIsClockedIn(true);
              if (response.attendance?.clock_in) {
                setClockInTime(response.attendance.clock_in);
              }
              toast.success(`✅ ${response.message || 'Successfully clocked in! Welcome to Initium Venture Solution.'} (AI Verified: ${matchSimilarity ? (matchSimilarity * 100).toFixed(1) : 'N/A'}% match)`);
              if (onStatusChange) onStatusChange();
            } else {
              const errorMsg = response?.message || (response as any)?.error || 'Failed to clock in. Please try again.';
              console.error('❌ Clock in failed:', errorMsg);
              toast.error(errorMsg);
            }
          } catch (apiError: any) {
            console.error('❌ Clock in API error:', apiError);
            console.error('Error details:', {
              message: apiError.message,
              response: apiError.response,
              stack: apiError.stack
            });
            const errorMsg = apiError.message || apiError.response?.data?.error || 'Failed to clock in. Please check your connection and try again.';
            toast.error(errorMsg);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Clock action error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response
      });
      const errorMsg = error.message || error.response?.data?.error || 'An error occurred. Please try again.';
      toast.error(errorMsg);
    } finally {
      console.log('🏁 Clock action completed, cleaning up...');
      setIsProcessing(false);
      setPendingAction(null);
      setVerifiedLocation(null); // Clear cache after use
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-400" />
        Clock In/Out
      </h3>

      {/* Current Time */}
      <div className="text-center mb-8">
        <div className="text-4xl font-bold text-white mb-2">
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
        <div className="text-gray-400">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className={`flex items-center justify-center p-4 rounded-xl ${
          isClockedIn 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-gray-500/20 border border-gray-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            {isClockedIn ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <p className={`font-semibold ${
                isClockedIn ? 'text-green-400' : 'text-gray-400'
              }`}>
                {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
              </p>
              <p className="text-sm text-gray-400">
                {isClockedIn && clockInTime 
                  ? `Since ${new Date(clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Ready to start your day'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium text-sm">Office Location</p>
            <p className="text-gray-300 text-sm">{officeLocation.address}</p>
            <p className="text-gray-400 text-xs mt-1">
              Location verification is required (within {(officeLocation.radius/1000).toFixed(1)}km radius)
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Coordinates: {officeLocation.lat.toFixed(4)}, {officeLocation.lng.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Clock In/Out Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClockAction}
        disabled={isProcessing || showFaceVerification}
        className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
          isProcessing || showFaceVerification
            ? 'bg-gray-500/50 cursor-not-allowed'
            : isClockedIn
            ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
            : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
        }`}
      >
        {isProcessing ? (
          <>
            <MapPin className="w-5 h-5 mr-2" />
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
            Verifying Location...
          </>
        ) : showFaceVerification ? (
          <>
            <Brain className="w-5 h-5 mr-2" />
            <Camera className="w-5 h-5 mr-2" />
            AI Face Verification Active
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5 mr-2" />
            <Brain className="w-5 h-5 mr-2" />
            <Camera className="w-5 h-5 mr-2" />
            {isClockedIn ? 'Clock Out (Location + AI Verified)' : 'Clock In (Location + AI Verified)'}
          </>
        )}
      </motion.button>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
        <div className="flex items-start space-x-3">
          <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white mb-1">AI-Powered Security</p>
            <p className="text-xs text-gray-300">
              This system uses advanced AI facial recognition and location verification for secure clock in/out. 
              <strong className="text-yellow-400"> Location is verified first</strong>, then your identity is verified using neural networks.
            </p>
            <p className="text-xs text-yellow-300 mt-1">
              ⚠️ You must be at the office location (set by admin) to clock in/out.
            </p>
          </div>
        </div>
      </div>

      {/* AI Face Verification Modal */}
      {showFaceVerification && (
        <AIFaceVerification
          onVerify={handleFaceVerification}
          onCancel={() => {
            setShowFaceVerification(false);
            setPendingAction(null);
            setIsProcessing(false);
            setVerifiedLocation(null);
          }}
          purpose={pendingAction === 'clockin' ? 'clockin' : 'clockout'}
        />
      )}
    </div>
  );
};