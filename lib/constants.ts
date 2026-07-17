import type {
  EstadoDian,
  TipoDocumento,
  RegimenTributario,
  FormaPago,
  MedioPago,
  TipoIdentificacion,
  RolUsuario,
  Ambiente,
  TipoOperacion,
  Moneda,
  ResponsabilidadFiscal,
  TipoTributo,
  UnidadMedidaDIAN,
  TipoMovimientoInventario,
  TipoMovimientoCaja,
  EstadoCaja,
  CategoriaProductoFacturacion,
  Permiso,
} from './types';

export const USE_MOCK_DATA = true;

export const ESTADO_DIAN_META: Record<
  EstadoDian,
  { label: string; tone: string; dot: string }
> = {
  borrador: {
    label: 'Borrador',
    tone: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
    dot: 'bg-muted-foreground',
  },
  pendiente_envio: {
    label: 'Pendiente envío',
    tone: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/25',
    dot: 'bg-warning',
  },
  enviado: {
    label: 'Enviado',
    tone: 'bg-info/15 text-info border-info/30 hover:bg-info/25',
    dot: 'bg-info',
  },
  aceptado: {
    label: 'Aceptado',
    tone: 'bg-success/15 text-success border-success/30 hover:bg-success/25',
    dot: 'bg-success',
  },
  rechazado: {
    label: 'Rechazado',
    tone: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25',
    dot: 'bg-destructive',
  },
  anulado: {
    label: 'Anulado',
    tone: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
    dot: 'bg-muted-foreground/60',
  },
};

export const TIPO_DOCUMENTO_META: Record<TipoDocumento, { label: string }> = {
  factura_venta: { label: 'Factura de Venta' },
  nota_credito: { label: 'Nota Crédito' },
  nota_debito: { label: 'Nota Débito' },
  documento_soporte: { label: 'Documento Soporte' },
  nota_ajuste: { label: 'Nota de Ajuste' },
};

export const REGIMEN_META: Record<RegimenTributario, { label: string }> = {
  responsable_iva: { label: 'Responsable de IVA' },
  no_responsable: { label: 'No responsable' },
  regimen_simple: { label: 'Régimen Simple' },
};

export const FORMA_PAGO_META: Record<FormaPago, { label: string; codigo: string }> = {
  contado: { label: 'Contado', codigo: '1' },
  credito: { label: 'Crédito', codigo: '2' },
};

export const MEDIO_PAGO_META: Record<MedioPago, { label: string; codigo: string }> = {
  efectivo: { label: 'Efectivo', codigo: '10' },
  tarjeta_credito: { label: 'Tarjeta Crédito', codigo: '20' },
  tarjeta_debito: { label: 'Tarjeta Débito', codigo: '21' },
  transferencia: { label: 'Transferencia', codigo: '40' },
  nequi: { label: 'Nequi', codigo: '41' },
  daviplata: { label: 'Daviplata', codigo: '42' },
  bonos: { label: 'Bonos', codigo: '50' },
  canje: { label: 'Canje', codigo: '60' },
  otros: { label: 'Otros', codigo: 'ZZ' },
};

export const TIPO_IDENTIFICACION_META: Record<TipoIdentificacion, { label: string; codigo: string }> = {
  CC: { label: 'Cédula de Ciudadanía', codigo: '11' },
  NIT: { label: 'NIT', codigo: '31' },
  CE: { label: 'Cédula de Extranjería', codigo: '22' },
  PASAPORTE: { label: 'Pasaporte', codigo: '41' },
  TI: { label: 'Tarjeta de Identidad', codigo: '12' },
  PPT: { label: 'Permiso por Protección Temporal', codigo: '47' },
};

export const ROL_META: Record<RolUsuario, { label: string; tone: string }> = {
  admin: { label: 'Administrador', tone: 'bg-primary/10 text-primary border-primary/25' },
  supervisor: { label: 'Supervisor', tone: 'bg-accent/10 text-accent border-accent/25' },
  cajero: { label: 'Cajero', tone: 'bg-info/10 text-info border-info/25' },
  contador: { label: 'Contador', tone: 'bg-warning/10 text-warning border-warning/25' },
  solo_lectura: { label: 'Solo lectura', tone: 'bg-muted text-muted-foreground border-border' },
};

// Matriz de permisos por rol (sección 5.11 del prompt)
export const PERMISSION_MATRIX: Record<RolUsuario, Partial<Record<Permiso, boolean>>> = {
  admin: {
    pos_sell: true,
    discount_within_limit: true,
    discount_beyond_limit: true,
    manage_own_cash: true,
    manage_others_cash: true,
    void_dian_document: true,
    resend_dian_document: true,
    view_financial_reports: true,
    export_reports: true,
    manage_clients: true,
    manage_products: true,
    manage_resolutions: true,
    view_resolutions: true,
    manage_company: true,
    manage_users: true,
  },
  supervisor: {
    pos_sell: true,
    discount_within_limit: true,
    discount_beyond_limit: true,
    manage_own_cash: true,
    manage_others_cash: true,
    void_dian_document: true,
    resend_dian_document: true,
    view_financial_reports: true,
    export_reports: true,
    manage_clients: true,
    manage_products: true,
    manage_resolutions: false,
    view_resolutions: false,
    manage_company: false,
    manage_users: false,
  },
  cajero: {
    pos_sell: true,
    discount_within_limit: true,
    discount_beyond_limit: false,
    manage_own_cash: true,
    manage_others_cash: false,
    void_dian_document: false,
    resend_dian_document: false,
    view_financial_reports: false,
    export_reports: false,
    manage_clients: true,
    manage_products: false,
    manage_resolutions: false,
    view_resolutions: false,
    manage_company: false,
    manage_users: false,
  },
  contador: {
    pos_sell: false,
    discount_within_limit: false,
    discount_beyond_limit: false,
    manage_own_cash: false,
    manage_others_cash: false,
    void_dian_document: false,
    resend_dian_document: false,
    view_financial_reports: true,
    export_reports: true,
    manage_clients: false,
    manage_products: false,
    manage_resolutions: false,
    view_resolutions: true,
    manage_company: false,
    manage_users: false,
  },
  solo_lectura: {
    pos_sell: false,
    discount_within_limit: false,
    discount_beyond_limit: false,
    manage_own_cash: false,
    manage_others_cash: false,
    void_dian_document: false,
    resend_dian_document: false,
    view_financial_reports: true,
    export_reports: false,
    manage_clients: false,
    manage_products: false,
    manage_resolutions: false,
    view_resolutions: true,
    manage_company: false,
    manage_users: false,
  },
};

// Items del sidebar visibles por rol
export const SIDEBAR_ROUTES_BY_ROLE: Record<RolUsuario, string[]> = {
  admin: [
    '/dashboard', '/pos', '/invoices/new', '/documents', '/credit-notes', '/debit-notes',
    '/invoicing-products', '/clients', '/suppliers', '/products', '/inventory',
    '/resolutions', '/cash-registers', '/reports', '/users', '/settings',
  ],
  supervisor: [
    '/dashboard', '/pos', '/documents', '/credit-notes', '/debit-notes',
    '/clients', '/products', '/inventory', '/cash-registers', '/reports',
  ],
  cajero: ['/pos', '/cash-registers', '/clients'],
  contador: [
    '/dashboard', '/documents', '/credit-notes', '/debit-notes', '/resolutions', '/reports',
  ],
  solo_lectura: ['/dashboard', '/documents'],
};

export const AMBIENTE_META: Record<Ambiente, { label: string; tone: string; banner: string }> = {
  habilitacion: {
    label: 'Habilitación',
    tone: 'bg-warning/15 text-warning border-warning/30',
    banner: 'bg-warning/10 text-warning-foreground border-b border-warning/30',
  },
  produccion: {
    label: 'Producción',
    tone: 'bg-success/15 text-success border-success/30',
    banner: '',
  },
};

export const TIPO_OPERACION_META: Record<TipoOperacion, { label: string }> = {
  '01': { label: 'Operación estándar' },
  '02': { label: 'Operación con IVA' },
  '03': { label: 'Operación sin IVA' },
  '04': { label: 'Operación exenta de IVA' },
  '05': { label: 'Operación de exportación' },
  '06': { label: 'Operación de importación' },
  '07': { label: 'Operación de devolución' },
  '08': { label: 'Operación de nota crédito' },
  '09': { label: 'Operación de nota débito' },
  '10': { label: 'Operación de ajuste' },
  '11': { label: 'Operación de nota de ajuste' },
  '12': { label: 'Operación de documento soporte' },
  '13': { label: 'Operación de nota de ajuste documento soporte' },
  '14': { label: 'Operación de nota crédito documento soporte' },
  '15': { label: 'Operación de nota débito documento soporte' },
  '16': { label: 'Operación de factura electrónica de venta' },
  '17': { label: 'Operación de nota crédito electrónica' },
  '18': { label: 'Operación de nota débito electrónica' },
  '19': { label: 'Operación de nota de ajuste electrónica' },
  '20': { label: 'Operación de documento soporte electrónico' },
  '21': { label: 'Operación de nota de ajuste documento soporte electrónico' },
  '22': { label: 'Operación de nota crédito documento soporte electrónico' },
  '23': { label: 'Operación de nota débito documento soporte electrónico' },
  '24': { label: 'Operación de factura electrónica de venta (contingencia)' },
  '25': { label: 'Operación de nota crédito electrónica (contingencia)' },
  '26': { label: 'Operación de nota débito electrónica (contingencia)' },
  '27': { label: 'Operación de nota de ajuste electrónica (contingencia)' },
  '28': { label: 'Operación de documento soporte electrónico (contingencia)' },
  '29': { label: 'Operación de nota de ajuste documento soporte electrónico (contingencia)' },
  '30': { label: 'Operación de nota crédito documento soporte electrónico (contingencia)' },
  '31': { label: 'Operación de nota débito documento soporte electrónico (contingencia)' },
  '32': { label: 'Operación de factura electrónica de venta (contingencia previa)' },
  '33': { label: 'Operación de nota crédito electrónica (contingencia previa)' },
  '34': { label: 'Operación de nota débito electrónica (contingencia previa)' },
  '35': { label: 'Operación de nota de ajuste electrónica (contingencia previa)' },
  '36': { label: 'Operación de documento soporte electrónico (contingencia previa)' },
  '37': { label: 'Operación de nota de ajuste documento soporte electrónico (contingencia previa)' },
  '38': { label: 'Operación de nota crédito documento soporte electrónico (contingencia previa)' },
  '39': { label: 'Operación de nota débito documento soporte electrónico (contingencia previa)' },
  '40': { label: 'Operación de factura electrónica de venta (sin validación previa)' },
  '41': { label: 'Operación de nota crédito electrónica (sin validación previa)' },
  '42': { label: 'Operación de nota débito electrónica (sin validación previa)' },
  '43': { label: 'Operación de nota de ajuste electrónica (sin validación previa)' },
  '44': { label: 'Operación de documento soporte electrónico (sin validación previa)' },
  '45': { label: 'Operación de nota de ajuste documento soporte electrónico (sin validación previa)' },
  '46': { label: 'Operación de nota crédito documento soporte electrónico (sin validación previa)' },
  '47': { label: 'Operación de nota débito documento soporte electrónico (sin validación previa)' },
  '48': { label: 'Operación de factura electrónica de venta (validación previa)' },
  '49': { label: 'Operación de nota crédito electrónica (validación previa)' },
};

export const MONEDA_META: Record<Moneda, { label: string; simbolo: string }> = {
  COP: { label: 'Peso Colombiano', simbolo: '$' },
  USD: { label: 'Dólar Americano', simbolo: 'US$' },
  EUR: { label: 'Euro', simbolo: '€' },
};

export const RESPONSABILIDAD_FISCAL_META: Record<ResponsabilidadFiscal, { label: string }> = {
  'O-01': { label: 'No responsable' },
  'O-02': { label: 'No responsable (régimen simple)' },
  'O-03': { label: 'Responsable de IVA' },
  'O-07': { label: 'Autorretenedor' },
  'O-08': { label: 'Gran contribuyente' },
  'O-09': { label: 'Agente de retención IVA' },
  'O-10': { label: 'Autorretenedor ReteFuente' },
  'O-11': { label: 'Autorretenedor ReteIVA' },
  'O-12': { label: 'Autorretenedor ReteICA' },
  'O-13': { label: 'No responsable + autorretenedor' },
  'O-14': { label: 'No responsable + agente de retención IVA' },
  'O-15': { label: 'Gran contribuyente + autorretenedor' },
  'O-16': { label: 'Gran contribuyente + agente de retención IVA' },
  'O-17': { label: 'Gran contribuyente + autorretenedor + agente de retención IVA' },
  'O-18': { label: 'Gran contribuyente + autorretenedor + agente de retención IVA y ReteICA' },
  'O-19': { label: 'Autorretenedor + agente de retención IVA' },
  'O-20': { label: 'Autorretenedor + agente de retención IVA y ReteICA' },
  'O-21': { label: 'Autorretenedor + agente de retención ReteICA' },
  'O-22': { label: 'Autorretenedor + agente de retención ReteIVA' },
  'O-23': { label: 'Autorretenedor + agente de retención ReteIVA y ReteICA' },
  'O-24': { label: 'Agente de retención ReteIVA y ReteICA' },
  'O-25': { label: 'No responsable + autorretenedor + agente de retención IVA' },
  'O-26': { label: 'No responsable + autorretenedor + agente de retención ReteICA' },
  'O-27': { label: 'No responsable + autorretenedor + agente de retención ReteIVA' },
  'O-28': { label: 'No responsable + autorretenedor + agente de retención ReteIVA y ReteICA' },
  'O-29': { label: 'No responsable + agente de retención ReteIVA' },
  'O-30': { label: 'No responsable + agente de retención ReteICA' },
  'O-31': { label: 'Responsable de IVA + autorretenedor' },
  'O-32': { label: 'Responsable de IVA + agente de retención IVA' },
  'O-33': { label: 'Responsable de IVA + autorretenedor + agente de retención IVA' },
  'O-34': { label: 'Responsable de IVA + autorretenedor + agente de retención ReteICA' },
  'O-35': { label: 'Responsable de IVA + autorretenedor + agente de retención ReteIVA' },
  'O-36': { label: 'Responsable de IVA + autorretenedor + agente de retención ReteIVA y ReteICA' },
  'O-37': { label: 'Responsable de IVA + agente de retención ReteICA' },
  'O-38': { label: 'Responsable de IVA + autorretenedor + agente de retención IVA y ReteICA' },
  'O-39': { label: 'Responsable de IVA + agente de retención ReteIVA' },
  'O-40': { label: 'Responsable de IVA + agente de retención ReteIVA y ReteICA' },
  'O-47': { label: 'Régimen simple de tributación' },
  'R-99-PJ': { label: 'Régimen simple (persona jurídica)' },
};

export const TIPO_TRIBUTO_META: Record<TipoTributo, { label: string; codigoDIAN: string }> = {
  iva: { label: 'IVA', codigoDIAN: '01' },
  inc: { label: 'Impoconsumo (INC)', codigoDIAN: '04' },
  retefuente: { label: 'ReteFuente', codigoDIAN: '06' },
  reteica: { label: 'ReteICA', codigoDIAN: '07' },
  reteiva: { label: 'ReteIVA', codigoDIAN: '05' },
  reteiva_cree: { label: 'ReteIVA CREE', codigoDIAN: '08' },
  sobretasa: { label: 'Sobretasa', codigoDIAN: '09' },
  bolsas: { label: 'Impuesto al consumo de bolsas plásticas', codigoDIAN: '10' },
};

export const UNIDADES_MEDIDA_DIAN: { codigo: UnidadMedidaDIAN; label: string }[] = [
  { codigo: 'UND', label: 'Unidad' },
  { codigo: 'KGM', label: 'Kilogramo' },
  { codigo: 'LTR', label: 'Litro' },
  { codigo: 'MTR', label: 'Metro' },
  { codigo: 'MTK', label: 'Metro cuadrado' },
  { codigo: 'HUR', label: 'Hora' },
  { codigo: 'DIA', label: 'Día' },
  { codigo: 'SER', label: 'Servicio' },
  { codigo: 'Caja', label: 'Caja' },
  { codigo: 'Docena', label: 'Docena' },
  { codigo: 'Caja13', label: 'Caja de 13' },
  { codigo: 'Caja12', label: 'Caja de 12' },
  { codigo: 'Caja6', label: 'Caja de 6' },
  { codigo: 'Caja4', label: 'Caja de 4' },
  { codigo: 'Paquete', label: 'Paquete' },
  { codigo: 'Rollo', label: 'Rollo' },
  { codigo: 'Litro', label: 'Litro' },
  { codigo: 'Gramo', label: 'Gramo' },
  { codigo: 'Tonelada', label: 'Tonelada' },
  { codigo: 'Metro2', label: 'Metro cuadrado' },
  { codigo: 'Metro3', label: 'Metro cúbico' },
  { codigo: 'Kilometro', label: 'Kilómetro' },
  { codigo: 'Par', label: 'Par' },
  { codigo: 'Juego', label: 'Juego' },
  { codigo: 'Millar', label: 'Millar' },
];

// Alias para compatibilidad con código existente
export const UNIDADES_MEDIDA = UNIDADES_MEDIDA_DIAN.map((u) => ({ codigo: u.codigo, label: u.label }));

export const IVA_OPCIONES = [0, 5, 19];

export const DEPARTAMENTOS_COL = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Distrito Capital', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
  'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
];

// --- Inventario ---

export const TIPO_MOVIMIENTO_INVENTARIO_META: Record<TipoMovimientoInventario, { label: string; tone: string }> = {
  entrada: { label: 'Entrada', tone: 'bg-success/15 text-success border-success/30' },
  salida: { label: 'Salida', tone: 'bg-destructive/15 text-destructive border-destructive/30' },
  ajuste: { label: 'Ajuste', tone: 'bg-info/15 text-info border-info/30' },
  devolucion: { label: 'Devolución', tone: 'bg-warning/15 text-warning border-warning/30' },
  transferencia: { label: 'Transferencia', tone: 'bg-muted text-muted-foreground border-border' },
};

// --- Cajas ---

export const TIPO_MOVIMIENTO_CAJA_META: Record<TipoMovimientoCaja, { label: string; tone: string }> = {
  ingreso: { label: 'Ingreso', tone: 'bg-success/15 text-success border-success/30' },
  egreso: { label: 'Egreso', tone: 'bg-destructive/15 text-destructive border-destructive/30' },
  venta: { label: 'Venta', tone: 'bg-primary/15 text-primary border-primary/30' },
  pago: { label: 'Pago', tone: 'bg-info/15 text-info border-info/30' },
  reembolso: { label: 'Reembolso', tone: 'bg-warning/15 text-warning border-warning/30' },
};

export const ESTADO_CAJA_META: Record<EstadoCaja, { label: string; tone: string }> = {
  abierta: { label: 'Abierta', tone: 'bg-success/15 text-success border-success/30' },
  cerrada: { label: 'Cerrada', tone: 'bg-muted text-muted-foreground border-border' },
};

// --- Productos de facturación ---

export const CATEGORIA_PRODUCTO_FACTURACION_META: Record<CategoriaProductoFacturacion, { label: string }> = {
  servicios: { label: 'Servicios' },
  bienes: { label: 'Bienes' },
  combustibles: { label: 'Combustibles' },
  alimentos: { label: 'Alimentos' },
  tecnologia: { label: 'Tecnología' },
  papeleria: { label: 'Papelería' },
  otros: { label: 'Otros' },
};

// --- Códigos CIIU más comunes ---

export const CODIGOS_CIIU_COMUNES = [
  { codigo: '4651', label: 'Comercio al por mayor de equipos de computación' },
  { codigo: '4652', label: 'Comercio al por mayor de máquinas y equipo electrónico' },
  { codigo: '4711', label: 'Comercio al por menor en establecimientos no especializados' },
  { codigo: '4721', label: 'Comercio al por menor de productos de aseo' },
  { codigo: '6201', label: 'Actividades de programación informática' },
  { codigo: '6202', label: 'Actividades de consultoría informática' },
  { codigo: '6311', label: 'Procesamiento de datos, hosting y actividades conexas' },
  { codigo: '7020', label: 'Actividades de consultoría de gestión' },
  { codigo: '8219', label: 'Actividades de fotocopiado, preparación y otros' },
  { codigo: '6910', label: 'Actividades jurídicas' },
  { codigo: '6920', label: 'Actividades de contabilidad, teneduría y auditoría' },
  { codigo: '7110', label: 'Servicios de ingeniería y arquitectura' },
];

// --- Tasa ReteFuente común ---

export const TASAS_RETEFUENTE = [0.01, 0.025, 0.04, 0.06, 0.11];
export const TASAS_RETEICA = [0.00408, 0.0069, 0.00828, 0.01104, 0.0138, 0.01656, 0.0207, 0.0276];
