const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

function getCookies(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie;
}

function parseCookies(cookieStr: string): Record<string, string> {
  return Object.fromEntries(
    cookieStr.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const cookies = getCookies();
  const parsed = parseCookies(cookies);

  // Extract JWT from cookie or use Authorization header if provided
  const accessToken = parsed['access'] || parsed['__Host-access'];
  const refreshToken = parsed['refresh'] || parsed['__Host-refresh'];

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
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
    // On 401, attempt refresh if we have a refresh token
    if (err instanceof ApiError && err.status === 401 && refreshToken) {
      try {
        await fetch(`${BASE_URL}/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        // Retry with new cookies
        const newCookies = getCookies();
        const newParsed = parseCookies(newCookies);
        const newAccess = newParsed['access'] || newParsed['__Host-access'];
        if (newAccess) {
          headers.set('Authorization', `Bearer ${newAccess}`);
        }
        return await doFetch();
      } catch {
        // Refresh failed, rethrow original error
        throw err;
      }
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
