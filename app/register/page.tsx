import { Suspense } from 'react';
import RegisterForm from '@/app/ui/register-form';

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
