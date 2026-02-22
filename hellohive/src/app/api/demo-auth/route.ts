import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

// ── In-memory rate limiter ─────────────────────────────────────────────────
// Resets on server restart. Not shared across instances.
// Acceptable for a single-instance demo deployment.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateEntry {
  count: number;
  resetAt: number; // unix milliseconds
}

const rateLimitMap = new Map<string, RateEntry>();

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// ── Timing-safe string comparison ──────────────────────────────────────────
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Run a dummy comparison to maintain consistent timing regardless of length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { username = '', password = '' } = body;
  const expectedUser = process.env.DEMO_GATE_USERNAME ?? '';
  const expectedPass = process.env.DEMO_GATE_PASSWORD ?? '';

  const valid =
    expectedUser.length > 0 &&
    expectedPass.length > 0 &&
    safeEqual(username, expectedUser) &&
    safeEqual(password, expectedPass);

  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  // Credentials valid — issue the demo access cookie.
  // Cookie value '1' is a presence token; security comes from HttpOnly (JS cannot
  // forge it) and server-side credential validation being the only issuance path.
  const isProd = process.env.NODE_ENV === 'production';
  const res = NextResponse.json({ ok: true });
  res.cookies.set('hh_demo_access', '1', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 36000, // 10 hours in seconds
  });

  return res;
}
