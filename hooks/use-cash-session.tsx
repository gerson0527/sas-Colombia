'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api-client';

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
  refrescar: () => Promise<void>;
}

const Ctx = createContext<CashContext | null>(null);

export function CashSessionProvider({ children }: { children: ReactNode }) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [sesiones, setSesiones] = useState<SesionCaja[]>([]);
  const [loading, setLoading] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      setLoading(true);
      const [regs, sess] = await Promise.all([
        api.get<Caja[]>('/v1/cash-registers'),
        api.get<SesionCaja[]>('/v1/cash-sessions'),
      ]);
      setCajas(regs as any);
      setSesiones(sess as any);
    } catch (e) {
      console.error('Error loading cash data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refrescar(); }, [refrescar]);

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

  const sesionAbierta = sesiones.find(s => s.status === 'open') || null;

  return (
    <Ctx.Provider value={{ cajas, sesiones, sesionAbierta, loading, abrirSesion, cerrarSesion, refrescar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCashSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCashSession must be inside CashSessionProvider');
  return ctx;
}
