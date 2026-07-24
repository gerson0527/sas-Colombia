// ============================================================================
// Tipos de dominio — Facturación electrónica Colombia (DIAN, UBL 2.1)
// ============================================================================

export type EstadoDian =
  | 'borrador'
  | 'pendiente_envio'
  | 'enviado'
  | 'aceptado'
  | 'rechazado'
  | 'anulado';

export type TipoDocumento =
  | 'factura_venta'
  | 'nota_credito'
  | 'nota_debito'
  | 'documento_soporte'
  | 'nota_ajuste';

export type Ambiente = 'habilitacion' | 'produccion';

export type RegimenTributario =
  | 'responsable_iva'
  | 'no_responsable'
  | 'regimen_simple';

export type TipoIdentificacion = 'CC' | 'NIT' | 'CE' | 'PASAPORTE' | 'TI' | 'PPT';

export type FormaPago = 'contado' | 'credito';

export type MedioPago =
  | 'efectivo'
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'transferencia'
  | 'nequi'
  | 'daviplata'
  | 'bonos'
  | 'canje'
  | 'otros';

export type RolUsuario = 'admin' | 'supervisor' | 'cajero' | 'contador' | 'solo_lectura';

export type Permiso =
  | 'pos_sell'
  | 'discount_within_limit'
  | 'discount_beyond_limit'
  | 'manage_own_cash'
  | 'manage_others_cash'
  | 'void_dian_document'
  | 'resend_dian_document'
  | 'view_financial_reports'
  | 'export_reports'
  | 'manage_clients'
  | 'manage_products'
  | 'manage_resolutions'
  | 'view_resolutions'
  | 'manage_company'
  | 'manage_users';

// --- Tributos DIAN (UBL 2.1) ---

export type TipoTributo =
  | 'iva'
  | 'inc'
  | 'retefuente'
  | 'reteica'
  | 'reteiva'
  | 'reteiva_cree'
  | 'sobretasa'
  | 'bolsas';

export interface TributoInfo {
  tipo: TipoTributo;
  porcentaje: number;
  baseImponible: number;
  valor: number;
  codigoDIAN?: string;
  esRetencion?: boolean;
}

// --- Responsabilidades fiscales (RUT) ---

export type ResponsabilidadFiscal =
  | 'O-01' // No responsable
  | 'O-02' // No responsable (régimen simple)
  | 'O-03' // Responsable de IVA
  | 'O-07' // Autorretenedor
  | 'O-08' // Gran contribuyente
  | 'O-09' // Agente de retención IVA
  | 'O-10' // Autorretenedor ReteFuente
  | 'O-11' // Autorretenedor ReteIVA
  | 'O-12' // Autorretenedor ReteICA
  | 'O-13' // No responsable + autorretenedor
  | 'O-14' // No responsable + agente de retención IVA
  | 'O-15' // Gran contribuyente + autorretenedor
  | 'O-16' // Gran contribuyente + agente de retención IVA
  | 'O-17' // Gran contribuyente + autorretenedor + agente de retención IVA
  | 'O-18' // Gran contribuyente + autorretenedor + agente de retención IVA y ReteICA
  | 'O-19' // Autorretenedor + agente de retención IVA
  | 'O-20' // Autorretenedor + agente de retención IVA y ReteICA
  | 'O-21' // Autorretenedor + agente de retención ReteICA
  | 'O-22' // Autorretenedor + agente de retención ReteIVA
  | 'O-23' // Autorretenedor + agente de retención ReteIVA y ReteICA
  | 'O-24' // Agente de retención ReteIVA y ReteICA
  | 'O-25' // No responsable + autorretenedor + agente de retención IVA
  | 'O-26' // No responsable + autorretenedor + agente de retención ReteICA
  | 'O-27' // No responsable + autorretenedor + agente de retención ReteIVA
  | 'O-28' // No responsable + autorretenedor + agente de retención ReteIVA y ReteICA
  | 'O-29' // No responsable + agente de retención ReteIVA
  | 'O-30' // No responsable + agente de retención ReteICA
  | 'O-31' // Responsable de IVA + autorretenedor
  | 'O-32' // Responsable de IVA + agente de retención IVA
  | 'O-33' // Responsable de IVA + autorretenedor + agente de retención IVA
  | 'O-34' // Responsable de IVA + autorretenedor + agente de retención ReteICA
  | 'O-35' // Responsable de IVA + autorretenedor + agente de retención ReteIVA
  | 'O-36' // Responsable de IVA + autorretenedor + agente de retención ReteIVA y ReteICA
  | 'O-37' // Responsable de IVA + agente de retención ReteICA
  | 'O-38' // Responsable de IVA + autorretenedor + agente de retención IVA y ReteICA
  | 'O-39' // Responsable de IVA + agente de retención ReteIVA
  | 'O-40' // Responsable de IVA + agente de retención ReteIVA y ReteICA
  | 'O-47' // Régimen simple de tributación
  | 'R-99-PJ'; // Régimen simple (persona jurídica)

// --- Tipo de operación y moneda ---

export type TipoOperacion = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30' | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40' | '41' | '42' | '43' | '44' | '45' | '46' | '47' | '48' | '49';

export type Moneda = 'COP' | 'USD' | 'EUR';

// --- Descuentos y cargos a nivel documento ---

export type TipoAllowanceCharge = 'descuento' | 'cargo';

export interface AllowanceCharge {
  tipo: TipoAllowanceCharge;
  razon: string;
  base: number;
  porcentaje?: number;
  valor: number;
}

// --- Cuotas (pago a crédito) ---

export interface CuotaPago {
  id: string;
  numero: number;
  monto: number;
  fechaVencimiento: string;
  pagada: boolean;
  fechaPago?: string;
}

// --- Información de entrega ---

export interface InfoEntrega {
  fechaEntrega?: string;
  direccionEntrega?: string;
  ciudadEntrega?: string;
  departamentoEntrega?: string;
  nombreRecibe?: string;
  identificacionRecibe?: string;
}

// --- Referencia a otro documento (notas) ---

export interface DocumentoReferencia {
  tipoDocumento: TipoDocumento;
  numero: string;
  cufe: string;
  razonReferencia?: string;
}

// --- Cliente (con campos fiscales DIAN) ---

export interface Cliente {
  id: string;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  dv?: string;
  razonSocial: string;
  nombreComercial?: string;
  email: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  regimenTributario: RegimenTributario;
  responsabilidadesFiscales: ResponsabilidadFiscal[];
  codigoCIIU?: string;
  codigoPostal?: string;
  persona: 'natural' | 'juridica';
  regimenSimple?: boolean;
  createdAt: string;
}

// --- Producto / servicio (catálogo de facturación) ---

export type TipoItem = 'bien' | 'servicio';
export type UnidadMedidaDIAN = 'UND' | 'KGM' | 'LTR' | 'MTR' | 'MTK' | 'HUR' | 'DIA' | 'SER' | 'Caja' | 'Docena' | 'Caja13' | 'Caja12' | 'Caja6' | 'Caja4' | 'Paquete' | 'Rollo' | 'Litro' | 'Gramo' | 'Tonelada' | 'Metro' | 'Metro2' | 'Metro3' | 'Kilometro' | 'Par' | 'Juego' | 'Millar';

export interface Producto {
  id: string;
  codigo: string;
  codigoUNSPSC?: string;
  nombre: string;
  descripcion?: string;
  tipoItem: TipoItem;
  precioUnitario: number;
  unidadMedida: UnidadMedidaDIAN;
  iva: number;
  inc?: number;
  aplicaReteFuente: boolean;
  aplicaReteICA: boolean;
  aplicaReteIVA: boolean;
  tasaReteFuente?: number;
  tasaReteICA?: number;
  tasaReteIVA?: number;
  stock?: number;
  stockMinimo?: number;
  costoUnitario?: number;
  cuentaContable?: string;
  tributos?: TributoInfo[];
  activo: boolean;
}

// --- Item de factura (línea del documento) ---

export interface ItemFactura {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  iva: number;
  subtotal: number;
  tributos?: TributoInfo[];
  unidadMedida?: UnidadMedidaDIAN;
  codigoUNSPSC?: string;
}

// --- Documento electrónico completo ---

export interface DocumentoElectronico {
  id: string;
  tipoDocumento: TipoDocumento;
  tipoOperacion: TipoOperacion;
  numero: string;
  resolucionId: string;
  clienteId: string;
  cliente: Cliente;
  items: ItemFactura[];
  formaPago: FormaPago;
  medioPago: MedioPago;
  cuotas?: CuotaPago[];
  subtotal: number;
  totalIva: number;
  totalInc: number;
  totalRetenciones: number;
  totalDescuentos: number;
  totalCargos: number;
  total: number;
  estadoDian: EstadoDian;
  cufe?: string;
  cude?: string;
  qrCode?: string;
  urlXml?: string;
  urlPdf?: string;
  ambiente: Ambiente;
  motivoRechazo?: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  moneda: Moneda;
  observaciones?: string;
  infoEntrega?: InfoEntrega;
  documentoReferencia?: DocumentoReferencia;
  allowancesCharges?: AllowanceCharge[];
  createdAt: string;
}

// --- Resolución DIAN ---

export interface ResolucionDian {
  id: string;
  numeroResolucion: string;
  tipoDocumento: TipoDocumento;
  prefijo: string;
  rangoDesde: number;
  rangoHasta: number;
  consecutivoActual: number;
  fechaVigenciaDesde: string;
  fechaVigenciaHasta: string;
  activa: boolean;
  claveTecnica?: string;
}

// --- Configuración de empresa (emisor) ---

export interface ConfiguracionEmpresa {
  id: string;
  nit: string;
  dv: string;
  razonSocial: string;
  nombreComercial?: string;
  regimenTributario: RegimenTributario;
  responsabilidadesFiscales: ResponsabilidadFiscal[];
  codigoCIIU?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigoPostal?: string;
  telefono: string;
  email: string;
  logoUrl?: string;
  ambiente: Ambiente;
  certificadoDigitalCargado: boolean;
  fechaVencimientoCertificado?: string;
  monedaLocal: Moneda;
  cuentaContableVentas?: string;
  retenedor?: boolean;
  granContribuyente?: boolean;
  // Notificaciones (Brevo)
  brevoEmailSender?: string;       // correo remitente validado en Brevo
  brevoWhatsappSender?: string;    // número WA registrado en Brevo (con código país, sin +)
}

// --- Usuario ---

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  pin?: string;
  estado: 'activo' | 'pendiente' | 'inactivo';
  ultimoAcceso?: string;
}

// --- Sesión activa (para el contexto de permisos) ---

export interface SesionUsuario {
  usuario: Usuario;
  tenantId: string;
  tenantNombre: string;
  limiteDescuento: number;
}

// --- POS: venta rápida ---

export interface SesionCaja {
  id: string;
  cashRegisterId: string;
  branchId: string;
  openedBy: string;
  openedByUser?: { id: string; fullName: string };
  closedBy?: string;
  closedByUser?: { id: string; fullName: string };
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed' | 'reconciled' | 'voided';
  openedAt: string;
  closedAt?: string;
  closeNotes?: string;
}

export interface CartItem {
  uid: string;
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  descuento: number;
  iva: number;
  inc: number;
}

export interface VentaPOS {
  id: string;
  items: CartItem[];
  clienteId: string;
  clienteNombre: string;
  formaPago: FormaPago;
  medioPago: MedioPago;
  efectivoRecibido?: number;
  vueltas?: number;
  descuentoTotal: number;
  subtotal: number;
  totalIva: number;
  totalInc: number;
  total: number;
  estadoDian: EstadoDian;
  cufe?: string;
  qrCode?: string;
  numero?: string;
  motivoRechazo?: string;
  fecha: string;
  sesionCajaId: string;
}

// --- Dashboard ---

export interface DashboardSummary {
  facturasMes: number;
  pendientesEnvio: number;
  rechazadas: number;
  ingresosTotales: number;
  ventasPorMes: { mes: string; total: number }[];
  distribucionEstados: { estado: EstadoDian; cantidad: number }[];
  ultimosDocumentos: DocumentoElectronico[];
  certificadoPorVencer: boolean;
  resolucionPorAgotar: boolean;
}

// ============================================================================
// Inventario
// ============================================================================

export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste' | 'devolucion' | 'transferencia';

export interface InventarioItem {
  id: string;
  productoId: string;
  producto: Producto;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  ubicacion?: string;
  costoUnitario: number;
  valorizado: number;
  ultimoMovimiento: string;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  producto: Producto;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  stockResultante: number;
  motivo?: string;
  referencia?: string;
  proveedorId?: string;
  documentoElectronicoId?: string;
  usuario: string;
  fecha: string;
}

// ============================================================================
// Proveedores
// ============================================================================

export interface Proveedor {
  id: string;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  dv?: string;
  razonSocial: string;
  nombreComercial?: string;
  email: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  regimenTributario: RegimenTributario;
  responsabilidadesFiscales: ResponsabilidadFiscal[];
  codigoCIIU?: string;
  persona: 'natural' | 'juridica';
  banco?: string;
  tipoCuenta?: 'ahorros' | 'corriente';
  numeroCuenta?: string;
  formaPagoPreferida?: FormaPago;
  plazoPagoDias?: number;
  activo: boolean;
  createdAt: string;
}

// ============================================================================
// Cajas (POS / turnos de caja)
// ============================================================================

export type EstadoCaja = 'abierta' | 'cerrada';
export type TipoMovimientoCaja = 'ingreso' | 'egreso' | 'venta' | 'pago' | 'reembolso';

export interface Caja {
  id: string;
  nombre: string;
  sucursal: string;
  responsableActual?: string;
  activa: boolean;
  saldoBase: number;
}

export interface MovimientoCaja {
  id: string;
  sesionId: string;
  tipo: TipoMovimientoCaja;
  monto: number;
  concepto: string;
  medioPago?: MedioPago;
  documentoElectronicoId?: string;
  usuario: string;
  fecha: string;
}



// ============================================================================
// Productos de facturación (configuración avanzada DIAN)
// ============================================================================

export type CategoriaProductoFacturacion = 'servicios' | 'bienes' | 'combustibles' | 'alimentos' | 'tecnologia' | 'papeleria' | 'otros';

export interface ProductoFacturacion {
  id: string;
  productoId: string;
  producto: Producto;
  categoria: CategoriaProductoFacturacion;
  precioConImpuestos: number;
  tributos: TributoInfo[];
  codigoEstandar: string;
  codigoUNSPSC: string;
  unidadMedidaDIAN: UnidadMedidaDIAN;
  cuentaContableVentas: string;
  cuentaContableCompras: string;
  requiereExportacion: boolean;
  excluidoDeIva: boolean;
  bienDeCapital: boolean;
  activo: boolean;
}
