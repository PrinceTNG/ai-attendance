import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';

export type UserRole = 'admin' | 'employee' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  facialDescriptors?: number[] | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithFace: (facialData: number[]) => Promise<{ success: boolean; message: string; user?: User }>;
  signup: (userData: { email: string; password: string; name: string; role: UserRole; facialDescriptors?: number[] }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isLoggingInRef = useRef(false); // Prevent multiple simultaneous login attempts

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        // Ensure facialDescriptors are properly parsed if stored as string
        if (userData.facialDescriptors && typeof userData.facialDescriptors === 'string') {
          try {
            userData.facialDescriptors = JSON.parse(userData.facialDescriptors);
          } catch (parseError) {
            console.error('Error parsing stored facialDescriptors:', parseError);
            userData.facialDescriptors = null;
          }
        }
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ User loaded from localStorage:', {
          email: userData.email,
          hasFacialDescriptors: !!userData.facialDescriptors,
          descriptorsLength: userData.facialDescriptors?.length
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.user && response.token) {
        // Ensure facialDescriptors are properly parsed
        let facialDescriptors = response.user.facialDescriptors;
        if (facialDescriptors && typeof facialDescriptors === 'string') {
          try {
            facialDescriptors = JSON.parse(facialDescriptors);
          } catch (parseError) {
            console.error('Error parsing facialDescriptors from login:', parseError);
            facialDescriptors = null;
          }
        }
        
        const userData: User = {
          id: response.user.id.toString(),
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          facialDescriptors: facialDescriptors,
          createdAt: response.user.createdAt || response.user.created_at
        };
        
        console.log('✅ Login successful, user data:', {
          email: userData.email,
          hasFacialDescriptors: !!userData.facialDescriptors,
          descriptorsLength: userData.facialDescriptors?.length
        });
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.token);
        
        return { success: true, message: response.message || 'Login successful', user: userData };
      }
      
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed. Please try again.' };
    }
  };

  const loginWithFace = async (facialData: number[]): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      // Prevent multiple simultaneous login attempts
      if (isLoggingInRef.current) {
        console.log('⚠️ Login already in progress, skipping duplicate request');
        return { success: false, message: 'Login already in progress' };
      }
      
      if (isAuthenticated) {
        console.log('⚠️ Already authenticated, skipping face login');
        return { success: true, message: 'Already logged in', user: user || undefined };
      }
      
      isLoggingInRef.current = true;
      console.log('🤖 Attempting facial recognition login...');
      
      // Validate facial data
      if (!facialData || facialData.length !== 128) {
        isLoggingInRef.current = false;
        return { success: false, message: 'Invalid facial data. Please try again.' };
      }
      
      const response = await authAPI.loginWithFace(facialData);
      
      if (response.success && response.user && response.token) {
        // Ensure facialDescriptors are properly parsed
        let facialDescriptors = response.user.facialDescriptors;
        if (facialDescriptors && typeof facialDescriptors === 'string') {
          try {
            facialDescriptors = JSON.parse(facialDescriptors);
          } catch (parseError) {
            console.error('Error parsing facialDescriptors from face login:', parseError);
            facialDescriptors = null;
          }
        }
        
        const userData: User = {
          id: response.user.id.toString(),
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          facialDescriptors: facialDescriptors,
          createdAt: response.user.createdAt || response.user.created_at
        };
        
        console.log('✅ Facial recognition login successful:', userData.email);
        console.log('User data:', {
          email: userData.email,
          hasFacialDescriptors: !!userData.facialDescriptors,
          descriptorsLength: userData.facialDescriptors?.length
        });
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.token);
        
        isLoggingInRef.current = false;
        return { success: true, message: response.message || 'Facial recognition successful', user: userData };
      }
      
      // Enhanced error message
      const errorMsg = response.error || response.message || 'Face not recognized';
      console.log('❌ Facial recognition failed:', errorMsg);
      isLoggingInRef.current = false;
      return { success: false, message: errorMsg };
    } catch (error: any) {
      console.error('Facial login error:', error);
      const errorMessage = error.message || error.error || 'Face not recognized. Please try traditional login.';
      isLoggingInRef.current = false;
      return { success: false, message: errorMessage };
    }
  };

  const signup = async (userData: { email: string; password: string; name: string; role: UserRole; facialDescriptors?: number[] }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.signup(userData);
      
      if (response.success && response.user && response.token) {
        const newUser: User = {
          id: response.user.id.toString(),
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          facialDescriptors: response.user.facialDescriptors,
          createdAt: response.user.createdAt || response.user.created_at
        };
        
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', response.token);
        
        return { success: true, message: response.message || 'Registration successful' };
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    loginWithFace,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};