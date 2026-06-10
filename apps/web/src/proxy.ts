import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

export default async function proxy(request: NextRequest) {
  const session = getSessionCookie(request)

  if (
    !session &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register')
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (
    session &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register')
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Bypassa o proxy (auth de sessão) apenas para:
    // - api/auth: fluxo de login
    // - endpoints do AGENTE, que autenticam por Bearer token (não por sessão):
    //   api/ingest, api/commands (poll), api/update, api/release
    // - assets estáticos
    // Todo o resto (api/metrics, api/report, api/command, api/alerts,
    // api/rename, api/hardware-history, páginas) exige sessão.
    '/((?!api/auth|api/ingest|api/commands|api/update|api/release|_next/static|_next/image|favicon.ico).*)',
  ],
}
