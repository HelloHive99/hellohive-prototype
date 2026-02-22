import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

function isVendorRole(role: string | undefined): boolean {
  return role === 'Vendor-Admin' || role === 'Vendor-Tech';
}

const TEAM_ONLY_PATHS = ['/', '/work-orders', '/vendors', '/properties', '/assets'];
const DEMO_COOKIE = 'hh_demo_access';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Layer 1: Demo Gate ────────────────────────────────────────────────────
  // When DEMO_GATE_ENABLED=true, every request must carry the hh_demo_access
  // cookie (issued by /api/demo-auth after valid credential submission) before
  // reaching the NextAuth login page or any app route.
  if (process.env.DEMO_GATE_ENABLED === 'true') {
    const isDemoRoute =
      pathname === '/demo-access' ||
      pathname.startsWith('/api/demo-auth');

    if (!isDemoRoute && !req.cookies.get(DEMO_COOKIE)?.value) {
      return NextResponse.redirect(new URL('/demo-access', req.url));
    }
    // isDemoRoute OR cookie present → fall through to NextAuth layer
  }

  // ── Layer 2: Allow unauthenticated routes through ─────────────────────────
  // These paths must not be blocked by the NextAuth token check below:
  //   /login        — the sign-in form itself (no JWT yet)
  //   /demo-access  — the demo gate page (no JWT yet)
  //   /api/demo-auth — the demo gate API (no JWT, no cookie required)
  //   /api/auth/*   — NextAuth internals handled by its own route handler
  if (
    pathname === '/login' ||
    pathname === '/demo-access' ||
    pathname.startsWith('/api/demo-auth') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // ── Layer 3: NextAuth token check ─────────────────────────────────────────
  // getToken is the same call withAuth makes internally, exposed for direct use.
  // Replacing withAuth with getToken gives us full sequential control so the
  // demo gate can run before this check.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ── Layer 4: Role-based routing (unchanged from original withAuth version) ──
  const role = token.role as string | undefined;

  if (isVendorRole(role)) {
    const blocked = TEAM_ONLY_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (blocked) {
      return NextResponse.redirect(new URL('/vendor', req.url));
    }
  }

  if (!isVendorRole(role)) {
    if (pathname === '/vendor' || pathname.startsWith('/vendor/')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // /login is NO LONGER excluded — middleware must run on /login to enforce
    // the demo gate (without this, users can bypass the gate by going to /login directly).
    // /demo-access and /api/demo-auth are also matched; Layer 1 and Layer 2 handle them.
    // /api/auth/* is excluded here because NextAuth handles it internally.
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
