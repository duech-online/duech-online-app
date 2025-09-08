'use client';
import { useSearchParams } from 'next/navigation';
import { useActionState, Suspense } from 'react';
import { register } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';

function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [errorMessage, formAction, isPending] = useActionState(register, undefined);

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto w-full max-w-[420px] space-y-3 p-4 md:-mt-32">
        <h1 className="mb-2 text-center text-2xl font-semibold text-gray-800">Crear cuenta</h1>
        <form action={formAction} className="space-y-3 rounded-lg bg-gray-50 px-6 pt-6 pb-6">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-900">Nombre</span>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-900">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-900">Contraseña</span>
            <input
              name="password"
              type="password"
              minLength={6}
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </label>
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          <Button className="mt-2 w-full" aria-disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Registrarme'}
          </Button>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <a
              className="text-blue-600 hover:text-blue-800"
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Inicia sesión
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center md:h-screen">
          <div className="relative mx-auto w-full max-w-[420px] space-y-3 p-4 md:-mt-32">
            <h1 className="mb-2 text-center text-2xl font-semibold text-gray-800">Crear cuenta</h1>
            <div className="space-y-3 rounded-lg bg-gray-50 px-6 pt-6 pb-6">
              <p className="text-center text-gray-600">Cargando...</p>
            </div>
          </div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
