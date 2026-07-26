import { ReactNode } from 'react';

interface CardBoxProps {
  children: ReactNode;
  className?: string;
}

export function CardBox({ children, className = '' }: CardBoxProps) {
  return (
    <div className={`bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 ${className}`}>
      {children}
    </div>
  );
}