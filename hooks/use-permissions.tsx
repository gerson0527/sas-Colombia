'use client';

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PERMISSION_MATRIX } from '@/lib/constants';
import type { RolUsuario, Permiso, SesionUsuario } from '@/lib/types';
import { getMe, mapMeToSesion } from '@/lib/auth-service';

interface PermissionsContextValue {
  sesion: SesionUsuario;
  rol: RolUsuario;
  can: (permiso: Permiso) => boolean;
  switchRole: (rol: RolUsuario) => void;
  limiteDescuento: number;
  setLimiteDescuento: (n: number) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sesion, setSesion] = useState<SesionUsuario | null>(null);
  const [limiteDescuento, setLimiteDescuento] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const me = await getMe();
        if (!mounted) return;
        setSesion(mapMeToSesion(me));
      } catch {
        // No session — redirect to login
        if (mounted) setSesion(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();
    return () => { mounted = false; };
  }, []);

  const can = useCallback(
    (permiso: Permiso) => {
      if (!sesion) return false;
      const matrix = PERMISSION_MATRIX[sesion.usuario.rol];
      return matrix?.[permiso] === true;
    },
    [sesion]
  );

  const switchRole = useCallback((rol: RolUsuario) => {
    setSesion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        usuario: { ...prev.usuario, rol },
      };
    });
  }, []);

  const value = useMemo<PermissionsContextValue>(
    () => ({
      sesion: sesion!,
      rol: sesion?.usuario.rol || 'solo_lectura',
      can,
      switchRole,
      limiteDescuento,
      setLimiteDescuento,
    }),
    [sesion, can, switchRole, limiteDescuento]
  );

  if (loading) return null;

  if (!sesion) {
    return null;
  }

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  }
  return ctx;
}
