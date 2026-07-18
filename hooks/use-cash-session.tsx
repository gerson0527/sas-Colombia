'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockCajas, mockSesionesCaja } from '@/lib/mock-data';
import type { Caja, SesionCaja } from '@/lib/types';

interface CashSessionContextValue {
  cajas: Caja[];
  sesiones: SesionCaja[];
  sesionAbierta: SesionCaja | null;
  sesionAnteriorAbierta: SesionCaja | null;
  abrirSesion: (cajaId: string, usuario?: { id: string; nombre: string }) => SesionCaja | null;
  cerrarSesion: (sesionId: string, opciones?: { saldoFinal?: number; observaciones?: string }) => void;
  agregarMovimiento: (
    sesionId: string,
    mov: { tipo: 'ingreso' | 'egreso' | 'venta' | 'pago' | 'reembolso'; monto: number; concepto: string; medioPago?: string }
  ) => void;
  registrarVenta: (sesionId: string, monto: number) => void;
  refrescar: () => void;
  /** Date en formato YYYY-MM-DD */
  hoy: () => string;
  isYesterday: (fechaIso: string) => boolean;
}

const CashSessionContext = createContext<CashSessionContextValue | null>(null);

const STORAGE_KEY = 'sas.cash-sessions.v1';

function loadInitial(): SesionCaja[] {
  if (typeof window === 'undefined') return mockSesionesCaja;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockSesionesCaja;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SesionCaja[];
  } catch {
    // ignore
  }
  return mockSesionesCaja;
}

function isSameDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso);
  const b = new Date(bIso);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(fechaIso: string): boolean {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  return isSameDay(fechaIso, ayer.toISOString());
}

export function CashSessionProvider({ children }: { children: ReactNode }) {
  const [sesiones, setSesiones] = useState<SesionCaja[]>(mockSesionesCaja);
  const [hydrated, setHydrated] = useState(false);

  // Cargar desde localStorage al montar (cliente)
  useEffect(() => {
    setSesiones(loadInitial());
    setHydrated(true);
  }, []);

  // Persistir cada cambio
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sesiones));
    } catch {
      // ignore quota errors
    }
  }, [sesiones, hydrated]);

  const sesionAbierta = useMemo(
    () => sesiones.find((s) => s.estado === 'abierta') ?? null,
    [sesiones]
  );

  // Sesión abierta de un día anterior (necesita cerrarse antes de abrir otra)
  const sesionAnteriorAbierta = useMemo(() => {
    if (!sesionAbierta) return null;
    if (isSameDay(sesionAbierta.fechaApertura, new Date().toISOString())) return null;
    return sesionAbierta;
  }, [sesionAbierta]);

  const abrirSesion = useCallback(
    (
      cajaId: string,
      usuario?: { id: string; nombre: string }
    ): SesionCaja | null => {
      const caja = mockCajas.find((c) => c.id === cajaId);
      if (!caja) return null;
      if (sesiones.some((s) => s.cajaId === cajaId && s.estado === 'abierta')) {
        return null;
      }
      const nueva: SesionCaja = {
        id: `ses-${Date.now()}`,
        cajaId,
        caja,
        usuarioId: usuario?.id ?? 'usr-1',
        usuario: usuario?.nombre ?? 'Cajero actual',
        fechaApertura: new Date().toISOString(),
        saldoInicial: caja.saldoBase,
        ingresos: 0,
        egresos: 0,
        ventas: 0,
        saldoFinal: caja.saldoBase,
        estado: 'abierta',
        movimientos: [],
      };
      setSesiones((prev) => [nueva, ...prev]);
      return nueva;
    },
    [sesiones]
  );

  const cerrarSesion = useCallback(
    (
      sesionId: string,
      opciones?: { saldoFinal?: number; observaciones?: string }
    ) => {
      setSesiones((prev) =>
        prev.map((s) =>
          s.id === sesionId
            ? {
                ...s,
                estado: 'cerrada',
                fechaCierre: new Date().toISOString(),
                saldoFinal:
                  opciones?.saldoFinal ??
                  s.saldoInicial + s.ingresos + s.ventas - s.egresos,
                observaciones: opciones?.observaciones,
              }
            : s
        )
      );
    },
    []
  );

  const agregarMovimiento = useCallback(
    (
      sesionId: string,
      mov: { tipo: 'ingreso' | 'egreso' | 'venta' | 'pago' | 'reembolso'; monto: number; concepto: string; medioPago?: string }
    ) => {
      setSesiones((prev) =>
        prev.map((s) => {
          if (s.id !== sesionId) return s;
          const nuevoMov = {
            id: `mc-${Date.now()}`,
            sesionId: s.id,
            tipo: mov.tipo,
            monto: mov.monto,
            concepto: mov.concepto,
            medioPago: mov.medioPago as any,
            usuario: s.usuario,
            fecha: new Date().toISOString(),
          };
          const ingresos = s.ingresos + (mov.tipo === 'ingreso' ? mov.monto : 0);
          const egresos = s.egresos + (mov.tipo === 'egreso' || mov.tipo === 'reembolso' ? mov.monto : 0);
          const ventas = s.ventas + (mov.tipo === 'venta' || mov.tipo === 'pago' ? mov.monto : 0);
          return {
            ...s,
            ingresos,
            egresos,
            ventas,
            saldoFinal: s.saldoInicial + ingresos + ventas - egresos,
            movimientos: [nuevoMov, ...s.movimientos],
          };
        })
      );
    },
    []
  );

  const registrarVenta = useCallback((sesionId: string, monto: number) => {
    setSesiones((prev) =>
      prev.map((s) => {
        if (s.id !== sesionId) return s;
        const nuevasVentas = s.ventas + monto;
        return {
          ...s,
          ventas: nuevasVentas,
          saldoFinal: s.saldoInicial + s.ingresos + nuevasVentas - s.egresos,
        };
      })
    );
  }, []);

  const refrescar = useCallback(() => {
    setSesiones(loadInitial());
  }, []);

  const value = useMemo<CashSessionContextValue>(
    () => ({
      cajas: mockCajas,
      sesiones,
      sesionAbierta,
      sesionAnteriorAbierta,
      abrirSesion,
      cerrarSesion,
      agregarMovimiento,
      registrarVenta,
      refrescar,
      hoy: () => new Date().toISOString().split('T')[0],
      isYesterday,
    }),
    [
      sesiones,
      sesionAbierta,
      sesionAnteriorAbierta,
      abrirSesion,
      cerrarSesion,
      agregarMovimiento,
      registrarVenta,
      refrescar,
    ]
  );

  return (
    <CashSessionContext.Provider value={value}>{children}</CashSessionContext.Provider>
  );
}

export function useCashSession(): CashSessionContextValue {
  const ctx = useContext(CashSessionContext);
  if (!ctx) {
    throw new Error('useCashSession must be used within a CashSessionProvider');
  }
  return ctx;
}
