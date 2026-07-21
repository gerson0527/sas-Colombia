import { api, ENDPOINTS } from './api-client';
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
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenantName: string;
  iat?: number;
  exp?: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>(ENDPOINTS.auth.login, { email, password });
}

export async function logout(): Promise<void> {
  await api.post<void>(ENDPOINTS.auth.logout);
}

export async function refresh(): Promise<void> {
  await api.post<void>(ENDPOINTS.auth.refresh);
}

export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>(ENDPOINTS.auth.me);
}

export function mapMeToSesion(me: MeResponse): SesionUsuario {
  return {
    usuario: {
      id: me.sub,
      nombre: me.fullName,
      email: me.email,
      rol: me.role as RolUsuario,
      pin: '',
      estado: 'activo',
      ultimoAcceso: new Date().toISOString(),
    },
    tenantId: me.tenantId,
    tenantNombre: me.tenantName,
    limiteDescuento: 10,
  };
}
