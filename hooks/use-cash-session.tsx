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
import type { Caja, SesionCaja } from '@/lib/types';

interface CashSessionContextValue {
  cajas: Caja[];
  sesiones: SesionCaja[];
  sesionAbierta: SesionCaja | null;
  sesionAnteriorAbierta: SesionCaja | null;
  loading: boolean;
  error: string | null;
  abrirSesion: (cajaId: string, usuario?: { id: string; nombre: string }) => Promise<SesionCaja | null>;
  cerrarSesion: (sesionId: string, opciones?: { saldoFinal?: number; observaciones?: string }) => Promise<void>;
  agregarMovimiento: (
    sesionId: string,
    mov: { tipo: 'ingreso' | 'egreso' | 'venta' | 'pago' | 'reembolso'; monto: number; concepto: string; medioPago?: string }
  ) => Promise<void>;
  registrarVenta: (sesionId: string, monto: number) => Promise<void>;
  crearCaja: (caja: { nombre: string; sucursal: string; saldoBase: number }) => Promise<void>;
  editarCaja: (cajaId: string, updates: Partial<Caja>) => Promise<void>;
  refrescar: () => void;
  hoy: () => string;
  isYesterday: (fechaIso: string) => boolean;
}

const CashSessionContext = createContext<CashSessionContextValue | null>(null);

const STORAGE_CAJAS = 'sas.cajas.v1';
const STORAGE_SESIONES = 'sas.sesiones-caja.v1';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadCajas(): Caja[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_CAJAS);
    if (!raw) {
      // Caja por defecto la primera vez
      const def: Caja = {
        id: 'caja-default',
        nombre: 'Caja Principal',
        sucursal: 'Sede Principal',
        activa: true,
        saldoBase: 100000,
      };
      window.localStorage.setItem(STORAGE_CAJAS, JSON.stringify([def]));
      return [def];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Caja[]) : [];
  } catch {
    return [];
  }
}

function loadSesiones(): SesionCaja[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_SESIONES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SesionCaja[]) : [];
  } catch {
    return [];
  }
}

function saveCajas(cajas: Caja[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_CAJAS, JSON.stringify(cajas));
  } catch {
    /* ignore quota */
  }
}

function saveSesiones(sesiones: SesionCaja[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_SESIONES, JSON.stringify(sesiones));
  } catch {
    /* ignore quota */
  }
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
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [sesiones, setSesiones] = useState<SesionCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCajas(loadCajas());
    setSesiones(loadSesiones());
    setLoading(false);
    setHydrated(true);
  }, []);

  // Persistir cambios después de hidratar (evita sobreescribir con el estado inicial vacío)
  useEffect(() => {
    if (hydrated) saveCajas(cajas);
  }, [cajas, hydrated]);

  useEffect(() => {
    if (hydrated) saveSesiones(sesiones);
  }, [sesiones, hydrated]);

  const sesionAbierta = useMemo(
    () => sesiones.find((s) => s.estado === 'abierta') ?? null,
    [sesiones]
  );

  const sesionAnteriorAbierta = useMemo(() => {
    if (!sesionAbierta) return null;
    if (isSameDay(sesionAbierta.fechaApertura, new Date().toISOString())) return null;
    return sesionAbierta;
  }, [sesionAbierta]);

  const refrescar = useCallback(() => {
    setCajas(loadCajas());
    setSesiones(loadSesiones());
  }, []);

  const abrirSesion = useCallback(
    async (
      cajaId: string,
      usuario?: { id: string; nombre: string }
    ): Promise<SesionCaja | null> => {
      const caja = cajas.find((c) => c.id === cajaId);
      if (!caja) return null;
      if (sesiones.some((s) => s.cajaId === cajaId && s.estado === 'abierta')) {
        return null;
      }
      const nueva: SesionCaja = {
        id: generateId('ses'),
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
    [cajas, sesiones]
  );

  const cerrarSesion = useCallback(
    async (
      sesionId: string,
      opciones?: { saldoFinal?: number; observaciones?: string }
    ): Promise<void> => {
      const sesion = sesiones.find((s) => s.id === sesionId);
      if (!sesion) return;
      const saldoFinal =
        opciones?.saldoFinal ??
        sesion.saldoInicial + sesion.ingresos + sesion.ventas - sesion.egresos;
      setSesiones((prev) =>
        prev.map((s) =>
          s.id === sesionId
            ? {
                ...s,
                estado: 'cerrada',
                fechaCierre: new Date().toISOString(),
                saldoFinal,
                observaciones: opciones?.observaciones,
              }
            : s
        )
      );
    },
    [sesiones]
  );

  const agregarMovimiento = useCallback(
    async (
      sesionId: string,
      mov: { tipo: 'ingreso' | 'egreso' | 'venta' | 'pago' | 'reembolso'; monto: number; concepto: string; medioPago?: string }
    ): Promise<void> => {
      const sesion = sesiones.find((s) => s.id === sesionId);
      if (!sesion) return;
      const nuevoMov = {
        id: generateId('mc'),
        sesionId,
        tipo: mov.tipo,
        monto: mov.monto,
        concepto: mov.concepto,
        medioPago: mov.medioPago as SesionCaja['movimientos'][number]['medioPago'],
        usuario: sesion.usuario,
        fecha: new Date().toISOString(),
      };
      const ingresos = sesion.ingresos + (mov.tipo === 'ingreso' ? mov.monto : 0);
      const egresos = sesion.egresos + (mov.tipo === 'egreso' || mov.tipo === 'reembolso' ? mov.monto : 0);
      const ventas = sesion.ventas + (mov.tipo === 'venta' || mov.tipo === 'pago' ? mov.monto : 0);
      const saldoFinal = sesion.saldoInicial + ingresos + ventas - egresos;
      setSesiones((prev) =>
        prev.map((s) =>
          s.id === sesionId
            ? { ...s, ingresos, egresos, ventas, saldoFinal, movimientos: [nuevoMov, ...s.movimientos] }
            : s
        )
      );
    },
    [sesiones]
  );

  const registrarVenta = useCallback(
    async (sesionId: string, monto: number): Promise<void> => {
      const sesion = sesiones.find((s) => s.id === sesionId);
      if (!sesion) return;
      const nuevasVentas = sesion.ventas + monto;
      const saldoFinal = sesion.saldoInicial + sesion.ingresos + nuevasVentas - sesion.egresos;
      setSesiones((prev) =>
        prev.map((s) =>
          s.id === sesionId ? { ...s, ventas: nuevasVentas, saldoFinal } : s
        )
      );
    },
    [sesiones]
  );

  const crearCaja = useCallback(
    async (datos: { nombre: string; sucursal: string; saldoBase: number }): Promise<void> => {
      const nuevaCaja: Caja = {
        id: generateId('caja'),
        nombre: datos.nombre,
        sucursal: datos.sucursal,
        saldoBase: datos.saldoBase,
        activa: true,
      };
      setCajas((prev) => [...prev, nuevaCaja]);
    },
    []
  );

  const editarCaja = useCallback(
    async (cajaId: string, updates: Partial<Caja>): Promise<void> => {
      setCajas((prev) =>
        prev.map((c) => (c.id === cajaId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const value = useMemo<CashSessionContextValue>(
    () => ({
      cajas,
      sesiones,
      sesionAbierta,
      sesionAnteriorAbierta,
      loading,
      error,
      abrirSesion,
      cerrarSesion,
      agregarMovimiento,
      registrarVenta,
      crearCaja,
      editarCaja,
      refrescar,
      hoy: () => new Date().toISOString().split('T')[0],
      isYesterday,
    }),
    [cajas, sesiones, sesionAbierta, sesionAnteriorAbierta, loading, error, abrirSesion, cerrarSesion, agregarMovimiento, registrarVenta, crearCaja, editarCaja, refrescar]
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
