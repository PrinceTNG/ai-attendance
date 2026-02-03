const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      console.error(`❌ API Error (${response.status}):`, errorData);
      const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
    }

    const data = await response.json();
    console.log(`✅ API Response: ${endpoint}`, data);
    return data;
  } catch (error: any) {
    console.error(`❌ API Request failed: ${endpoint}`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  signup: async (data: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'employee' | 'student';
    facialDescriptors?: number[];
  }) => {
    return apiRequest<{ success: boolean; message: string; token: string; user: any }>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  login: async (email: string, password: string) => {
    return apiRequest<{ success: boolean; message: string; token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  },

  loginWithFace: async (facialDescriptors: number[]) => {
    // Validate descriptor
    if (!facialDescriptors || facialDescriptors.length !== 128) {
      throw new Error('Invalid facial descriptor. Must be 128-dimensional array.');
    }
    
    return apiRequest<{ success: boolean; message: string; token: string; user: any; error?: string }>(
      '/auth/login/face',
      {
        method: 'POST',
        body: JSON.stringify({ facialDescriptors }),
      }
    );
  },

  getProfile: async () => {
    return apiRequest<{ user: any }>('/auth/profile');
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    department?: string;
    facialDescriptors?: number[];
  }) => {
    return apiRequest<{ success: boolean; message: string; user: any }>(
      '/auth/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },
};

// Attendance API
export const attendanceAPI = {
  clockIn: async (latitude?: number, longitude?: number) => {
    return apiRequest<{ success: boolean; message: string; attendance: any }>(
      '/attendance/clock-in',
      {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      }
    );
  },

  clockOut: async (latitude?: number, longitude?: number) => {
    return apiRequest<{ success: boolean; message: string; attendance: any }>(
      '/attendance/clock-out',
      {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      }
    );
  },

  getHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);

    const queryString = queryParams.toString();
    return apiRequest<{ attendance: any[] }>(
      `/attendance/history${queryString ? `?${queryString}` : ''}`
    );
  },

  getTodayStatus: async () => {
    return apiRequest<{ attendance: any }>('/attendance/today');
  },

  getStats: async (params?: { startDate?: string; endDate?: string; userId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.userId) queryParams.append('userId', params.userId);

    const queryString = queryParams.toString();
    return apiRequest<{ stats: any }>(
      `/attendance/stats${queryString ? `?${queryString}` : ''}`
    );
  },
};

// Users API
export const usersAPI = {
  getAll: async (params?: { role?: string; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return apiRequest<{ users: any[] }>(`/users${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ user: any }>(`/users/${id}`);
  },

  create: async (data: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'employee' | 'student';
    phone?: string;
    department?: string;
  }) => {
    return apiRequest<{ success: boolean; message: string; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    phone?: string;
    department?: string;
    password?: string;
  }) => {
    return apiRequest<{ success: boolean; message: string; user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (id: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    return apiRequest<{ stats: any }>(
      `/users/${id}/stats${queryString ? `?${queryString}` : ''}`
    );
  },
};

// Reports API
export const reportsAPI = {
  generateAttendanceSummary: async (data: {
    periodStart: string;
    periodEnd: string;
    role?: string;
    fileType?: 'pdf' | 'csv';
  }) => {
    return apiRequest<{ success: boolean; message: string; filePath: string; summary: any }>(
      '/reports/attendance-summary',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  generateHoursReport: async (data: {
    periodStart: string;
    periodEnd: string;
    role?: string;
    fileType?: 'pdf' | 'csv';
  }) => {
    return apiRequest<{ success: boolean; message: string; filePath: string; users: any[] }>(
      '/reports/hours-report',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  getRecent: async () => {
    return apiRequest<{ reports: any[] }>('/reports/recent');
  },

  download: (filename: string) => {
    const token = getAuthToken();
    return `${API_BASE_URL}/reports/download/${filename}${token ? `?token=${token}` : ''}`;
  },
};

// AI API with enhanced features
export const aiAPI = {
  chat: async (messageOrAction: string, isAction: boolean = false) => {
    const body = isAction 
      ? { action: messageOrAction }
      : { message: messageOrAction };
    
    return apiRequest<{
      success: boolean;
      intent?: string;
      message?: string;
      actions?: Array<{ label: string; action: string }>;
      data?: any;
      insights?: string[];
      stats?: any;
      suggestions?: string[];
      sentiment?: { sentiment: string; confidence: number };
      aiInsights?: string[];
      aiPredictions?: any[];
      anomalies?: { hasAnomalies: boolean; anomalies: any[] };
      requiresConfirmation?: boolean;
      requiresInput?: boolean;
      [key: string]: any;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Get AI-powered predictions
  getPredictions: async () => {
    return apiRequest<{
      success: boolean;
      predictions: any[];
      dataPoints: number;
      aiModel: string;
    }>('/ai/predictions');
  },

  // Detect anomalies in attendance
  getAnomalies: async () => {
    return apiRequest<{
      success: boolean;
      hasAnomalies: boolean;
      anomalies: any[];
      analyzedRecords: number;
      aiModel: string;
    }>('/ai/anomalies');
  },

  // Get productivity insights
  getInsights: async (period: 'week' | 'month' | 'quarter' = 'month') => {
    return apiRequest<{
      success: boolean;
      insights: string[];
      period: string;
      dataPoints: number;
      aiModel: string;
    }>(`/ai/insights?period=${period}`);
  },

  // Analyze sentiment
  analyzeSentiment: async (text: string) => {
    return apiRequest<{
      success: boolean;
      sentiment: string;
      confidence: number;
      aiModel: string;
    }>('/ai/sentiment', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Get smart AI notifications
  getSmartNotifications: async () => {
    return apiRequest<{
      success: boolean;
      notifications: any[];
      aiModel: string;
    }>('/ai/smart-notifications');
  },

  // Get admin dashboard AI stats
  getDashboardStats: async () => {
    return apiRequest<{
      success: boolean;
      stats: any;
      weeklyTrend: any[];
      aiInsights: string[];
      anomalies: any;
      aiModel: string;
    }>('/ai/dashboard-stats');
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (unreadOnly?: boolean) => {
    const queryParams = unreadOnly ? '?unreadOnly=true' : '';
    return apiRequest<{ notifications: any[] }>(`/notifications${queryParams}`);
  },

  markAsRead: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return apiRequest<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  },

  getUnreadCount: async () => {
    return apiRequest<{ count: number }>('/notifications/unread-count');
  },
};

// Leave Requests API
export const leaveAPI = {
  getAll: async (params?: { status?: string; userId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);

    const queryString = queryParams.toString();
    return apiRequest<{ success: boolean; requests: any[] }>(
      `/leave${queryString ? `?${queryString}` : ''}`
    );
  },

  create: async (data: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
    documentUrl?: string;
  }) => {
    return apiRequest<{ success: boolean; message: string; request: any }>(
      '/leave',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  approve: async (id: string) => {
    return apiRequest<{ success: boolean; message: string; request: any }>(
      `/leave/${id}/approve`,
      {
        method: 'PUT',
      }
    );
  },

  reject: async (id: string, rejectionReason?: string) => {
    return apiRequest<{ success: boolean; message: string; request: any }>(
      `/leave/${id}/reject`,
      {
        method: 'PUT',
        body: JSON.stringify({ rejectionReason }),
      }
    );
  },

  cancel: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(
      `/leave/${id}/cancel`,
      {
        method: 'PUT',
      }
    );
  },
};

// Schedule API
export const scheduleAPI = {
  getSchedules: async () => {
    return apiRequest<{ success: boolean; schedules: any[]; groupedSchedules: any }>('/schedule');
  },

  getAllSchedules: async () => {
    return apiRequest<{ success: boolean; schedules: any[] }>('/schedule/all');
  },

  createSchedule: async (data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject?: string;
    description?: string;
    location?: string;
    appliesTo?: string;
  }) => {
    return apiRequest<{ success: boolean; message: string; schedule: any }>('/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSchedule: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; message: string; schedule: any }>(`/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSchedule: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/schedule/${id}`, {
      method: 'DELETE',
    });
  },

  bulkUpdateSchedules: async (schedules: any[]) => {
    return apiRequest<{ success: boolean; message: string; schedules: any[] }>('/schedule/bulk', {
      method: 'PUT',
      body: JSON.stringify({ schedules }),
    });
  },
};

export default {
  auth: authAPI,
  attendance: attendanceAPI,
  users: usersAPI,
  reports: reportsAPI,
  ai: aiAPI,
  notifications: notificationsAPI,
  leave: leaveAPI,
  schedule: scheduleAPI,
};
