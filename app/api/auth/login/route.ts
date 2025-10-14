// app/api/auth/login/route.ts - VERSIÓN CORREGIDA
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/app/lib/db';
import { users } from '@/app/lib/schema';
import { eq, or } from 'drizzle-orm';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // validate correct data
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const userResult = await db
      .select()
      .from(users)
      .where(or(eq(users.username, email), eq(users.email, email)))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const dbUser = userResult[0];

    const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const userData = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      loggedInAt: new Date().toISOString()
    };

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
    });

    // Sets cookies
    response.cookies.set('duech_session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/', 
    });

    return response;

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar el inicio de sesión',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}