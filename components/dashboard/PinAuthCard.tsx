'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@/types';
import { Lock, ShieldAlert } from 'lucide-react';

interface Props {
  tenant: Tenant;
  token: string;
  onAuthenticated: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000;

export function PinAuthCard({ tenant, token, onAuthenticated }: Props) {
  const [pinInput, setPinInput] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem(`attempts_${tenant.id}`) || '0', 10);
    }
    return 0;
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`lockout_${tenant.id}`);
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lockoutUntil) return;

    const tick = () => setNow(Date.now());
    tick();

    const intervalId = window.setInterval(tick, 60_000);
    return () => window.clearInterval(intervalId);
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil !== null && now < lockoutUntil;
  const remainingMinutes = isLockedOut
    ? Math.ceil((lockoutUntil - now) / 60000)
    : 0;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const validPin = tenant.admin_pin || '1234';

    if (pinInput.trim() === validPin) {
      onAuthenticated();
      localStorage.removeItem(`attempts_${tenant.id}`);
      localStorage.removeItem(`lockout_${tenant.id}`);
      localStorage.setItem(`auth_token_${token}`, 'true');
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem(`attempts_${tenant.id}`, nextAttempts.toString());

      if (nextAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_TIME_MS;
        setLockoutUntil(lockoutTime);
        localStorage.setItem(`lockout_${tenant.id}`, lockoutTime.toString());
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center space-y-4">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        {isLockedOut ? (
          <ShieldAlert className="w-6 h-6 text-red-600" />
        ) : (
          <Lock className="w-6 h-6" />
        )}
      </div>

      <div>
        <h2 className="font-bold text-gray-900">Ingreso al Panel</h2>
        <p className="text-xs text-gray-500 mt-1">Ingresa tu PIN de 4 dígitos</p>
      </div>

      {isLockedOut ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
          Demasiados intentos fallidos. Bloqueado por {remainingMinutes} min.
        </div>
      ) : (
        <form onSubmit={handleVerifyPin} className="space-y-3 max-w-xs mx-auto">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="0 0 0 0"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl font-mono text-gray-900 font-bold tracking-widest p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {failedAttempts > 0 && (
            <p className="text-xs text-red-500 font-semibold">
              PIN incorrecto. Intentos restantes: {MAX_ATTEMPTS - failedAttempts}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
          >
            Ingresar
          </button>
        </form>
      )}
    </div>
  );
}
