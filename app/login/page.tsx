import LoginForm from '../ui/login-form';
import { Suspense } from 'react';

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center md:h-screen">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <h1 className="mb-2 text-center text-2xl font-semibold text-gray-800">Iniciar sesión</h1>
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}