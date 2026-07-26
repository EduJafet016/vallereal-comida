import { ReactNode } from 'lucide-react'; // o react normal

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 ${className}`}>
      {children}
    </div>
  );
}