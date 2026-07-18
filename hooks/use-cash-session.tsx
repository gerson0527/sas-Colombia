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
import { supabase } from '@/lib/supabase-client';
import type { Caja, SesionCaja } from '@/lib/types';

interface CashSessionContextValue {
  cajas: Caja[];
  sesiones: SesionCaja[];
  sesionAbierta: SesionCaja | null;
  sesionAnteriorAbierta: SesionCaja | null;
  abrirSesion: (cajaId: string, usuario?: { id: string; nombre: string }) => Promise<SesionCaja | null>;
  cerrarSesion: (sesionId: string, opciones?: { saldoFinal?: number; observaciones?: string }) => Promise<void>;
  agregarMovimiento: (
    sesionId: string,
    mov: { tipo: 'ingreso' | 'egreso' | 'venta' | 'pago' | 'reembolso'; monto: number; concepto: string; medioPago?: string }
  ) => Promise<void>;
  registrarVenta: (sesionId: string, monto: number) => Promise<void>;
  refrescar: () => void;
  hoy: () => string;
  isYesterday: (fechaIso: string) => boolean;
  loading: boolean;
  error: string | null;
}

const CashSessionContext = createContext<CashSessionContextValue | null>(null);

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

interface CajaRow {
  id: string;
  nombre: string;
  sucursal: string;
  responsable_actual: string | null;
  activa: boolean;
  saldo_base: number;
}

interface SesionRow {
  id: string;
  caja_id: string;
  usuario_id: string | null;
  usuario: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  saldo_inicial: number;
  ingresos: number;
  egresos: number;
  ventas: number;
  saldo_final: number;
  estado: string;
  observaciones: string | null;
}

interface MovimientoRow {
  id: string;
  sesion_id: string;
  tipo: string;
  monto: number;
  concepto: string;
  medio_pago: string | null;
  usuario: string;
  fecha: string;
}

function mapCaja(r: CajaRow): Caja {
  return {
    id: r.id,
    nombre: r.nombre,
    sucursal: r.sucursal,
    responsableActual: r.responsable_actual || undefined,
    activa: r.activa,
    saldoBase: Number(r.saldo_base),
  };
}

export function CashSessionProvider({ children }: { children: ReactNode }) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [sesiones, setSesiones] = useState<SesionCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refrescar = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const [cajasRes, sesionesRes, movsRes] = await Promise.all([
        supabase.from('cajas').select('*').order('created_at', { ascending: false }),
        supabase.from('sesiones_caja').select('*').order('created_at', { ascending: false }),
        supabase.from('movimientos_caja').select('*').order('fecha', { ascending: false }),
      ]);
      if (!active) return;
      if (cajasRes.error || sesionesRes.error) {
        setError(cajasRes.error?.message || sesionesRes.error?.message || 'Error');
        setLoading(false);
        return;
      }
      const cajasData = (cajasRes.data as CajaRow[]).map(mapCaja);
      const cajaMap = new Map(cajasData.map((c) => [c.id, c]));
      const movsBySesion = new Map<string, SesionCaja['movimientos']>();
      (movsRes.data as MovimientoRow[] || []).forEach((m) => {
        const arr = movsBySesion.get(m.sesion_id) || [];
        arr.push({
          id: m.id,
          sesionId: m.sesion_id,
          tipo: m.tipo as SesionCaja['movimientos'][number]['tipo'],
          monto: Number(m.monto),
          concepto: m.concepto,
          medioPago: (m.medio_pago as SesionCaja['movimientos'][number]['medioPago']) || undefined,
          usuario: m.usuario,
          fecha: m.fecha,
        });
        movsBySesion.set(m.sesion_id, arr);
      });
      const sesionesData = (sesionesRes.data as SesionRow[]).map((s) => ({
        id: s.id,
        cajaId: s.caja_id,
        caja: cajaMap.get(s.caja_id) || ({} as Caja),
        usuarioId: s.usuario_id || '',
        usuario: s.usuario,
        fechaApertura: s.fecha_apertura,
        fechaCierre: s.fecha_cierre || undefined,
        saldoInicial: Number(s.saldo_inicial),
        ingresos: Number(s.ingresos),
        egresos: Number(s.egresos),
        ventas: Number(s.ventas),
        saldoFinal: Number(s.saldo_final),
        estado: s.estado as 'abierta' | 'cerrada',
        movimientos: movsBySesion.get(s.id) || [],
        observaciones: s.observaciones || undefined,
      }));
      setCajas(cajasData);
      setSesiones(sesionesData);
      setError(null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  const sesionAbierta = useMemo(
    () => sesiones.find((s) => s.estado === 'abierta') ?? null,
    [sesiones]
  );

  const sesionAnteriorAbierta = useMemo(() => {
    if (!sesionAbierta) return null;
    if (isSameDay(sesionAbierta.fechaApertura, new Date().toISOString())) return null;
    return sesionAbierta;
  }, [sesionAbierta]);

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
      const insertRow = {
        caja_id: cajaId,
        usuario_id: usuario?.id ?? null,
        usuario: usuario?.nombre ?? 'Cajero actual',
        saldo_inicial: caja.saldoBase,
        ingresos: 0,
        egresos: 0,
        ventas: 0,
        saldo_final: caja.saldoBase,
        estado: 'abierta',
      };
      const { data: row, error: err } = await supabase
        .from('sesiones_caja')
        .insert(insertRow)
        .select()
        .single();
      if (err) {
        setError(err.message);
        return null;
      }
      const nueva: SesionCaja = {
        id: (row as SesionRow).id,
        cajaId,
        caja,
        usuarioId: usuario?.id ?? '',
        usuario: usuario?.nombre ?? 'Cajero actual',
        fechaApertura: (row as SesionRow).fecha_apertura,
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
      const { error: err } = await supabase
        .from('sesiones_caja')
        .update({
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
          saldo_final: saldoFinal,
          observaciones: opciones?.observaciones || null,
        })
        .eq('id', sesionId);
      if (err) {
        setError(err.message);
        return;
      }
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
      const insertRow = {
        sesion_id: sesionId,
        tipo: mov.tipo,
        monto: mov.monto,
        concepto: mov.concepto,
        medio_pago: mov.medioPago || null,
        usuario: sesion.usuario,
      };
      const { data: row, error: err } = await supabase
        .from('movimientos_caja')
        .insert(insertRow)
        .select()
        .single();
      if (err) {
        setError(err.message);
        return;
      }
      const nuevoMov = {
        id: (row as MovimientoRow).id,
        sesionId,
        tipo: mov.tipo,
        monto: mov.monto,
        concepto: mov.concepto,
        medioPago: (mov.medioPago as SesionCaja['movimientos'][number]['medioPago']) || undefined,
        usuario: sesion.usuario,
        fecha: (row as MovimientoRow).fecha,
      };
      const ingresos = sesion.ingresos + (mov.tipo === 'ingreso' ? mov.monto : 0);
      const egresos = sesion.egresos + (mov.tipo === 'egreso' || mov.tipo === 'reembolso' ? mov.monto : 0);
      const ventas = sesion.ventas + (mov.tipo === 'venta' || mov.tipo === 'pago' ? mov.monto : 0);
      const saldoFinal = sesion.saldoInicial + ingresos + ventas - egresos;
      await supabase
        .from('sesiones_caja')
        .update({ ingresos, egresos, ventas, saldo_final: saldoFinal })
        .eq('id', sesionId);
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
      const { error: err } = await supabase
        .from('sesiones_caja')
        .update({ ventas: nuevasVentas, saldo_final: saldoFinal })
        .eq('id', sesionId);
      if (err) {
        setError(err.message);
        return;
      }
      setSesiones((prev) =>
        prev.map((s) =>
          s.id === sesionId ? { ...s, ventas: nuevasVentas, saldoFinal } : s
        )
      );
    },
    [sesiones]
  );

  const value = useMemo<CashSessionContextValue>(
    () => ({
      cajas,
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
      loading,
      error,
    }),
    [
      cajas,
      sesiones,
      sesionAbierta,
      sesionAnteriorAbierta,
      abrirSesion,
      cerrarSesion,
      agregarMovimiento,
      registrarVenta,
      refrescar,
      loading,
      error,
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
