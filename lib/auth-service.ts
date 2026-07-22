import { api, ENDPOINTS, sessionState } from './api-client';
import type { SesionUsuario, RolUsuario } from './types';

export interface LoginResponse {
  message: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string;
    tenantName: string;
  };
}

export interface MeResponse {
  sub: string;
  email?: string;
  fullName?: string;
  role: string;
  tenantId?: string;
  tenantName?: string;
  iat?: number;
  exp?: number;
}

function deriveNameFromEmail(email?: string): string {
  if (!email) return 'Usuario';
  const local = email.split('@')[0];
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>(ENDPOINTS.auth.login, { email, password });
  sessionState.setLoggedIn();
  return res;
}

export async function logout(): Promise<void> {
  sessionState.setLoggedOut();
  try {
    await api.post<void>(ENDPOINTS.auth.logout);
  } catch {
    // ignore network errors on logout
  }
}

export async function refresh(): Promise<void> {
  await api.post<void>(ENDPOINTS.auth.refresh);
}

export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>(ENDPOINTS.auth.me);
}

function normalizeRole(role?: string): RolUsuario {
  if (!role) return 'solo_lectura';
  const r = role.toLowerCase();
  if (r.includes('admin')) return 'admin';
  if (r === 'supervisor' || r === 'cajero' || r === 'contador') return r as RolUsuario;
  return 'solo_lectura';
}

export function mapMeToSesion(me: MeResponse): SesionUsuario {
  const nombre =
    me.fullName?.trim() ||
    deriveNameFromEmail(me.email);

  return {
    usuario: {
      id: me.sub,
      nombre,
      email: me.email || '',
      rol: normalizeRole(me.role),
      pin: '',
      estado: 'activo',
      ultimoAcceso: new Date().toISOString(),
    },
    tenantId: me.tenantId || '',
    tenantNombre: me.tenantName || '',
    limiteDescuento: 10,
  };
}
