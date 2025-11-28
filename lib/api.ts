/**
 * API Client for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
}

// Set auth token in localStorage
function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

// Remove auth token from localStorage
function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

// Make API request with authentication
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      removeToken();
      if (typeof window !== 'undefined') {
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API methods
export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiRequest<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(response.token);
      return response;
    },
    getMe: async () => {
      return apiRequest<any>('/auth/me');
    },
    register: async (userData: { name: string; email: string; password: string; phone?: string }) => {
      // Public registration endpoint (no auth required)
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An error occurred' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    registerAdmin: async (userData: any) => {
      // Admin registration endpoint (requires auth token)
      return apiRequest<any>('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    logout: () => {
      removeToken();
    },
  },

  // Plants
  plants: {
    getAll: async (plantId?: string) => {
      const query = plantId ? `?plantId=${plantId}` : '';
      return apiRequest<any[]>(`/plants${query}`);
    },
    getById: async (id: string) => {
      return apiRequest<any>(`/plants/${id}`);
    },
    create: async (data: { name: string }) => {
      return apiRequest<any>('/plants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: { name: string }) => {
      return apiRequest<any>(`/plants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return apiRequest<{ message: string }>(`/plants/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Lanes
  lanes: {
    getAll: async (plantId?: string) => {
      const query = plantId ? `?plantId=${plantId}` : '';
      return apiRequest<any[]>(`/lanes${query}`);
    },
    getById: async (id: string) => {
      return apiRequest<any>(`/lanes/${id}`);
    },
    create: async (data: any) => {
      return apiRequest<any>('/lanes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return apiRequest<any>(`/lanes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return apiRequest<{ message: string }>(`/lanes/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Checklists
  checklists: {
    getAll: async (plantId?: string) => {
      const query = plantId ? `?plantId=${plantId}` : '';
      return apiRequest<any[]>(`/checklists${query}`);
    },
    getById: async (id: string) => {
      return apiRequest<any>(`/checklists/${id}`);
    },
    create: async (data: any) => {
      return apiRequest<any>('/checklists', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return apiRequest<any>(`/checklists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return apiRequest<{ message: string }>(`/checklists/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Users
  users: {
    getAll: async (plantId?: string) => {
      const query = plantId ? `?plantId=${plantId}` : '';
      return apiRequest<any[]>(`/users${query}`);
    },
    getById: async (id: string) => {
      return apiRequest<any>(`/users/${id}`);
    },
    create: async (data: any) => {
      return apiRequest<any>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return apiRequest<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return apiRequest<{ message: string }>(`/users/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Insights
  insights: {
    get: async (plantId?: string, period: string = 'month') => {
      const query = new URLSearchParams();
      if (plantId && plantId !== 'all') query.append('plantId', plantId);
      query.append('period', period);
      return apiRequest<any>(`/insights?${query.toString()}`);
    },
  },

  // Geofence
  geofence: {
    validate: async (checklistId: string, latitude: number, longitude: number) => {
      return apiRequest<any>('/geofence/validate', {
        method: 'POST',
        body: JSON.stringify({ checklistId, latitude, longitude }),
      });
    },
  },

  // Activities
  activities: {
    getChecklists: async () => {
      return apiRequest<any[]>('/activities/checklists');
    },
    complete: async (data: {
      checklistId: string;
      activityId: string;
      latitude?: number;
      longitude?: number;
      photo?: string;
    }) => {
      return apiRequest<any>('/activities/complete', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};

export { getToken, setToken, removeToken };

