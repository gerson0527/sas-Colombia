# POS System — Frontend

Sistema de punto de venta (POS) con facturación electrónica DIAN, gestión de inventario, cajas, clientes y reportes. Construido con Next.js 13, TypeScript, Tailwind CSS y shadcn/ui.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 13 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS + shadcn/ui (Radix primitives) |
| Autenticación | NestJS backend (JWT HttpOnly cookies) |
| Datos | NestJS API REST (`/v1/*`) |
| Estado | React Context + localStorage |
| Gráficos | Recharts |
| Notificaciones | Sonner |
| Iconos | Lucide React |
| Fechas | date-fns |
| Pagos | MercadoPago SDK |

---

## Funcionalidades

### Punto de Venta (`/pos`)
- Búsqueda de productos por código o nombre
- Grilla responsive (3-6 columnas) con categorías
- Carrito lateral con edición de cantidades
- Múltiples medios de pago: efectivo, Nequi, Daviplata, tarjeta crédito/débito, transferencia
- Cálculo automático de vueltas
- Descuento global con autorización por PIN
- Ticket térmico con envío por WhatsApp y Email
- Atajos de teclado: `F2` buscar, `F4` cobrar, `Esc` cancelar
- Bloqueo de ventas sin sesión de caja abierta

### Facturación Electrónica DIAN
- Creación de facturas con selección de cliente, resolución y productos
- Notas crédito y notas débito asociadas a facturas
- Envío a DIAN con seguimiento de estado (borrador → aceptado/rechazado)
- Descarga de XML firmado y PDF con CUFE/QR
- Gestión de resoluciones DIAN con barra de progreso de uso
- Configuración de productos para facturación (tributos, UNSPSC, cuentas contables)

### Dashboard (`/dashboard`)
- KPIs: facturas del mes, pendientes, rechazadas, ingresos
- Gráfico de ventas (área, últimos 6 meses)
- Distribución por estado DIAN (pastel)
- Alertas: resolución próxima a agotarse, certificado vencido
- Últimos documentos emitidos

### Clientes (`/clients`)
- CRUD completo con datos fiscales colombianos
- Cálculo automático de DV para NIT
- Selección jerárquica departamento → ciudad
- Tipos de identificación: NIT, CC, CE, NI, PPT
- Regímenes tributarios y responsabilidades fiscales

### Productos (`/products`)
- Catálogo de productos y servicios
- Configuración de IVA, INC, retenciones (ReteFuente, ReteICA, ReteIVA)
- Unidades de medida DIAN
- Tipo bien/servicio

### Proveedores (`/suppliers`)
- CRUD con datos bancarios
- Código CIIU, forma de pago, plazos

### Inventario (`/inventory`)
- KPIs: stock total, valorizado, bajo, movimientos
- Existencias con alerta de stock mínimo
- Movimientos: entrada, salida, ajuste, devolución

### Cajas (`/cash-registers`)
- Múltiples cajas por sucursal
- Apertura y cierre de sesiones con montos inicial/final
- Cuadre de caja con conteo de efectivo
- Movimientos: ingreso, egreso, venta, reembolso

### Reportes (`/reports`)
- Filtro por rango de fechas
- KPIs: ventas totales, IVA, retenciones
- Gráfico de barras apiladas (ventas + impuestos)
- Exportación a CSV

### Usuarios (`/users`)
- Invitación por email con rol y PIN
- Roles: admin, supervisor, cajero, contador, solo_lectura
- Matriz de permisos granular
- Cambio de rol en tiempo real

### Configuración (`/settings`)
- Datos de la empresa emisora
- Ambiente DIAN: habilitación (pruebas) / producción
- Carga de certificado digital (.p12)
- Notificaciones: Brevo (correo + WhatsApp)

---

## Rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/request-access` | Solicitar acceso | Público |
| `/dashboard` | Dashboard | Autenticado |
| `/pos` | Punto de venta | Autenticado |
| `/documents` | Documentos | Autenticado |
| `/documents/[id]` | Detalle documento | Autenticado |
| `/invoices/new` | Nueva factura | Autenticado |
| `/credit-notes` | Notas crédito | Autenticado |
| `/debit-notes` | Notas débito | Autenticado |
| `/clients` | Clientes | Autenticado |
| `/products` | Productos | Autenticado |
| `/suppliers` | Proveedores | Autenticado |
| `/inventory` | Inventario | Autenticado |
| `/invoicing-products` | Config. DIAN productos | Autenticado |
| `/resolutions` | Resoluciones DIAN | Autenticado |
| `/cash-registers` | Cajas | Autenticado |
| `/reports` | Reportes | Autenticado |
| `/users` | Usuarios | Autenticado |
| `/settings` | Configuración | Autenticado |
| `/settings/billing` | Facturación SaaS | Autenticado |

---

## UI/UX

- **Tema oscuro/claro** con persistencia en localStorage y script anti-FOUC
- **Responsive**: sidebar en escritorio, sheet en móvil
- **Atajos de teclado**: F2, F4, Esc en POS
- **Notificaciones** Sonner con colores por tipo
- **Tooltips** globales con delay configurable
- **Estados**: carga, error, vacío con componentes dedicados
- **Badges** de estado DIAN con código de colores
- **Formato moneda** COP localizado
- **Formato fechas** locale es-CO
- **DV automático** para NITs colombianos
- **Catálogos**: departamentos, municipios, unidades DIAN, tributos

---

## Inicio rápido

```bash
# Variables de entorno
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL=http://localhost:8000

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
# Abrir http://localhost:3000
```

### Credenciales de prueba
- **Usuario**: `admin@999999999.com`
- **Contraseña**: `admin123`

---

## Arquitectura

```
frontend/
├── app/                    # Páginas (App Router)
│   ├── (app)/              # Rutas protegidas (layout con sidebar)
│   ├── login/              # Login público
│   └── request-access/     # Onboarding público
├── components/
│   ├── ui/                 # shadcn/ui primitives (48 componentes)
│   ├── app-shell.tsx       # Layout principal (sidebar + topbar)
│   ├── sidebar-nav.tsx     # Navegación lateral
│   ├── theme-provider.tsx  # Tema oscuro/claro
│   ├── page-header.tsx     # Encabezado de página
│   ├── kpi-card.tsx        # Tarjeta de KPI
│   ├── estado-badge.tsx    # Badge de estado DIAN
│   └── empty-state.tsx     # Estado vacío
├── hooks/
│   ├── use-permissions.tsx # Contexto de sesión y permisos
│   ├── use-cash-session.tsx# Gestión de cajas (localStorage)
│   └── use-supabase-data.ts# Hooks de datos (Supabase)
├── lib/
│   ├── api-client.ts       # Cliente HTTP (NestJS API)
│   ├── auth-service.ts     # Servicio de autenticación
│   ├── types.ts            # Tipos del dominio
│   ├── constants.ts        # Catálogos, permisos, rutas
│   └── supabase/           # Cliente Supabase
├── middleware.ts           # Protección de rutas (JWT cookies)
└── public/                 # Assets estáticos
```

---

## Backend

El frontend se conecta a una API NestJS en `http://localhost:8000`:

- **Auth**: `POST /v1/auth/login` (JWT + HttpOnly cookies)
- **Clientes**: `GET /v1/tenants/:tenantId/customers`
- **Productos**: `GET /v1/products`
- **Facturas**: `GET /v1/invoices`, `POST /v1/invoices`
- **Proveedores**: `GET /v1/suppliers`
- **Dashboard**: `GET /v1/dashboard/stats`
- **Documentación**: `http://localhost:8000/docs` (Swagger)
