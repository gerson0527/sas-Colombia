const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Session state flag — prevents infinite refresh loops after logout
const SESSION_FLAG_KEY = 'sas.session';

export const sessionState = {
  setLoggedIn() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_FLAG_KEY, '1');
    }
  },
  setLoggedOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_FLAG_KEY);
    }
  },
  isLoggedOut(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SESSION_FLAG_KEY) !== '1';
  },
};

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (sessionState.isLoggedOut()) return false;
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // Don't even try if we know we're logged out
  if (sessionState.isLoggedOut() && path !== '/v1/auth/login') {
    throw new ApiError('unauthorized', 'No autenticado', 401);
  }

  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const doFetch = (): Promise<T> =>
    fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    }).then(async (res) => {
      if (res.ok) {
        if (res.status === 204) return undefined as unknown as T;
        return (await res.json()) as T;
      }
      let code = 'unknown';
      let message = `Error ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
        if (body?.error) code = body.error;
        if (body?.statusCode) code = body.statusCode.toString();
      } catch {
        /* noop */
      }
      throw new ApiError(code, message, res.status);
    });

  try {
    return await doFetch();
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      path !== '/v1/auth/refresh' &&
      path !== '/v1/auth/login' &&
      !sessionState.isLoggedOut()
    ) {
      const refreshed = await tryRefresh();
      if (!refreshed) {
        sessionState.setLoggedOut();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw err;
      }
      return await doFetch();
    }
    throw err;
  }
}

// Convenience methods
export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'DELETE' }),
};

export const ENDPOINTS = {
  auth: {
    login: '/v1/auth/login',
    refresh: '/v1/auth/refresh',
    logout: '/v1/auth/logout',
    me: '/v1/auth/me',
  },
  dashboard: {
    stats: '/v1/dashboard/stats',
  },
  customers: {
    list: (tenantId: string) => `/v1/tenants/${tenantId}/customers`,
    get: (tenantId: string, id: string) => `/v1/tenants/${tenantId}/customers/${id}`,
    create: (tenantId: string) => `/v1/tenants/${tenantId}/customers`,
  },
  products: {
    list: '/v1/products',
    create: '/v1/products',
    get: (id: string) => `/v1/products/${id}`,
    update: (id: string) => `/v1/products/${id}`,
  },
  invoices: {
    list: '/v1/invoices',
    create: '/v1/invoices',
    get: (id: string) => `/v1/invoices/${id}`,
    status: (id: string) => `/v1/invoices/${id}/status`,
    pdf: (id: string) => `/v1/invoices/${id}/pdf`,
    xml: (id: string) => `/v1/invoices/${id}/xml`,
    retry: (id: string) => `/v1/invoices/${id}/retry`,
  },
  suppliers: {
    list: '/v1/suppliers',
    create: '/v1/suppliers',
    get: (id: string) => `/v1/suppliers/${id}`,
    update: (id: string) => `/v1/suppliers/${id}`,
  },
  inventory: {
    movements: '/v1/inventory/movements',
    createMovement: '/v1/inventory/movements',
  },
  payments: {
    list: '/v1/payments',
    create: '/v1/payments',
  },
  quotations: {
    list: '/v1/quotations',
    create: '/v1/quotations',
    get: (id: string) => `/v1/quotations/${id}`,
    updateStatus: (id: string) => `/v1/quotations/${id}/status`,
  },
  numberingRanges: {
    list: (tenantId: string) => `/v1/tenants/${tenantId}/numbering-ranges`,
    create: (tenantId: string) => `/v1/tenants/${tenantId}/numbering-ranges`,
  },
  tenants: {
    create: '/v1/tenants',
    get: (id: string) => `/v1/tenants/${id}`,
  },
  health: {
    live: '/health/live',
    ready: '/health/ready',
  },
} as const;