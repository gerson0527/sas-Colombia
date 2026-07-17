'use client';

import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { PERMISSION_MATRIX } from '@/lib/constants';
import type { RolUsuario, Permiso, SesionUsuario } from '@/lib/types';

interface PermissionsContextValue {
  sesion: SesionUsuario;
  rol: RolUsuario;
  can: (permiso: Permiso) => boolean;
  switchRole: (rol: RolUsuario) => void;
  limiteDescuento: number;
  setLimiteDescuento: (n: number) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

const DEFAULT_SESION: SesionUsuario = {
  usuario: {
    id: 'usr-1',
    nombre: 'Diana Marcela Gómez',
    email: 'diana.gomez@innovaandina.co',
    rol: 'admin',
    pin: '1234',
    estado: 'activo',
    ultimoAcceso: '2026-07-16T13:10:00Z',
  },
  tenantId: 'emp-1',
  tenantNombre: 'Innova Andina S.A.S.',
  limiteDescuento: 10,
};

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<SesionUsuario>(DEFAULT_SESION);
  const [limiteDescuento, setLimiteDescuento] = useState(10);

  const can = useCallback(
    (permiso: Permiso) => {
      const matrix = PERMISSION_MATRIX[sesion.usuario.rol];
      return matrix?.[permiso] === true;
    },
    [sesion.usuario.rol]
  );

  const switchRole = useCallback((rol: RolUsuario) => {
    setSesion((prev) => ({
      ...prev,
      usuario: { ...prev.usuario, rol },
    }));
  }, []);

  const value = useMemo<PermissionsContextValue>(
    () => ({
      sesion,
      rol: sesion.usuario.rol,
      can,
      switchRole,
      limiteDescuento,
      setLimiteDescuento,
    }),
    [sesion, can, switchRole, limiteDescuento]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  }
  return ctx;
}
