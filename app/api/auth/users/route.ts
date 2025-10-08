// app/api/auth/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/app/lib/db';
import { sql } from 'drizzle-orm';

interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'ba2957cefdc373a77a269222951e6062';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'No tienes permisos para acceder a esta información' },
          { status: 403 }
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const usersResult = await db.execute(sql`
      SELECT id, username, email, role, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    const users = usersResult.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email || undefined,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener usuarios',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}