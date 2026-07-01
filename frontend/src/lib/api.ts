const API_URL = 'https://saas-project-deog.onrender.com/api';

import { toast } from '@/lib/toast';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  getUser,
  saveLogin,
} from '@/lib/auth';

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
  _isRetry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      const user = getUser();
      if (!refreshToken || !user) return null;

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, refreshToken }),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
      };
      saveLogin(data);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options.token
        ? { Authorization: `Bearer ${options.token}` }
        : {}),
    },
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });

  if (response.status === 401 && !options._isRetry) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return request<T>(endpoint, {
        ...options,
        token: newToken,
        _isRetry: true,
      });
    }
    clearAuth();
    toast.error('Сессия истекла. Войдите снова.');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Сессия истекла');
  }

  if (!response.ok) {
    let message = 'Ошибка запроса';
    try {
      const error = (await response.json()) as { message?: string };
      message = error.message || message;
    } catch {}

    if (response.status === 403) {
      toast.error('У вас нет прав для выполнения этого действия.');
    } else if (response.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.');
    } else {
      toast.error(message);
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function downloadBlob(endpoint: string, token: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      toast.error('Сессия истекла. Войдите снова.');
      if (typeof window !== 'undefined') window.location.href = '/login';
    } else {
      toast.error('Не удалось скачать файл');
    }
    throw new Error('Download failed');
  }

  return response.blob();
}

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    organizationId: string;
  }) =>
    request('/auth/register', { method: 'POST', body: data }),

  registerOrganization: (data: {
    organizationName: string;
    email: string;
    password: string;
  }) =>
    request('/auth/register-organization', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: data }),

  refresh: (data: { userId: string; refreshToken: string }) =>
    request('/auth/refresh', { method: 'POST', body: data }),

  forgotPassword: (data: { email: string }) =>
    request('/auth/forgot-password', { method: 'POST', body: data }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    request('/auth/reset-password', { method: 'POST', body: data }),

  me: (token: string) => request('/auth/me', { token }),

  verifyTwoFactor: (data: { challengeId: string; code: string }) =>
    request('/auth/verify-2fa', { method: 'POST', body: data }),

  enableTwoFactor: (token: string) =>
    request('/auth/2fa/enable', { method: 'POST', token }),

  disableTwoFactor: (token: string) =>
    request('/auth/2fa/disable', { method: 'POST', token }),

  logout: (token: string) =>
    request('/auth/logout', { method: 'POST', token }),
};

export const dashboardApi = {
  getDashboard: (token: string) => request('/dashboard', { token }),
};

export const clientsApi = {
  getAll: (token: string) => request('/clients', { token }),
  getById: (id: string, token: string) => request(`/clients/${id}`, { token }),
  create: (data: unknown, token: string) =>
    request('/clients', { method: 'POST', token, body: data }),
  update: (id: string, data: unknown, token: string) =>
    request(`/clients/${id}`, { method: 'PUT', token, body: data }),
  remove: (id: string, token: string) =>
    request(`/clients/${id}`, { method: 'DELETE', token }),
};

export const casesApi = {
  getAll: (token: string) => request('/cases', { token }),
  getById: (id: string, token: string) => request(`/cases/${id}`, { token }),
  getBoard: (token: string) => request('/cases/board', { token }),
  create: (data: unknown, token: string) =>
    request('/cases', { method: 'POST', token, body: data }),
  update: (id: string, data: unknown, token: string) =>
    request(`/cases/${id}`, { method: 'PUT', token, body: data }),
  remove: (id: string, token: string) =>
    request(`/cases/${id}`, { method: 'DELETE', token }),
  move: (caseId: string, stageId: string, token: string) =>
    request(`/cases/move/${caseId}/${stageId}`, { method: 'PUT', token }),
};

export const tasksApi = {
  getAll: (token: string) => request('/tasks', { token }),
  getById: (id: string, token: string) => request(`/tasks/${id}`, { token }),
  create: (data: unknown, token: string) =>
    request('/tasks', { method: 'POST', token, body: data }),
  update: (id: string, data: unknown, token: string) =>
    request(`/tasks/${id}`, { method: 'PUT', token, body: data }),
  complete: (id: string, token: string) =>
    request(`/tasks/${id}/complete`, { method: 'PUT', token }),
  remove: (id: string, token: string) =>
    request(`/tasks/${id}`, { method: 'DELETE', token }),
};

export const documentsApi = {
  getAll: (token: string) => request('/documents', { token }),
  download: (id: string, token: string) =>
    downloadBlob(`/documents/${id}/download`, token),
  remove: (id: string, token: string) =>
    request(`/documents/${id}`, { method: 'DELETE', token }),
  upload: (formData: FormData, token: string) => {
    const caseId = formData.get('caseId') as string | null;
    if (!caseId) {
      return Promise.reject(new Error('Не выбрано дело для документа'));
    }
    return request(`/documents/upload/${caseId}`, {
      method: 'POST',
      token,
      body: formData,
    });
  },
};

export const usersApi = {
  getAll: (token: string) => request('/users', { token }),
  create: (data: { email: string; role?: string }, token: string) =>
    request('/users', { method: 'POST', token, body: data }),
  remove: (id: string, token: string) =>
    request(`/users/${id}`, { method: 'DELETE', token }),
};

export const caseTypesApi = {
  getAll: (token: string) => request('/case-types', { token }),
  create: (data: unknown, token: string) =>
    request('/case-types', { method: 'POST', token, body: data }),
  update: (id: string, data: unknown, token: string) =>
    request(`/case-types/${id}`, { method: 'PUT', token, body: data }),
  remove: (id: string, token: string) =>
    request(`/case-types/${id}`, { method: 'DELETE', token }),
};

export const auditApi = {
  getAll: (token: string) => request('/audit', { token }),
};

export const caseStagesApi = {
  getAll: (token: string) => request('/case-stages', { token }),
  create: (
    data: { name: string; order: number; color?: string },
    token: string,
  ) => request('/case-stages', { method: 'POST', token, body: data }),
  update: (
    id: string,
    data: { name?: string; color?: string },
    token: string,
  ) => request(`/case-stages/${id}`, { method: 'PUT', token, body: data }),
  remove: (id: string, token: string) =>
    request(`/case-stages/${id}`, { method: 'DELETE', token }),
};

export const searchApi = {
  search: (query: string, token: string) =>
    request(`/search?query=${encodeURIComponent(query)}`, { token }),
};

export const notificationsApi = {
  getAll: (token: string) => request('/notifications', { token }),
};

export const billingApi = {
  getPlans: () => request('/billing/plans'),
  getSubscription: (token: string) =>
    request('/billing/subscription', { token }),
  createCheckout: (planId: string, token: string) =>
    request('/billing/checkout', { method: 'POST', token, body: { planId } }),
  createPortal: (token: string) =>
    request('/billing/portal', { method: 'POST', token }),
};

export const adminApi = {
  getOrganizations: (token: string) =>
    request('/admin/organizations', { token }),
  grantOverride: (
    organizationId: string,
    data: { reason?: string; expiresAt?: string },
    token: string,
  ) =>
    request(`/admin/organizations/${organizationId}/override`, {
      method: 'POST',
      token,
      body: data,
    }),
  revokeOverride: (organizationId: string, token: string) =>
    request(`/admin/organizations/${organizationId}/override`, {
      method: 'DELETE',
      token,
    }),
  deleteOrganization: (organizationId: string, token: string) =>
    request(`/admin/organizations/${organizationId}`, {
      method: 'DELETE',
      token,
    }),
};

export const calendarApi = {
  getAll: (token: string) => request('/calendar', { token }),
  getById: (id: string, token: string) => request(`/calendar/${id}`, { token }),
  create: (
    data: { title: string; description?: string; date: string; caseId?: string },
    token: string,
  ) => request('/calendar', { method: 'POST', token, body: data }),
  update: (
    id: string,
    data: { title?: string; description?: string; date?: string; caseId?: string },
    token: string,
  ) => request(`/calendar/${id}`, { method: 'PUT', token, body: data }),
  remove: (id: string, token: string) =>
    request(`/calendar/${id}`, { method: 'DELETE', token }),
};
