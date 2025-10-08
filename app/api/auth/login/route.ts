import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@/app/lib/db'; // ← USA DRIZZLE
import { users } from '@/app/lib/schema'; // ← IMPORTAR SCHEMA
import { eq } from 'drizzle-orm';

interface LoginRequest {
  username: string;
  password: string;
}

interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'ba2957cefdc373a77a269222951e6062';

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // Validar que se recibieron los datos necesarios
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos usando Drizzle
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

    // Verificar la contraseña bcrypt.hash(password,15)
    const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);


    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
      } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retornar datos del usuario y token (sin passwordHash)
    return NextResponse.json({
      success: true,
      token,
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