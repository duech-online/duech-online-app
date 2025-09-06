import { cookies } from 'next/headers';
import crypto from 'crypto';

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

const SESSION_COOKIE = 'duech_session';
const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
  return secret;
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(data: string, secret: string) {
  return base64url(crypto.createHmac('sha256', secret).update(data).digest());
}

export type TokenPayload = SessionUser & { iat: number; exp: number; role?: string };

export function createToken(user: SessionUser, maxAgeSeconds = DEFAULT_EXP_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + maxAgeSeconds,
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, getSecret());
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;
    const expected = sign(`${encodedHeader}.${encodedPayload}`, getSecret());
    if (expected !== signature) return null;
    const json = Buffer.from(
      encodedPayload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(json) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser, maxAgeSeconds = DEFAULT_EXP_SECONDS) {
  const token = createToken(user, maxAgeSeconds);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const { id, email, name, role } = payload;
  return { id, email, name, role };
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return !!token && !!verifyToken(token);
}
