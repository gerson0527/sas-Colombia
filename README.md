# POS System — Frontend

Sistema de punto de venta (POS) con facturación electrónica DIAN, gestión de inventario multi-sucursal, cajas, clientes, proveedores, suscripciones SaaS y reportes. Construido con Next.js 13, TypeScript 5, Tailwind CSS y shadcn/ui.

El frontend consume **exclusivamente** la API REST del backend NestJS en `http://localhost:8000` con autenticación JWT en cookies HttpOnly. La capa de datos local (Supabase) está en desuso y solo se mantiene por compatibilidad durante la migración.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 13 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS + shadcn/ui (Radix primitives) |
| Autenticación | NestJS JWT en cookies HttpOnly (`__Host-*` en prod) |
| Datos | NestJS API REST (`/v1/*`) — fuente única de verdad |
| Estado servidor | React Context + `api-client` con refresh automático ante 401 |
| Persistencia local | Solo preferencias de UI (tema) — **sin datos de negocio en localStorage** |
| Gráficos | Recharts |
| Notificaciones | Sonner + Sentry |
| Iconos | Lucide React |
| Fechas | date-fns |
| Pagos (suscripción SaaS) | MercadoPago (Preference + Webhook en backend) |
| Observabilidad | `@sentry/nextjs` (cliente + servidor) |

---

## Funcionalidades

### Punto de Venta (`/pos`)
- Búsqueda de productos por código o nombre
- Grilla responsive (3-6 columnas) con categorías
- Carrito lateral con edición de cantidades
- **Múltiples medios de pago**: efectivo, Nequi, Daviplata, tarjeta crédito/débito, transferencia
- Cálculo automático de vueltas
- Descuento global con **autorización por PIN contra backend** (`POST /v1/auth/pin/verify`)
- **Venta real** vía `POST /v1/pos/sales` (transaccional en backend: Invoice + InventoryMovement + CashMovement)
- Ticket térmico con envío por WhatsApp y Email
- Atajos de teclado: `F2` buscar, `F4` cobrar, `Esc` cancelar
- Bloqueo de ventas sin sesión de caja abierta (validado en backend)

### Caja (`/cash-registers`)
- **Apertura/cierre de sesión** vía API con monto inicial, monto final y diferencia calculada
- Múltiples cajas por sucursal (Branch)
- Movimientos: ingreso, egreso, venta, reembolso
- Cuadre con arqueo por método de pago
- Sin persistencia en `localStorage` — todo en backend con `CashSession` y `CashMovement`

### Facturación Electrónica DIAN
- Creación de facturas con selección de cliente, resolución y productos
- **Notas crédito/débito** con validación de factura `accepted`, motivo del catálogo DIAN (01-13 / 01-05) y tope ≤ valor factura
- Envío a DIAN con seguimiento de estado (`draft` → `pending` → `accepted`/`rejected`)
- Descarga de XML firmado y PDF con CUFE/QR
- Gestión de resoluciones DIAN con barra de progreso y fechas de vigencia

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

### Productos (`/products`)
- Catálogo con IVA, INC, retenciones (ReteFuente, ReteICA, ReteIVA)
- Unidades de medida DIAN
- Configuración DIAN avanzada por producto (`/invoicing-products`): tributos múltiples, UNSPSC, cuentas contables

### Proveedores (`/suppliers`)
- CRUD con datos bancarios
- Código CIIU, forma de pago, plazos

### Inventario (`/inventory`)
- KPIs: stock total, valorizado, bajo, movimientos
- Kardex inmutable (backend: `inventory_movements` con `balance_after`)
- Movimientos: entrada, salida, ajuste, devolución
- CHECK constraint SQL `stock >= 0`

### Multi-Sucursal
- `Branch` (sucursal) y `Warehouse` (bodega)
- Stock por sucursal-bodega (`product_stocks` con UNIQUE(product, branch, warehouse))

### Suscripciones SaaS (`/settings/billing`)
- Ver plan actual (`trialing`/`active`/`past_due`/`canceled`/`suspended`)
- Upgrade/downgrade entre planes
- Checkout vía MercadoPago (mensual/anual)
- Cancelar suscripción
- **Trial de 14 días** al registrarse
- Planes: `free`, `basic`, `pro`, `enterprise`

### Reportes (`/reports`)
- Filtro por rango de fechas
- KPIs: ventas totales, IVA, retenciones
- Gráfico de barras apiladas
- Exportación CSV

### Usuarios (`/users`)
- Invitación por email con rol
- Roles: `tenant_admin`, `tenant_supervisor`, `tenant_cashier`, `tenant_accountant`, `tenant_viewer`
- **PIN de 4-8 dígitos** hasheado con Argon2id en backend; rate-limit 3/min
- Cambio de rol in-app

### Configuración (`/settings`)
- Datos de la empresa emisora
- Ambiente DIAN: habilitación (pruebas) / producción
- Carga de certificado digital (`.p12`)
- Notificaciones: Brevo (correo + WhatsApp)

---

## Rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/signup` | Registro de nueva cuenta | Público |
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
| `/settings/billing` | Suscripción SaaS | Autenticado |

---

## UI/UX

- **Tema oscuro/claro** con persistencia en localStorage y script anti-FOUC
- **Responsive**: sidebar en escritorio, sheet en móvil
- **Atajos de teclado**: `F2`, `F4`, `Esc` en POS
- **Notificaciones** Sonner con colores por tipo
- **Tooltips** globales con delay configurable
- **Estados**: carga, error, vacío con componentes dedicados
- **Badges** de estado DIAN con código de colores
- **Formato moneda** COP localizado
- **Formato fechas** locale `es-CO`
- **DV automático** para NITs colombianos
- **Catálogos**: departamentos, municipios, unidades DIAN, tributos

### Seguridad en headers (CSP, HSTS, X-Frame-Options)
Configurados en `next.config.js` y `netlify.toml`:
- `Content-Security-Policy` con `connect-src` solo a la API NestJS
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Inicio rápido

```bash
# 1. Variables de entorno
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_SENTRY_DSN=

# 2. Instalar
npm install

# 3. Iniciar
npm run dev
# http://localhost:3000
```

### Credenciales de prueba (SOLO AMBIENTE LOCAL)

Las credenciales `admin@999999999.com / admin123` solo existen en el seed de desarrollo local. **Nunca** uses esta contraseña en producción. Para producción, el tenant admin debe ser creado vía onboarding y rotar credenciales inmediatamente.

---

## Arquitectura

```
frontend/
├── app/                          # Páginas (App Router)
│   ├── (app)/                    # Rutas protegidas (layout con sidebar)
│   │   ├── pos/                  # Punto de venta
│   │   ├── cash-registers/       # Cajas
│   │   ├── clients/ products/ suppliers/ inventory/
│   │   ├── documents/ invoices/ credit-notes/ debit-notes/
│   │   ├── reports/ dashboard/
│   │   ├── users/ settings/ settings/billing/
│   │   └── resolutions/ invoicing-products/
│   ├── login/ signup/            # Auth público
│   └── api/                      # Route handlers legacy
├── components/
│   ├── ui/                       # shadcn/ui primitives (48 componentes)
│   ├── app-shell.tsx             # Layout principal
│   ├── sidebar-nav.tsx           # Navegación con filtrado por rol
│   ├── theme-provider.tsx        # Tema oscuro/claro
│   ├── page-header.tsx
│   ├── kpi-card.tsx
│   ├── estado-badge.tsx          # Badge DIAN
│   └── empty-state.tsx
├── hooks/
│   ├── use-permissions.tsx       # Sesión + matriz de permisos
│   ├── use-cash-session.tsx      # Cajas desde API (sin localStorage)
│   └── use-supabase-data.ts      # Hooks legacy (en migración a API)
├── lib/
│   ├── api-client.ts             # Cliente HTTP con refresh automático
│   ├── auth-service.ts           # login/refresh/logout/getMe
│   ├── use-api-data.ts           # Hooks de datos hacia NestJS
│   ├── types.ts
│   ├── constants.ts              # Catálogos, permisos, rutas
│   └── supabase/                 # Legacy
├── middleware.ts                 # Auth UX (no seguridad)
├── sentry.client.config.ts
├── sentry.server.config.ts
├── next.config.js                # Headers de seguridad
└── netlify.toml                  # Headers de seguridad
```

---

## Backend

El frontend se conecta **exclusivamente** a la API NestJS en `http://localhost:8000`:

### Autenticación
- `POST /v1/auth/login` — JWT en cookies HttpOnly
- `POST /v1/auth/refresh` — Refresh atómico
- `POST /v1/auth/logout`
- `GET  /v1/auth/me`
- `POST /v1/auth/pin/{set,verify}`

### Recursos
- `GET  /v1/customers` / `POST` / `GET :id`
- `GET  /v1/products` / `POST`
- `GET  /v1/suppliers` / `POST`
- `GET  /v1/invoices` / `POST` (idempotente)
- `GET  /v1/inventory/movements` / `POST`
- `GET  /v1/cash-registers` / `POST`
- `GET  /v1/cash-sessions` / `POST` / `:id/close`
- `POST /v1/pos/sales` — venta transaccional

### Sucursales y SaaS
- `GET  /v1/branches` / `POST`
- `GET  /v1/billing/plans`
- `POST /v1/billing/checkout` — crea MercadoPago Preference
- `POST /v1/billing/webhooks/mercadopago` — webhook firmado

### Documentación
- Swagger: `http://localhost:8000/docs`

---

## Seguridad implementada en frontend

- **CSP estricta** que limita `connect-src` solo al backend autorizado
- **No lectura de cookies HttpOnly** desde JS (`document.cookie` no funciona con `HttpOnly`); el cliente usa `credentials: 'include'` y refresh ante 401
- **`switchRole`** solo activo en `NODE_ENV !== 'production'`
- **Credenciales de demo** marcadas explícitamente como `(SOLO AMBIENTE LOCAL)` en este README
- **Sin secretos** en `localStorage` ni en el bundle

## Despliegue

### Netlify
`netlify.toml` configura headers de seguridad globales. Variables de entorno requeridas en el panel:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SENTRY_DSN`

### Build
```bash
npm run build
npm run start
```