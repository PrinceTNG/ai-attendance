// AI Face Detection Utility using face-api.js
// This provides real AI-powered facial recognition

let faceapi: any = null;
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Model URLs - using official GitHub raw files
// These are the pre-trained AI models for face detection and recognition
const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Load all required models
export const loadFaceAPIModels = async (): Promise<boolean> => {
  if (modelsLoaded) {
    return true;
  }

  if (loadingPromise) {
    return loadingPromise.then(() => true);
  }

  loadingPromise = (async () => {
    try {
      // Dynamically import face-api.js
      const faceapiModule = await import('face-api.js');
      faceapi = faceapiModule.default || faceapiModule;

      if (!faceapi || !faceapi.nets) {
        console.error('face-api.js not properly loaded');
        return;
      }

      console.log('Loading AI face recognition models...');

      // Load all required models
      await Promise.all([
        // Tiny Face Detector - lightweight and fast
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        // Face Landmark 68 - for detecting facial features
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        // Face Recognition - for generating face descriptors
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      console.log('✅ AI face recognition models loaded successfully');
    } catch (error) {
      console.error('❌ Error loading face-api models:', error);
      // Try alternative CDN
      try {
        const ALTERNATIVE_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(ALTERNATIVE_MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(ALTERNATIVE_MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(ALTERNATIVE_MODEL_URL),
        ]);
        modelsLoaded = true;
        console.log('✅ AI models loaded from alternative CDN');
      } catch (altError) {
        console.error('❌ Failed to load models from alternative CDN:', altError);
        modelsLoaded = false;
      }
    }
  })();

  return loadingPromise.then(() => modelsLoaded);
};

// Detect face and extract descriptor using AI
export const detectFaceWithAI = async (
  videoElement: HTMLVideoElement
): Promise<number[] | null> => {
  if (!modelsLoaded || !faceapi) {
    console.log('📦 Models not loaded, loading now...');
    const loaded = await loadFaceAPIModels();
    if (!loaded) {
      console.error('❌ AI models not loaded, cannot perform face detection');
      return null;
    }
    console.log('✅ Models loaded successfully');
  }

  try {
    console.log('🔍 Starting face detection with AI...');
    // Use AI to detect face - optimized for maximum speed
    // Using smaller inputSize and lower threshold for fastest processing
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
        inputSize: 160, // Smaller for faster processing (was 224)
        scoreThreshold: 0.3 // Lower threshold for faster detection (was 0.4)
      }))
      .withFaceLandmarks() // Detect facial landmarks (eyes, nose, mouth, etc.)
      .withFaceDescriptor(); // Generate 128-dimensional face descriptor

    if (detection) {
      console.log('✅ Face detected, extracting descriptor...');
      // Extract the face descriptor (128 numbers representing the face)
      const descriptor = Array.from(detection.descriptor);
      
      // Verify descriptor quality
      if (descriptor.length === 128 && descriptor.every(val => !isNaN(val) && isFinite(val))) {
        console.log('✅ Valid descriptor extracted (128 dimensions)');
        return descriptor;
      } else {
        console.error('❌ Invalid descriptor:', {
          length: descriptor.length,
          hasNaN: descriptor.some(val => isNaN(val)),
          hasInfinite: descriptor.some(val => !isFinite(val))
        });
        return null;
      }
    } else {
      console.warn('⚠️ No face detected in video frame');
      return null;
    }
  } catch (error: any) {
    console.error('❌ Face detection error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
};

// Detect multiple faces (for future use)
export const detectAllFacesWithAI = async (
  videoElement: HTMLVideoElement
): Promise<Array<{ descriptor: number[]; box: any }> | null> => {
  if (!modelsLoaded || !faceapi) {
    const loaded = await loadFaceAPIModels();
    if (!loaded) {
      return null;
    }
  }

  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections && detections.length > 0) {
      return detections.map((detection: any) => ({
        descriptor: Array.from(detection.descriptor),
        box: detection.detection.box
      }));
    }
    return null;
  } catch (error) {
    console.error('AI multi-face detection error:', error);
    return null;
  }
};

// Calculate similarity between two face descriptors (for face matching)
export const calculateFaceSimilarity = (
  descriptor1: number[],
  descriptor2: number[]
): number => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== 128 || descriptor2.length !== 128) {
    return 0;
  }

  try {
    // Calculate Euclidean distance (same as face-api.js)
    let sumSquaredDiff = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sumSquaredDiff += diff * diff;
    }
    const euclideanDistance = Math.sqrt(sumSquaredDiff);
    
    // Convert distance to similarity (0-1 scale, higher is more similar)
    // face-api.js threshold: < 0.6 distance means same person
    // We convert to similarity where 1 = identical, 0 = completely different
    const similarity = 1 / (1 + euclideanDistance);
    return similarity;
  } catch (error) {
    console.error('Error calculating face similarity:', error);
    return 0;
  }
};

// Check if models are loaded
export const areModelsLoaded = (): boolean => {
  return modelsLoaded;
};

// Get loading progress (for UI feedback)
export const getModelLoadingStatus = (): { loaded: boolean; loading: boolean } => {
  return {
    loaded: modelsLoaded,
    loading: loadingPromise !== null && !modelsLoaded
  };
};

// Get full face detection with landmarks (for quality assessment)
export const detectFaceWithLandmarks = async (
  videoElement: HTMLVideoElement
): Promise<any | null> => {
  if (!modelsLoaded || !faceapi) {
    const loaded = await loadFaceAPIModels();
    if (!loaded) {
      return null;
    }
  }

  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: 0.3
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection;
  } catch (error) {
    console.error('Error detecting face with landmarks:', error);
    return null;
  }
};

// Enhanced face detection with confidence scoring
export const detectFaceWithConfidence = async (
  videoElement: HTMLVideoElement,
  minConfidence: number = 0.5
): Promise<{ descriptor: number[]; confidence: number } | null> => {
  if (!modelsLoaded || !faceapi) {
    const loaded = await loadFaceAPIModels();
    if (!loaded) {
      return null;
    }
  }

  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
        inputSize: 160,
        scoreThreshold: minConfidence
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const descriptor = Array.from(detection.descriptor);
      const confidence = detection.detection.score || 0.5;
      
      if (descriptor.length === 128 && confidence >= minConfidence) {
        return {
          descriptor,
          confidence
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Enhanced face detection error:', error);
    return null;
  }
};
