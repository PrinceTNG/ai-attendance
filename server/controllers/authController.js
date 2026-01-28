const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');
const { notifyAdmin } = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// AI-powered facial descriptor similarity calculation
// Uses Euclidean distance (same as face-api.js) for accurate face matching
const calculateFaceSimilarity = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return 0;
  }

  // Ensure descriptors are 128-dimensional (AI face-api.js standard)
  if (descriptor1.length !== 128 || descriptor2.length !== 128) {
    console.warn('Invalid descriptor length. Expected 128, got:', descriptor1.length, descriptor2.length);
    return 0;
  }

  // Calculate Euclidean distance (used by face-api.js)
  let sumSquaredDiff = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sumSquaredDiff += diff * diff;
  }
  const euclideanDistance = Math.sqrt(sumSquaredDiff);

  // Convert distance to similarity score
  // face-api.js threshold: distance < 0.6 means same person
  // We convert to 0-1 scale where 1 = identical, 0 = completely different
  const similarity = 1 / (1 + euclideanDistance);
  
  return similarity;
};

// Register new user
const signup = async (req, res) => {
  try {
    const { email, password, name, role, facialDescriptors } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, facial_descriptors, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        email,
        passwordHash,
        name,
        role || 'employee',
        facialDescriptors ? JSON.stringify(facialDescriptors) : null
      ]
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { userId, email, role: role || 'employee' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Get created user with facial descriptors
    const user = await queryOne(
      'SELECT id, email, name, role, status, facial_descriptors, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Parse facial_descriptors if present (rename to avoid conflict with parameter)
    let parsedFacialDescriptors = null;
    if (user.facial_descriptors) {
      try {
        parsedFacialDescriptors = typeof user.facial_descriptors === 'string' 
          ? JSON.parse(user.facial_descriptors)
          : user.facial_descriptors;
      } catch (parseError) {
        console.error('Error parsing facial_descriptors in signup response:', parseError);
      }
    }

    // Notify admin of new user registration
    await notifyAdmin(
      'New User Registration',
      `${name} (${email}) has registered as ${role || 'employee'}`,
      'info'
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        ...user,
        facialDescriptors: parsedFacialDescriptors
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login with email and password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await queryOne(
      'SELECT id, email, password_hash, name, role, status FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.error(`❌ Login failed for ${email}: Password mismatch`);
      console.error('Stored hash preview:', user.password_hash?.substring(0, 20) + '...');
      console.error('User role:', user.role);
      console.error('User status:', user.status);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ Login successful: ${email} (${user.role})`);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Login with facial recognition
const loginWithFace = async (req, res) => {
  try {
    const { facialDescriptors } = req.body;

    if (!facialDescriptors || !Array.isArray(facialDescriptors)) {
      return res.status(400).json({ error: 'Facial descriptors are required' });
    }

    // Get all users with facial descriptors
    const users = await query(
      'SELECT id, email, name, role, status, facial_descriptors FROM users WHERE facial_descriptors IS NOT NULL AND status = \'active\''
    );

    let bestMatch = null;
    let bestSimilarity = 0;
    // AI face recognition threshold: Lowered for easier matching
    // face-api.js uses distance < 0.6 for same person
    // We use 0.55 similarity (equivalent to ~0.82 distance) for more lenient matching
    const SIMILARITY_THRESHOLD = 0.55; // Lowered threshold for easier login

    // Find best matching user using AI-powered face recognition
    for (const user of users) {
      try {
        const storedDescriptors = JSON.parse(user.facial_descriptors);
        
        // Verify descriptor format
        if (!Array.isArray(storedDescriptors) || storedDescriptors.length !== 128) {
          console.warn(`Invalid descriptor format for user ${user.email}`);
          continue;
        }

        // Calculate similarity using AI-optimized algorithm
        const similarity = calculateFaceSimilarity(facialDescriptors, storedDescriptors);
        
        console.log(`Face match with ${user.email}: ${(similarity * 100).toFixed(2)}% similarity`);

        if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
          bestSimilarity = similarity;
          bestMatch = user;
        }
      } catch (error) {
        console.error(`Error processing face descriptor for user ${user.email}:`, error);
        continue;
      }
    }

    if (!bestMatch) {
      console.log(`❌ Face recognition failed. Best similarity: ${(bestSimilarity * 100).toFixed(2)}% (threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%)`);
      return res.status(401).json({ 
        error: `Face not recognized. Best match: ${bestSimilarity > 0 ? (bestSimilarity * 100).toFixed(1) + '%' : 'No match found'}. Please ensure you're using the same account you signed up with, or try traditional login.`,
        bestSimilarity: bestSimilarity > 0 ? (bestSimilarity * 100).toFixed(2) + '%' : 'No match found',
        threshold: (SIMILARITY_THRESHOLD * 100).toFixed(0) + '%'
      });
    }

    console.log(`✅ AI face recognition successful: ${bestMatch.email} (${(bestSimilarity * 100).toFixed(2)}% match)`);

    // Generate token
    const token = jwt.sign(
      { userId: bestMatch.id, email: bestMatch.email, role: bestMatch.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Parse facial_descriptors for response (rename to avoid conflict with parameter)
    let parsedFacialDescriptors = null;
    if (bestMatch.facial_descriptors) {
      try {
        parsedFacialDescriptors = typeof bestMatch.facial_descriptors === 'string' 
          ? JSON.parse(bestMatch.facial_descriptors)
          : bestMatch.facial_descriptors;
      } catch (parseError) {
        console.error('Error parsing facial_descriptors in login response:', parseError);
      }
    }

    res.json({
      success: true,
      message: 'Facial recognition successful',
      token,
      user: {
        id: bestMatch.id,
        email: bestMatch.email,
        name: bestMatch.name,
        role: bestMatch.role,
        status: bestMatch.status,
        facialDescriptors: parsedFacialDescriptors
      }
    });
  } catch (error) {
    console.error('Facial login error:', error);
    res.status(500).json({ error: 'Facial recognition failed' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT id, email, name, role, status, avatar_url, phone, department, facial_descriptors, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse facial_descriptors if it's a JSON string
    if (user.facial_descriptors && typeof user.facial_descriptors === 'string') {
      try {
        user.facial_descriptors = JSON.parse(user.facial_descriptors);
      } catch (parseError) {
        console.error('Error parsing facial_descriptors:', parseError);
        user.facial_descriptors = null;
      }
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, department, facialDescriptors } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (facialDescriptors) {
      updates.push('facial_descriptors = ?');
      values.push(JSON.stringify(facialDescriptors));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedUser = await queryOne(
      'SELECT id, email, name, role, status, avatar_url, phone, department FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  signup,
  login,
  loginWithFace,
  getProfile,
  updateProfile
};
