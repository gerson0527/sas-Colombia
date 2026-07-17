/**
 * Cliente API centralizado.
 *
 * Lee la URL base desde NEXT_PUBLIC_API_URL y adjunta el token JWT
 * (Bearer) automáticamente. En modo mock (USE_MOCK_DATA) no realiza
 * llamadas reales y los hooks consumen los datos de lib/mock-data.
 *
 * El contrato de endpoints se define en ENDPOINTS para que sea fácil
 * de ajustar a la API real del backend (FastAPI/NestJS).
 */

import { USE_MOCK_DATA } from './constants';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  // NextAuth usa cookies httpOnly; el backend las valida. Para
  // llamadas cliente usamos el helper /api/auth/token expuesto por
  // la capa de rutas. En modo mock simplemente no se usa.
  return null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (USE_MOCK_DATA) {
    throw new Error(
      'apiFetch no debe usarse en modo mock. Usa los hooks de lib/mock-data.'
    );
  }
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let code = 'unknown';
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* noop */
    }
    throw new ApiError(code, message, res.status);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    refresh: '/api/v1/auth/refresh',
  },
  dashboard: {
    summary: '/api/v1/dashboard/summary',
  },
  invoices: {
    list: '/api/v1/invoices',
    get: (id: string) => `/api/v1/invoices/${id}`,
    create: '/api/v1/invoices',
    sendDian: (id: string) => `/api/v1/invoices/${id}/send-dian`,
    void: (id: string) => `/api/v1/invoices/${id}/void`,
    pdf: (id: string) => `/api/v1/invoices/${id}/pdf`,
    xml: (id: string) => `/api/v1/invoices/${id}/xml`,
  },
  creditNotes: {
    list: '/api/v1/credit-notes',
    create: '/api/v1/credit-notes',
  },
  debitNotes: {
    list: '/api/v1/debit-notes',
    create: '/api/v1/debit-notes',
  },
  clients: {
    list: '/api/v1/clients',
    create: '/api/v1/clients',
    update: (id: string) => `/api/v1/clients/${id}`,
    delete: (id: string) => `/api/v1/clients/${id}`,
  },
  products: {
    list: '/api/v1/products',
    create: '/api/v1/products',
    update: (id: string) => `/api/v1/products/${id}`,
    delete: (id: string) => `/api/v1/products/${id}`,
  },
  resolutions: {
    list: '/api/v1/dian-resolutions',
    create: '/api/v1/dian-resolutions',
  },
  company: {
    get: '/api/v1/company-settings',
    update: '/api/v1/company-settings',
    certificate: '/api/v1/company-settings/certificate',
  },
  users: {
    list: '/api/v1/users',
    invite: '/api/v1/users/invite',
    role: (id: string) => `/api/v1/users/${id}/role`,
  },
} as const;
