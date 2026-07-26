import { ReactNode } from 'react';

export function CardBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 ${className}`}>
      {children}
    </div>
  );
}