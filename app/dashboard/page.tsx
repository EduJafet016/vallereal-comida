import Link from 'next/link';
import { Lock, Store } from 'lucide-react';

export default function DashboardIndexPage() {
  return (
    <main className="p-4 max-w-md mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full bg-white p-6 rounded-3xl border shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">Acceso al Panel</h1>
          <p className="text-xs text-gray-500 mt-2">
            Para gestionar tu negocio necesitas ingresar desde el **enlace privado** proporcionado al registrarte.
          </p>
        </div>

        <div className="pt-2 border-t space-y-2">
          <Link
            href="/registro"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md"
          >
            Registrar mi Restaurante
          </Link>
          <Link
            href="/"
            className="block text-xs text-gray-400 hover:text-gray-600 font-semibold"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}