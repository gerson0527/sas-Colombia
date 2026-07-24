'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api-client';
const supabase = createClient();
import type {
  Cliente,
  Producto,
  DocumentoElectronico,
  ResolucionDian,
  Proveedor,
  Caja,
  SesionCaja,
  Usuario,
  InventarioItem,
  MovimientoInventario,
  ProductoFacturacion,
  ConfiguracionEmpresa,
  ItemFactura,
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

export function useProductos(): {
  data: Producto[];
  loading: boolean;
  error: string | null;
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
    console.log('[useProductos] Fetching /v1/products...');
    api.get('/v1/products')
      .then((res: any) => {
        if (!active) return;
        console.log('[useProductos] Raw response:', res);
        const arr = Array.isArray(res) ? res : (res?.data || []);
        const mapped = arr.map((p: any) => ({
          id: p.id,
          codigo: p.code || p.id,
          codigoUNSPSC: p.unspscCode,
          nombre: p.name,
          descripcion: p.description,
          tipoItem: p.type || 'bien',
          precioUnitario: Number(p.price) || 0,
          unidadMedida: p.unitOfMeasure || '94',
          iva: Number(p.taxRate) || 0,
          inc: 0,
          aplicaReteFuente: false,
          aplicaReteICA: false,
          aplicaReteIVA: false,
          stock: Number(p.stock) || 0,
          activo: p.isActive !== false,
        }));
        console.log('[useProductos] Mapped products:', mapped.length, mapped);
        setData(mapped);
        setError(null);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!active) return;
        console.error('[useProductos] Error:', err);
        setError(err.message || 'Error loading products');
        setData([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  const create = useCallback(async (p: Partial<Producto>): Promise<Producto | null> => {
    try {
      const created = await api.post('/v1/products', {
        code: p.codigo,
        name: p.nombre,
        description: p.descripcion,
        price: p.precioUnitario,
        taxRate: p.iva,
        stock: p.stock || 0,
        unitOfMeasure: p.unidadMedida || '94',
        type: p.tipoItem || 'bien'
      });
      refetch();
      return created as any;
    } catch (e: any) {
      console.error(e);
      return null;
    }
  }, [refetch]);

  const update = useCallback(async (id: string, p: Partial<Producto>): Promise<boolean> => {
    try {
      await api.patch(`/v1/products/${id}`, {
        code: p.codigo,
        name: p.nombre,
        description: p.descripcion,
        price: p.precioUnitario,
        taxRate: p.iva,
        stock: p.stock,
        unitOfMeasure: p.unidadMedida,
        type: p.tipoItem,
        isActive: p.activo
      });
      refetch();
      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }, [refetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/v1/products/${id}`);
      refetch();
      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }, [refetch]);

  return { data, loading, error, refetch: refetch as any, create, update, remove } as any;
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
    api.get<any>('/v1/invoices')
      .then((res: any) => {
        if (!active) return;
        const items = Array.isArray(res) ? res : (res?.data || []);
        const mapped: DocumentoElectronico[] = items.map((i: any) => {
          let estadoDian: DocumentoElectronico['estadoDian'] = 'borrador';
          if (i.status === 'accepted') estadoDian = 'aceptado';
          else if (i.status === 'rejected') estadoDian = 'rechazado';
          else if (i.status === 'queued' || i.status === 'submitted') estadoDian = 'pendiente_envio';
          else if (i.status === 'draft') estadoDian = 'borrador';

          return {
            id: i.id,
            tipoDocumento: 'factura_venta',
            tipoOperacion: 'estandar',
            numero: i.number,
            resolucionId: i.prefix || '',
            clienteId: i.customerId || '',
            cliente: {} as any,
            items: [],
            formaPago: 'contado',
            medioPago: (i.paymentMethodCode as any) || 'efectivo',
            subtotal: Number(i.subtotal) || 0,
            totalIva: Number(i.totalTax) || 0,
            totalInc: 0,
            totalRetenciones: 0,
            totalDescuentos: 0,
            totalCargos: 0,
            total: Number(i.totalAmount) || 0,
            estadoDian,
            cufe: i.cufe,
            qrCode: i.qrCode,
            urlPdf: `/v1/invoices/${i.id}/pdf`,
            urlXml: `/v1/invoices/${i.id}/xml`,
            ambiente: 'habilitacion',
            fechaEmision: i.issueDate || i.createdAt,
            moneda: 'COP',
            createdAt: i.createdAt || new Date().toISOString(),
          };
        });
        setData(mapped);
        setError(null);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err.message || 'Error al cargar documentos');
        setData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useDocumentoById — single document with items
// ============================================================================

interface ItemDocumentoRow {
  id: string;
  documento_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number | null;
  iva: number;
  subtotal: number;
  tributos: unknown;
  unidad_medida: string | null;
  codigo_unspsc: string | null;
}

function mapItemDocumento(r: ItemDocumentoRow): ItemFactura {
  return {
    productoId: r.producto_id || '',
    descripcion: r.descripcion,
    cantidad: Number(r.cantidad),
    precioUnitario: Number(r.precio_unitario),
    descuento: r.descuento ? Number(r.descuento) : 0,
    iva: Number(r.iva),
    subtotal: Number(r.subtotal),
    tributos: (r.tributos as ItemFactura['tributos']) || undefined,
    unidadMedida: (r.unidad_medida as ItemFactura['unidadMedida']) || undefined,
    codigoUNSPSC: r.codigo_unspsc || undefined,
  };
}

export function useDocumentoById(id: string | undefined) {
  const [data, setData] = useState<DocumentoElectronico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      setData(null);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      const { data: docRow, error: err } = await supabase
        .from('documentos_electronicos')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!active) return;
      if (err || !docRow) {
        setError(err?.message ?? 'Documento no encontrado');
        setData(null);
        setLoading(false);
        return;
      }
      const doc = mapDocumento(docRow as DocumentoRow);
      const { data: itemRows } = await supabase
        .from('items_documento')
        .select('*')
        .eq('documento_id', id);
      if (!active) return;
      doc.items = (itemRows as ItemDocumentoRow[] | null)?.map(mapItemDocumento) ?? [];
      setData(doc);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, tick]);

  return { data, loading, error, refetch };
}

// ============================================================================

export function useResoluciones(): QueryState<ResolucionDian> & {
  create: (r: Partial<ResolucionDian>) => Promise<ResolucionDian | null>;
  remove: (id: string) => Promise<boolean>;
} {
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

  const create = useCallback(async (r: Partial<ResolucionDian>): Promise<ResolucionDian | null> => {
    const insertRow = {
      numero_resolucion: r.numeroResolucion,
      tipo_documento: r.tipoDocumento || 'factura_venta',
      prefijo: r.prefijo,
      rango_desde: r.rangoDesde ?? 1,
      rango_hasta: r.rangoHasta ?? 10000,
      consecutivo_actual: r.rangoDesde ?? 1,
      fecha_vigencia_desde: r.fechaVigenciaDesde,
      fecha_vigencia_hasta: r.fechaVigenciaHasta,
      activa: r.activa ?? true,
      clave_tecnica: r.claveTecnica || null,
    };
    const { data: row, error: err } = await supabase
      .from('resoluciones')
      .insert(insertRow)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return null;
    }
    const mapped: ResolucionDian = {
      id: (row as Record<string, unknown>).id as string,
      numeroResolucion: (row as Record<string, unknown>).numero_resolucion as string,
      tipoDocumento: (row as Record<string, unknown>).tipo_documento as ResolucionDian['tipoDocumento'],
      prefijo: (row as Record<string, unknown>).prefijo as string,
      rangoDesde: (row as Record<string, unknown>).rango_desde as number,
      rangoHasta: (row as Record<string, unknown>).rango_hasta as number,
      consecutivoActual: (row as Record<string, unknown>).consecutivo_actual as number,
      fechaVigenciaDesde: (row as Record<string, unknown>).fecha_vigencia_desde as string,
      fechaVigenciaHasta: (row as Record<string, unknown>).fecha_vigencia_hasta as string,
      activa: (row as Record<string, unknown>).activa as boolean,
      claveTecnica: ((row as Record<string, unknown>).clave_tecnica as string) || undefined,
    };
    setData((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('resoluciones').delete().eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.filter((r) => r.id !== id));
    return true;
  }, []);

  return { data, loading, error, refetch, create, remove };
}

// ============================================================================
// useProveedores
// ============================================================================

export function useProveedores(): QueryState<Proveedor> & {
  create: (p: Partial<Proveedor>) => Promise<Proveedor | null>;
  update: (id: string, p: Partial<Proveedor>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
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

  const create = useCallback(async (p: Partial<Proveedor>): Promise<Proveedor | null> => {
    const insertRow = {
      tipo_identificacion: p.tipoIdentificacion,
      identificacion: p.identificacion,
      dv: p.dv || null,
      razon_social: p.razonSocial,
      nombre_comercial: p.nombreComercial || null,
      email: p.email || null,
      telefono: p.telefono || null,
      direccion: p.direccion || null,
      ciudad: p.ciudad || null,
      departamento: p.departamento || null,
      regimen_tributario: p.regimenTributario || 'responsable_iva',
      responsabilidades_fiscales: p.responsabilidadesFiscales || [],
      codigo_ciiu: p.codigoCIIU || null,
      persona: p.persona || 'juridica',
      banco: p.banco || null,
      tipo_cuenta: p.tipoCuenta || null,
      numero_cuenta: p.numeroCuenta || null,
      forma_pago_preferida: p.formaPagoPreferida || null,
      plazo_pago_dias: p.plazoPagoDias ?? null,
      activo: p.activo ?? true,
    };
    const { data: row, error: err } = await supabase
      .from('proveedores')
      .insert(insertRow)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return null;
    }
    const r = row as Record<string, unknown>;
    const mapped: Proveedor = {
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
    };
    setData((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, p: Partial<Proveedor>): Promise<boolean> => {
    const updateRow: Record<string, unknown> = {};
    if (p.tipoIdentificacion) updateRow.tipo_identificacion = p.tipoIdentificacion;
    if (p.identificacion) updateRow.identificacion = p.identificacion;
    if (p.dv !== undefined) updateRow.dv = p.dv || null;
    if (p.razonSocial) updateRow.razon_social = p.razonSocial;
    if (p.nombreComercial !== undefined) updateRow.nombre_comercial = p.nombreComercial || null;
    if (p.email !== undefined) updateRow.email = p.email || null;
    if (p.telefono !== undefined) updateRow.telefono = p.telefono || null;
    if (p.direccion !== undefined) updateRow.direccion = p.direccion || null;
    if (p.ciudad !== undefined) updateRow.ciudad = p.ciudad || null;
    if (p.departamento !== undefined) updateRow.departamento = p.departamento || null;
    if (p.regimenTributario) updateRow.regimen_tributario = p.regimenTributario;
    if (p.responsabilidadesFiscales) updateRow.responsabilidades_fiscales = p.responsabilidadesFiscales;
    if (p.codigoCIIU !== undefined) updateRow.codigo_ciiu = p.codigoCIIU || null;
    if (p.banco !== undefined) updateRow.banco = p.banco || null;
    if (p.tipoCuenta !== undefined) updateRow.tipo_cuenta = p.tipoCuenta || null;
    if (p.numeroCuenta !== undefined) updateRow.numero_cuenta = p.numeroCuenta || null;
    if (p.formaPagoPreferida !== undefined) updateRow.forma_pago_preferida = p.formaPagoPreferida || null;
    if (p.plazoPagoDias !== undefined) updateRow.plazo_pago_dias = p.plazoPagoDias;
    if (p.activo !== undefined) updateRow.activo = p.activo;

    const { error: err } = await supabase.from('proveedores').update(updateRow).eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.map((pr) => (pr.id === id ? { ...pr, ...p } : pr)));
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('proveedores').delete().eq('id', id);
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
  const [data, setData] = useState<any[]>([]);
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

// ============================================================================
// useInventario
// ============================================================================

export function useInventario(productos: Producto[]): QueryState<InventarioItem> & {
  registrarMovimiento: (m: {
    productoId: string;
    tipo: MovimientoInventario['tipo'];
    cantidad: number;
    motivo?: string;
    referencia?: string;
    proveedorId?: string;
  }) => Promise<boolean>;
} {
  const [data, setData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const movements = (await api.get<any[]>('/v1/inventory/movements')) || [];
        if (!active) return;
        const prodMap = new Map(productos.map((p) => [p.id, p]));
        const byProduct = new Map<string, { stock: number; ultimo: string; costo: number }>();
        for (const m of movements) {
          const pid = m.product?.id || m.productId;
          if (!pid) continue;
          const prev = byProduct.get(pid);
          const qty = Number(m.quantity) || 0;
          const sign = m.type === 'IN' ? 1 : (m.type === 'OUT' ? -1 : 0);
          const delta = sign * Math.abs(qty);
          if (prev) {
            prev.stock += delta;
            if (new Date(m.createdAt) > new Date(prev.ultimo)) prev.ultimo = m.createdAt;
          } else {
            const prod = prodMap.get(pid);
            byProduct.set(pid, {
              stock: delta,
              ultimo: m.createdAt,
              costo: prod?.costoUnitario || prod?.precioUnitario || 0,
            });
          }
        }
        setError(null);
        setData(
          Array.from(byProduct.entries()).map(([pid, v]) => ({
            id: pid,
            productoId: pid,
            producto: prodMap.get(pid) || ({} as Producto),
            stockActual: v.stock,
            stockMinimo: 0,
            stockMaximo: 0,
            costoUnitario: v.costo,
            valorizado: v.stock * v.costo,
            ultimoMovimiento: v.ultimo,
          }))
        );
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Error loading inventory');
        setData([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tick, productos]);

  const registrarMovimiento = useCallback(
    async (m: {
      productoId: string;
      tipo: MovimientoInventario['tipo'];
      cantidad: number;
      motivo?: string;
      referencia?: string;
      proveedorId?: string;
    }): Promise<boolean> => {
      try {
        const tipoMap: Record<string, 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'> = {
          entrada: 'IN',
          salida: 'OUT',
          ajuste: 'ADJUST',
          devolucion: 'TRANSFER',
        };
        await api.post('/v1/inventory/movements', {
          productId: m.productoId,
          type: tipoMap[m.tipo] || 'ADJUST',
          quantity: Math.abs(m.cantidad),
          reason: m.motivo || m.referencia || undefined,
          reference: m.proveedorId || m.referencia || undefined,
        });
        refetch();
        return true;
      } catch (e: any) {
        console.error('[useInventario] registrarMovimiento error:', e);
        setError(e?.message || 'Error al registrar movimiento');
        return false;
      }
    },
    [refetch]
  );

  return { data, loading, error, refetch, registrarMovimiento };
}

// ============================================================================
// useMovimientosInventario
// ============================================================================

export function useMovimientosInventario(productos: Producto[]): QueryState<MovimientoInventario> {
  const [data, setData] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('movimientos_inventario')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(100);
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        const prodMap = new Map(productos.map((p) => [p.id, p]));
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            productoId: r.producto_id as string,
            producto: prodMap.get(r.producto_id as string) || ({} as Producto),
            tipo: r.tipo as MovimientoInventario['tipo'],
            cantidad: r.cantidad as number,
            stockResultante: r.stock_resultante as number,
            motivo: (r.motivo as string) || undefined,
            referencia: (r.referencia as string) || undefined,
            usuario: r.usuario as string,
            fecha: r.fecha as string,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick, productos]);

  return { data, loading, error, refetch };
}

// ============================================================================
// useProductosFacturacion
// ============================================================================

export function useProductosFacturacion(productos: Producto[]): QueryState<ProductoFacturacion> & {
  create: (p: Partial<ProductoFacturacion>) => Promise<ProductoFacturacion | null>;
  update: (id: string, p: Partial<ProductoFacturacion>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<ProductoFacturacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from('productos_facturacion')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        const prodMap = new Map(productos.map((p) => [p.id, p]));
        setData(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            productoId: r.producto_id as string,
            producto: prodMap.get(r.producto_id as string) || ({} as Producto),
            categoria: r.categoria as ProductoFacturacion['categoria'],
            precioConImpuestos: Number(r.precio_con_impuestos),
            tributos: (r.tributos || []) as ProductoFacturacion['tributos'],
            codigoEstandar: (r.codigo_estandar as string) || '',
            codigoUNSPSC: (r.codigo_unspsc as string) || '',
            unidadMedidaDIAN: ((r.unidad_medida_dian as string) || 'UND') as ProductoFacturacion['unidadMedidaDIAN'],
            cuentaContableVentas: (r.cuenta_contable_ventas as string) || '',
            cuentaContableCompras: (r.cuenta_contable_compras as string) || '',
            requiereExportacion: r.requiere_exportacion as boolean,
            excluidoDeIva: r.excluido_de_iva as boolean,
            bienDeCapital: r.bien_de_capital as boolean,
            activo: r.activo as boolean,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick, productos]);

  const create = useCallback(async (p: Partial<ProductoFacturacion>): Promise<ProductoFacturacion | null> => {
    const insertRow = {
      producto_id: p.productoId,
      categoria: p.categoria || 'otros',
      precio_con_impuestos: p.precioConImpuestos || 0,
      tributos: p.tributos || [],
      codigo_estandar: p.codigoEstandar || null,
      codigo_unspsc: p.codigoUNSPSC || null,
      unidad_medida_dian: p.unidadMedidaDIAN || null,
      cuenta_contable_ventas: p.cuentaContableVentas || null,
      cuenta_contable_compras: p.cuentaContableCompras || null,
      requiere_exportacion: p.requiereExportacion || false,
      excluido_de_iva: p.excluidoDeIva || false,
      bien_de_capital: p.bienDeCapital || false,
      activo: p.activo ?? true,
    };
    const { data: row, error: err } = await supabase
      .from('productos_facturacion')
      .insert(insertRow)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return null;
    }
    const r = row as Record<string, unknown>;
    const mapped: ProductoFacturacion = {
      id: r.id as string,
      productoId: r.producto_id as string,
      producto: {} as Producto,
      categoria: r.categoria as ProductoFacturacion['categoria'],
      precioConImpuestos: Number(r.precio_con_impuestos),
      tributos: (r.tributos || []) as ProductoFacturacion['tributos'],
      codigoEstandar: (r.codigo_estandar as string) || '',
      codigoUNSPSC: (r.codigo_unspsc as string) || '',
      unidadMedidaDIAN: ((r.unidad_medida_dian as string) || 'UND') as ProductoFacturacion['unidadMedidaDIAN'],
      cuentaContableVentas: (r.cuenta_contable_ventas as string) || '',
      cuentaContableCompras: (r.cuenta_contable_compras as string) || '',
      requiereExportacion: r.requiere_exportacion as boolean,
      excluidoDeIva: r.excluido_de_iva as boolean,
      bienDeCapital: r.bien_de_capital as boolean,
      activo: r.activo as boolean,
    };
    setData((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, p: Partial<ProductoFacturacion>): Promise<boolean> => {
    const updateRow: Record<string, unknown> = {};
    if (p.categoria) updateRow.categoria = p.categoria;
    if (p.precioConImpuestos !== undefined) updateRow.precio_con_impuestos = p.precioConImpuestos;
    if (p.tributos !== undefined) updateRow.tributos = p.tributos;
    if (p.codigoEstandar !== undefined) updateRow.codigo_estandar = p.codigoEstandar || null;
    if (p.codigoUNSPSC !== undefined) updateRow.codigo_unspsc = p.codigoUNSPSC || null;
    if (p.unidadMedidaDIAN !== undefined) updateRow.unidad_medida_dian = p.unidadMedidaDIAN || null;
    if (p.cuentaContableVentas !== undefined) updateRow.cuenta_contable_ventas = p.cuentaContableVentas || null;
    if (p.cuentaContableCompras !== undefined) updateRow.cuenta_contable_compras = p.cuentaContableCompras || null;
    if (p.requiereExportacion !== undefined) updateRow.requiere_exportacion = p.requiereExportacion;
    if (p.excluidoDeIva !== undefined) updateRow.excluido_de_iva = p.excluidoDeIva;
    if (p.bienDeCapital !== undefined) updateRow.bien_de_capital = p.bienDeCapital;
    if (p.activo !== undefined) updateRow.activo = p.activo;

    const { error: err } = await supabase.from('productos_facturacion').update(updateRow).eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => prev.map((pr) => (pr.id === id ? { ...pr, ...p } : pr)));
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('productos_facturacion').delete().eq('id', id);
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
// useEmpresa — Configuración de empresa (emisor)
// ============================================================================

interface EmpresaRow {
  id: string;
  nit: string;
  dv: string | null;
  razon_social: string;
  nombre_comercial: string | null;
  regimen_tributario: string;
  responsabilidades_fiscales: string[];
  codigo_ciiu: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  codigo_postal: string | null;
  telefono: string | null;
  email: string | null;
  logo_url: string | null;
  ambiente: string;
  certificado_digital_cargado: boolean;
  fecha_vencimiento_certificado: string | null;
  moneda_local: string;
  cuenta_contable_ventas: string | null;
  retenedor: boolean | null;
  gran_contribuyente: boolean | null;
  brevo_email_sender: string | null;
  brevo_whatsapp_sender: string | null;
}

function mapEmpresa(r: EmpresaRow): ConfiguracionEmpresa {
  return {
    id: r.id,
    nit: r.nit,
    dv: r.dv || '',
    razonSocial: r.razon_social,
    nombreComercial: r.nombre_comercial || undefined,
    regimenTributario: r.regimen_tributario as ConfiguracionEmpresa['regimenTributario'],
    responsabilidadesFiscales: (r.responsabilidades_fiscales || []) as ConfiguracionEmpresa['responsabilidadesFiscales'],
    codigoCIIU: r.codigo_ciiu || undefined,
    direccion: r.direccion || '',
    ciudad: r.ciudad || '',
    departamento: r.departamento || '',
    codigoPostal: r.codigo_postal || undefined,
    telefono: r.telefono || '',
    email: r.email || '',
    logoUrl: r.logo_url || undefined,
    ambiente: r.ambiente as ConfiguracionEmpresa['ambiente'],
    certificadoDigitalCargado: r.certificado_digital_cargado,
    fechaVencimientoCertificado: r.fecha_vencimiento_certificado || undefined,
    monedaLocal: r.moneda_local as ConfiguracionEmpresa['monedaLocal'],
    cuentaContableVentas: r.cuenta_contable_ventas || undefined,
    retenedor: r.retenedor ?? false,
    granContribuyente: r.gran_contribuyente ?? false,
    brevoEmailSender: r.brevo_email_sender || undefined,
    brevoWhatsappSender: r.brevo_whatsapp_sender || undefined,
  };
}

export function useEmpresa() {
  const [data, setData] = useState<ConfiguracionEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase
        .from('empresas')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (err) {
        setError(err.message);
      } else if (rows) {
        setData(mapEmpresa(rows as EmpresaRow));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  const update = useCallback(async (patch: Partial<ConfiguracionEmpresa>): Promise<boolean> => {
    if (!data) return false;
    const updateRow: Record<string, unknown> = {};
    if (patch.nit !== undefined) updateRow.nit = patch.nit;
    if (patch.dv !== undefined) updateRow.dv = patch.dv;
    if (patch.razonSocial !== undefined) updateRow.razon_social = patch.razonSocial;
    if (patch.nombreComercial !== undefined) updateRow.nombre_comercial = patch.nombreComercial || null;
    if (patch.regimenTributario !== undefined) updateRow.regimen_tributario = patch.regimenTributario;
    if (patch.responsabilidadesFiscales !== undefined) updateRow.responsabilidades_fiscales = patch.responsabilidadesFiscales;
    if (patch.codigoCIIU !== undefined) updateRow.codigo_ciiu = patch.codigoCIIU || null;
    if (patch.direccion !== undefined) updateRow.direccion = patch.direccion;
    if (patch.ciudad !== undefined) updateRow.ciudad = patch.ciudad;
    if (patch.departamento !== undefined) updateRow.departamento = patch.departamento;
    if (patch.codigoPostal !== undefined) updateRow.codigo_postal = patch.codigoPostal || null;
    if (patch.telefono !== undefined) updateRow.telefono = patch.telefono;
    if (patch.email !== undefined) updateRow.email = patch.email;
    if (patch.logoUrl !== undefined) updateRow.logo_url = patch.logoUrl || null;
    if (patch.ambiente !== undefined) updateRow.ambiente = patch.ambiente;
    if (patch.certificadoDigitalCargado !== undefined) updateRow.certificado_digital_cargado = patch.certificadoDigitalCargado;
    if (patch.fechaVencimientoCertificado !== undefined) updateRow.fecha_vencimiento_certificado = patch.fechaVencimientoCertificado || null;
    if (patch.monedaLocal !== undefined) updateRow.moneda_local = patch.monedaLocal;
    if (patch.cuentaContableVentas !== undefined) updateRow.cuenta_contable_ventas = patch.cuentaContableVentas || null;
    if (patch.retenedor !== undefined) updateRow.retenedor = patch.retenedor;
    if (patch.granContribuyente !== undefined) updateRow.gran_contribuyente = patch.granContribuyente;
    if (patch.brevoEmailSender !== undefined) updateRow.brevo_email_sender = patch.brevoEmailSender || null;
    if (patch.brevoWhatsappSender !== undefined) updateRow.brevo_whatsapp_sender = patch.brevoWhatsappSender || null;

    const { error: err } = await supabase.from('empresas').update(updateRow).eq('id', data.id);
    if (err) {
      setError(err.message);
      return false;
    }
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
    return true;
  }, [data]);

  return { data, loading, error, refetch, update };
}
