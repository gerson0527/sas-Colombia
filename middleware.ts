import { NextResponse, type NextRequest } from 'next/server'

// Decodifica un JWT sin verificar para leer el payload
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function isAuthenticated(request: NextRequest): boolean {
  const accessCookie = request.cookies.get('access')?.value || request.cookies.get('__Host-access')?.value
  if (!accessCookie) return false

  const payload = decodeJwtPayload(accessCookie)
  if (!payload) return false

  // Check expiry
  const exp = payload.exp as number | undefined
  if (exp && Date.now() >= exp * 1000) return false

  return true
}

export async function middleware(request: NextRequest) {
  const authenticated = isAuthenticated(request)

  const isPublicRoute = request.nextUrl.pathname.startsWith('/login') ||
                        request.nextUrl.pathname.startsWith('/signup') ||
                        request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname.startsWith('/request-access') ||
                        request.nextUrl.pathname.startsWith('/api/')

  if (!authenticated && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (authenticated && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
