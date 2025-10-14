import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/app/lib/db';
import { users } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

interface LoginRequest {
  username: string;
  password: string;
}


/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // validate correct data
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Search user in database using drizzle
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const dbUser = userResult[0];

    // Verify password,      :bcrypt.hash(password,15) used for example admin/admin123:
    const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);


    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Return user data and token (without passwordHash)
    return NextResponse.json({
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