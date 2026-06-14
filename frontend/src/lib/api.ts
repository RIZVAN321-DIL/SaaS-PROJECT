const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api';

import { toast } from '@/lib/toast';
import { clearAuth } from '@/lib/auth';

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: options.method || 'GET',

      headers: {
        'Content-Type': 'application/json',

        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : {}),
      },

      body: options.body
        ? JSON.stringify(options.body)
        : undefined,
    },
  );

  // =========================
  // GLOBAL ERROR HANDLING
  // =========================
  if (!response.ok) {
    let message = 'Request failed';

    try {
      const error = await response.json();
      message = error.message || message;
    } catch {}

    // =========================
    // AUTO LOGOUT (401)
    // =========================
    if (response.status === 401) {
      clearAuth();
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      throw new Error(message);
    }

    if (response.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }

    throw new Error(message);
  }

  return response.json();
}

// =========================
// AUTH
// =========================

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    organizationId: string;
  }) =>
    request('/auth/register', {
      method: 'POST',
      body: data,
    }),

  login: (data: {
    email: string;
    password: string;
  }) =>
    request('/auth/login', {
      method: 'POST',
      body: data,
    }),

  refresh: (data: {
    userId: string;
    refreshToken: string;
  }) =>
    request('/auth/refresh', {
      method: 'POST',
      body: data,
    }),
};

// =========================
// DASHBOARD
// =========================

export const dashboardApi = {
  getDashboard: (organizationId: string, token: string) =>
    request(`/dashboard/${organizationId}`, {
      token,
    }),
};

// =========================
// CLIENTS
// =========================

export const clientsApi = {
  getAll: (token: string) =>
    request('/clients', { token }),

  getById: (id: string, token: string) =>
    request(`/clients/${id}`, { token }),

  create: (data: unknown, token: string) =>
    request('/clients', {
      method: 'POST',
      token,
      body: data,
    }),

  update: (id: string, data: unknown, token: string) =>
    request(`/clients/${id}`, {
      method: 'PUT',
      token,
      body: data,
    }),

  remove: (id: string, token: string) =>
    request(`/clients/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// =========================
// CASES
// =========================

export const casesApi = {
  getAll: (token: string) =>
    request('/cases', { token }),

  getBoard: (token: string) =>
    request('/cases/board', { token }),

  create: (data: unknown, token: string) =>
    request('/cases', {
      method: 'POST',
      token,
      body: data,
    }),

  update: (id: string, data: unknown, token: string) =>
    request(`/cases/${id}`, {
      method: 'PUT',
      token,
      body: data,
    }),

  remove: (id: string, token: string) =>
    request(`/cases/${id}`, {
      method: 'DELETE',
      token,
    }),

  move: (caseId: string, stageId: string, token: string) =>
    request(`/cases/move/${caseId}/${stageId}`, {
      method: 'PUT',
      token,
    }),
};

// =========================
// TASKS
// =========================

export const tasksApi = {
  getAll: (token: string) =>
    request('/tasks', { token }),

  create: (data: unknown, token: string) =>
    request('/tasks', {
      method: 'POST',
      token,
      body: data,
    }),

  update: (id: string, data: unknown, token: string) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      token,
      body: data,
    }),

  complete: (id: string, token: string) =>
    request(`/tasks/${id}/complete`, {
      method: 'PUT',
      token,
    }),
};

// =========================
// DOCUMENTS
// =========================

export const documentsApi = {
  getAll: (token: string) =>
    request('/documents', { token }),

  remove: (id: string, token: string) =>
    request(`/documents/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// =========================
// USERS
// =========================

export const usersApi = {
  getAll: (token: string) =>
    request('/users', { token }),
};

// =========================
// CASE TYPES
// =========================

export const caseTypesApi = {
  getAll: (token: string) =>
    request('/case-types', { token }),
};

export { API_URL };
