'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type {
  Cliente,
  Producto,
  DocumentoElectronico,
  ResolucionDian,
  Proveedor,
  Caja,
  SesionCaja,
  Usuario,
} from '@/lib/types';

// ============================================================================
// Mappers: DB row → domain type
// ============================================================================

interface ClienteRow {
  id: string;
  empresa_id: string;
  tipo_identificacion: string;
  identificacion: string;
  dv: string | null;
  razon_social: string;
  nombre_comercial: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  codigo_postal: string | null;
  regimen_tributario: string;
  responsabilidades_fiscales: string[];
  codigo_ciiu: string | null;
  persona: string;
  regimen_simple: boolean | null;
  created_at: string;
  updated_at: string;
}

function mapCliente(r: ClienteRow): Cliente {
  return {
    id: r.id,
    tipoIdentificacion: r.tipo_identificacion as Cliente['tipoIdentificacion'],
    identificacion: r.identificacion,
    dv: r.dv || undefined,
    razonSocial: r.razon_social,
    nombreComercial: r.nombre_comercial || undefined,
    email: r.email || '',
    telefono: r.telefono || undefined,
    direccion: r.direccion || '',
    ciudad: r.ciudad || '',
    departamento: r.departamento || '',
    codigoPostal: r.codigo_postal || undefined,
    regimenTributario: r.regimen_tributario as Cliente['regimenTributario'],
    responsabilidadesFiscales: (r.responsabilidades_fiscales || []) as Cliente['responsabilidadesFiscales'],
    codigoCIIU: r.codigo_ciiu || undefined,
    persona: r.persona as 'natural' | 'juridica',
    regimenSimple: r.regimen_simple || false,
    createdAt: r.created_at,
  };
}

interface ProductoRow {
  id: string;
  empresa_id: string;
  codigo: string;
  codigo_unspsc: string | null;
  nombre: string;
  descripcion: string | null;
  tipo_item: string;
  precio_unitario: number;
  unidad_medida: string;
  iva: number;
  inc: number | null;
  aplica_rete_fuente: boolean;
  aplica_rete_ica: boolean;
  aplica_rete_iva: boolean;
  tasa_rete_fuente: number | null;
  tasa_rete_ica: number | null;
  tasa_rete_iva: number | null;
  stock: number | null;
  stock_minimo: number | null;
  costo_unitario: number | null;
  cuenta_contable: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

function mapProducto(r: ProductoRow): Producto {
  return {
    id: r.id,
    codigo: r.codigo,
    codigoUNSPSC: r.codigo_unspsc || undefined,
    nombre: r.nombre,
    descripcion: r.descripcion || undefined,
    tipoItem: r.tipo_item as 'bien' | 'servicio',
    precioUnitario: Number(r.precio_unitario),
    unidadMedida: r.unidad_medida as Producto['unidadMedida'],
    iva: Number(r.iva),
    inc: r.inc ? Number(r.inc) : undefined,
    aplicaReteFuente: r.aplica_rete_fuente,
    aplicaReteICA: r.aplica_rete_ica,
    aplicaReteIVA: r.aplica_rete_iva,
    tasaReteFuente: r.tasa_rete_fuente ? Number(r.tasa_rete_fuente) : undefined,
    tasaReteICA: r.tasa_rete_ica ? Number(r.tasa_rete_ica) : undefined,
    tasaReteIVA: r.tasa_rete_iva ? Number(r.tasa_rete_iva) : undefined,
    stock: r.stock ?? undefined,
    stockMinimo: r.stock_minimo ?? undefined,
    costoUnitario: r.costo_unitario ? Number(r.costo_unitario) : undefined,
    cuentaContable: r.cuenta_contable || undefined,
    activo: r.activo,
  };
}

interface DocumentoRow {
  id: string;
  empresa_id: string;
  tipo_documento: string;
  tipo_operacion: string;
  numero: string;
  resolucion_id: string | null;
  cliente_id: string | null;
  forma_pago: string;
  medio_pago: string;
  subtotal: number;
  total_iva: number;
  total_inc: number;
  total_retenciones: number;
  total_descuentos: number;
  total_cargos: number;
  total: number;
  estado_dian: string;
  cufe: string | null;
  cude: string | null;
  qr_code: string | null;
  url_xml: string | null;
  url_pdf: string | null;
  ambiente: string;
  motivo_rechazo: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  moneda: string;
  observaciones: string | null;
  info_entrega: Record<string, unknown> | null;
  documento_referencia: Record<string, unknown> | null;
  allowances_charges: Record<string, unknown> | null;
  cuotas: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function mapDocumento(r: DocumentoRow): DocumentoElectronico {
  return {
    id: r.id,
    tipoDocumento: r.tipo_documento as DocumentoElectronico['tipoDocumento'],
    tipoOperacion: r.tipo_operacion as DocumentoElectronico['tipoOperacion'],
    numero: r.numero,
    resolucionId: r.resolucion_id || '',
    clienteId: r.cliente_id || '',
    cliente: {} as DocumentoElectronico['cliente'],
    items: [],
    formaPago: r.forma_pago as DocumentoElectronico['formaPago'],
    medioPago: r.medio_pago as DocumentoElectronico['medioPago'],
    subtotal: Number(r.subtotal),
    totalIva: Number(r.total_iva),
    totalInc: Number(r.total_inc),
    totalRetenciones: Number(r.total_retenciones),
    totalDescuentos: Number(r.total_descuentos),
    totalCargos: Number(r.total_cargos),
    total: Number(r.total),
    estadoDian: r.estado_dian as DocumentoElectronico['estadoDian'],
    cufe: r.cufe || undefined,
    cude: r.cude || undefined,
    qrCode: r.qr_code || undefined,
    urlXml: r.url_xml || undefined,
    urlPdf: r.url_pdf || undefined,
    ambiente: r.ambiente as DocumentoElectronico['ambiente'],
    motivoRechazo: r.motivo_rechazo || undefined,
    fechaEmision: r.fecha_emision,
    fechaVencimiento: r.fecha_vencimiento || undefined,
    moneda: r.moneda as DocumentoElectronico['moneda'],
    observaciones: r.observaciones || undefined,
    infoEntrega: (r.info_entrega as unknown as DocumentoElectronico['infoEntrega']) || undefined,
    documentoReferencia: (r.documento_referencia as unknown as DocumentoElectronico['documentoReferencia']) || undefined,
    allowancesCharges: (r.allowances_charges as unknown as DocumentoElectronico['allowancesCharges']) || undefined,
    cuotas: (r.cuotas as unknown as DocumentoElectronico['cuotas']) || undefined,
    createdAt: r.created_at,
  };
}

// ============================================================================
// Hook genérico
// ============================================================================

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// useClientes
// ============================================================================

export function useClientes(): QueryState<Cliente> & {
  create: (c: Partial<Cliente>) => Promise<Cliente | null>;
  update: (id: string, c: Partial<Cliente>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData((rows as ClienteRow[]).map(mapCliente));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  const create = useCallback(async (c: Partial<Cliente>): Promise<Cliente | null> => {
    const insertRow = {
      tipo_identificacion: c.tipoIdentificacion,
      identificacion: c.identificacion,
      dv: c.dv || null,
      razon_social: c.razonSocial,
      nombre_comercial: c.nombreComercial || null,
      email: c.email || null,
      telefono: c.telefono || null,
      direccion: c.direccion || null,
      ciudad: c.ciudad || null,
      departamento: c.departamento || null,
      codigo_postal: c.codigoPostal || null,
      regimen_tributario: c.regimenTributario || 'responsable_iva',
      responsabilidades_fiscales: c.responsabilidadesFiscales || [],
      codigo_ciiu: c.codigoCIIU || null,
      persona: c.persona || 'juridica',
      regimen_simple: c.regimenSimple || false,
    };
    const { data: row, error: err } = await supabase
      .from('clientes')
      .insert(insertRow)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return null;
    }
    const mapped = mapCliente(row as ClienteRow);
    setData((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, c: Partial<Cliente>): Promise<boolean> => {
    const updateRow: Record<string, unknown> = {};
    if (c.tipoIdentificacion) updateRow.tipo_identificacion = c.tipoIdentificacion;
    if (c.identificacion) updateRow.identificacion = c.identificacion;
    if (c.dv !== undefined) updateRow.dv = c.dv || null;
    if (c.razonSocial) updateRow.razon_social = c.razonSocial;
    if (c.nombreComercial !== undefined) updateRow.nombre_comercial = c.nombreComercial || null;
    if (c.email !== undefined) updateRow.email = c.email || null;
    if (c.telefono !== undefined) updateRow.telefono = c.telefono || null;
    if (c.direccion !== undefined) updateRow.direccion = c.direccion || null;
    if (c.ciudad !== undefined) updateRow.ciudad = c.ciudad || null;
    if (c.departamento !== undefined) updateRow.departamento = c.departamento || null;
    if (c.codigoPostal !== undefined) updateRow.codigo_postal = c.codigoPostal || null;
    if (c.regimenTributario) updateRow.regimen_tributario = c.regimenTributario;
    if (c.responsabilidadesFiscales) updateRow.responsabilidades_fiscales = c.responsabilidadesFiscales;
    if (c.codigoCIIU !== undefined) updateRow.codigo_ciiu = c.codigoCIIU || null;
    if (c.persona) updateRow.persona = c.persona;

    const { error: err } = await supabase.from('clientes').update(updateRow).eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, ...c } : c)));
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('clientes').delete().eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  return { data, loading, error, refetch, create, update, remove };
}

// ============================================================================
// useProductos
// ============================================================================

export function useProductos(): QueryState<Producto> & {
  create: (p: Partial<Producto>) => Promise<Producto | null>;
  update: (id: string, p: Partial<Producto>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData((rows as ProductoRow[]).map(mapProducto));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  const create = useCallback(async (p: Partial<Producto>): Promise<Producto | null> => {
    const insertRow = {
      codigo: p.codigo,
      codigo_unspsc: p.codigoUNSPSC || null,
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      tipo_item: p.tipoItem || 'bien',
      precio_unitario: p.precioUnitario || 0,
      unidad_medida: p.unidadMedida || 'UND',
      iva: p.iva ?? 0,
      inc: p.inc || null,
      aplica_rete_fuente: p.aplicaReteFuente || false,
      aplica_rete_ica: p.aplicaReteICA || false,
      aplica_rete_iva: p.aplicaReteIVA || false,
      tasa_rete_fuente: p.tasaReteFuente || null,
      tasa_rete_ica: p.tasaReteICA || null,
      tasa_rete_iva: p.tasaReteIVA || null,
      stock: p.stock ?? null,
      stock_minimo: p.stockMinimo ?? null,
      costo_unitario: p.costoUnitario || null,
      cuenta_contable: p.cuentaContable || null,
      activo: p.activo ?? true,
    };
    const { data: row, error: err } = await supabase
      .from('productos')
      .insert(insertRow)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return null;
    }
    const mapped = mapProducto(row as ProductoRow);
    setData((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, p: Partial<Producto>): Promise<boolean> => {
    const updateRow: Record<string, unknown> = {};
    if (p.codigo) updateRow.codigo = p.codigo;
    if (p.codigoUNSPSC !== undefined) updateRow.codigo_unspsc = p.codigoUNSPSC || null;
    if (p.nombre) updateRow.nombre = p.nombre;
    if (p.descripcion !== undefined) updateRow.descripcion = p.descripcion || null;
    if (p.tipoItem) updateRow.tipo_item = p.tipoItem;
    if (p.precioUnitario !== undefined) updateRow.precio_unitario = p.precioUnitario;
    if (p.unidadMedida) updateRow.unidad_medida = p.unidadMedida;
    if (p.iva !== undefined) updateRow.iva = p.iva;
    if (p.inc !== undefined) updateRow.inc = p.inc || null;
    if (p.aplicaReteFuente !== undefined) updateRow.aplica_rete_fuente = p.aplicaReteFuente;
    if (p.aplicaReteICA !== undefined) updateRow.aplica_rete_ica = p.aplicaReteICA;
    if (p.aplicaReteIVA !== undefined) updateRow.aplica_rete_iva = p.aplicaReteIVA;
    if (p.stock !== undefined) updateRow.stock = p.stock;
    if (p.stockMinimo !== undefined) updateRow.stock_minimo = p.stockMinimo;
    if (p.activo !== undefined) updateRow.activo = p.activo;

    const { error: err } = await supabase.from('productos').update(updateRow).eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.map((pr) => (pr.id === id ? { ...pr, ...p } : pr)));
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('productos').delete().eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  return { data, loading, error, refetch, create, update, remove };
}

// ============================================================================
// useDocumentos
// ============================================================================

export function useDocumentos(): QueryState<DocumentoElectronico> {
  const [data, setData] = useState<DocumentoElectronico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('documentos_electronicos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData((rows as DocumentoRow[]).map(mapDocumento));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useResoluciones
// ============================================================================

export function useResoluciones(): QueryState<ResolucionDian> {
  const [data, setData] = useState<ResolucionDian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('resoluciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            numeroResolucion: r.numero_resolucion as string,
            tipoDocumento: r.tipo_documento as ResolucionDian['tipoDocumento'],
            prefijo: r.prefijo as string,
            rangoDesde: r.rango_desde as number,
            rangoHasta: r.rango_hasta as number,
            consecutivoActual: r.consecutivo_actual as number,
            fechaVigenciaDesde: r.fecha_vigencia_desde as string,
            fechaVigenciaHasta: r.fecha_vigencia_hasta as string,
            activa: r.activa as boolean,
            claveTecnica: (r.clave_tecnica as string) || undefined,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useProveedores
// ============================================================================

export function useProveedores(): QueryState<Proveedor> {
  const [data, setData] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('proveedores')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            tipoIdentificacion: r.tipo_identificacion as Proveedor['tipoIdentificacion'],
            identificacion: r.identificacion as string,
            dv: (r.dv as string) || undefined,
            razonSocial: r.razon_social as string,
            nombreComercial: (r.nombre_comercial as string) || undefined,
            email: (r.email as string) || '',
            telefono: (r.telefono as string) || undefined,
            direccion: (r.direccion as string) || '',
            ciudad: (r.ciudad as string) || '',
            departamento: (r.departamento as string) || '',
            regimenTributario: r.regimen_tributario as Proveedor['regimenTributario'],
            responsabilidadesFiscales: (r.responsabilidades_fiscales || []) as Proveedor['responsabilidadesFiscales'],
            codigoCIIU: (r.codigo_ciiu as string) || undefined,
            persona: r.persona as 'natural' | 'juridica',
            banco: (r.banco as string) || undefined,
            tipoCuenta: (r.tipo_cuenta as 'ahorros' | 'corriente') || undefined,
            numeroCuenta: (r.numero_cuenta as string) || undefined,
            formaPagoPreferida: (r.forma_pago_preferida as Proveedor['formaPagoPreferida']) || undefined,
            plazoPagoDias: (r.plazo_pago_dias as number) || undefined,
            activo: r.activo as boolean,
            createdAt: r.created_at as string,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useCajas
// ============================================================================

export function useCajas(): QueryState<Caja> {
  const [data, setData] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('cajas')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            nombre: r.nombre as string,
            sucursal: r.sucursal as string,
            responsableActual: (r.responsable_actual as string) || undefined,
            activa: r.activa as boolean,
            saldoBase: Number(r.saldo_base),
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useSesionesCaja
// ============================================================================

export function useSesionesCaja(): QueryState<SesionCaja> {
  const [data, setData] = useState<SesionCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('sesiones_caja')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            cajaId: r.caja_id as string,
            caja: {} as Caja,
            usuarioId: (r.usuario_id as string) || '',
            usuario: r.usuario as string,
            fechaApertura: r.fecha_apertura as string,
            fechaCierre: (r.fecha_cierre as string) || undefined,
            saldoInicial: Number(r.saldo_inicial),
            ingresos: Number(r.ingresos),
            egresos: Number(r.egresos),
            ventas: Number(r.ventas),
            saldoFinal: Number(r.saldo_final),
            estado: r.estado as 'abierta' | 'cerrada',
            movimientos: [],
            observaciones: (r.observaciones as string) || undefined,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useUsuarios
// ============================================================================

export function useUsuarios(): QueryState<Usuario> {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            nombre: r.nombre as string,
            email: r.email as string,
            rol: r.rol as Usuario['rol'],
            pin: (r.pin as string) || undefined,
            estado: r.estado as 'activo' | 'pendiente' | 'inactivo',
            ultimoAcceso: (r.ultimo_acceso as string) || undefined,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}
