'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { api, sessionState } from '@/lib/api-client';

interface Caja {
  id: string;
  name: string;
  branchId: string;
  location?: string;
  active: boolean;
}

interface SesionCaja {
  id: string;
  cashRegisterId: string;
  branchId: string;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed' | 'reconciled';
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
}

interface CashContext {
  cajas: Caja[];
  sesiones: SesionCaja[];
  sesionAbierta: SesionCaja | null;
  loading: boolean;
  abrirSesion: (cajaId: string, branchId: string, monto: number) => Promise<SesionCaja>;
  cerrarSesion: (sesionId: string, montoFinal: number, notas?: string) => Promise<void>;
  crearCaja: (data: { name: string; branchId?: string; location?: string; openingBalanceDefault?: number }) => Promise<void>;
  eliminarCaja: (id: string) => Promise<{ deleted: boolean; message: string }>;
  refrescar: () => Promise<void>;
}

const Ctx = createContext<CashContext | null>(null);

export function CashSessionProvider({ children }: { children: ReactNode }) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [sesiones, setSesiones] = useState<SesionCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const refrescar = useCallback(async () => {
    if (sessionState.isLoggedOut()) {
      setLoading(false);
      return;
    }
    // Always run; serialise concurrent calls instead of skipping them
    if (fetchingRef.current) {
      // Wait for in-flight fetch to complete, then run once more
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (!fetchingRef.current) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }
    fetchingRef.current = true;
    try {
      setLoading(true);
      const [regs, sess] = await Promise.all([
        api.get<Caja[]>('/v1/cash-registers'),
        api.get<SesionCaja[]>('/v1/cash-sessions'),
      ]);
      setCajas(regs as any);
      setSesiones(sess as any);
    } catch {
      // Errors are already handled by api-client (redirect on 401)
      // We just silently stop — no log noise on logout
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refrescar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirSesion = useCallback(async (cajaId: string, branchId: string, monto: number) => {
    const ses = await api.post<SesionCaja>('/v1/cash-sessions', {
      cashRegisterId: cajaId,
      branchId,
      openingAmount: monto,
    });
    await refrescar();
    return ses as any;
  }, [refrescar]);

  const cerrarSesion = useCallback(async (sesionId: string, montoFinal: number, notas?: string) => {
    await api.post(`/v1/cash-sessions/${sesionId}/close`, {
      closingAmount: montoFinal,
      notes: notas,
    });
    await refrescar();
  }, [refrescar]);

  const crearCaja = useCallback(async (data: { name: string; branchId?: string; location?: string; openingBalanceDefault?: number }) => {
    await api.post('/v1/cash-registers', data);
    await refrescar();
  }, [refrescar]);

  const eliminarCaja = useCallback(async (id: string) => {
    const res = await api.delete<{ deleted: boolean; message: string }>(`/v1/cash-registers/${id}`);
    await refrescar();
    return res;
  }, [refrescar]);

  const sesionAbierta = sesiones.find(s => s.status === 'open') || null;

  return (
    <Ctx.Provider value={{ cajas, sesiones, sesionAbierta, loading, abrirSesion, cerrarSesion, crearCaja, eliminarCaja, refrescar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCashSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCashSession must be inside CashSessionProvider');
  return ctx;
}
