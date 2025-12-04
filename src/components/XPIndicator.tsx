import { useEffect, useState } from 'react';

interface XPIndicatorProps {
  show: boolean;
  amount: number;
}

export default function XPIndicator({ show, amount }: XPIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  const isPositive = amount > 0;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const bgClass = isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div
      className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border ${bgClass} ${colorClass} font-semibold text-sm whitespace-nowrap shadow-lg animate-fade-up-out pointer-events-none z-10`}
      style={{
        animation: 'fadeUpOut 3s ease-out forwards',
      }}
    >
      {isPositive ? '+' : ''}{amount} XP
    </div>
  );
}
