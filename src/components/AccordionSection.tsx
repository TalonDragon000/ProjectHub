import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export type ColorScheme = 'amber' | 'blue' | 'slate' | 'white';

interface AccordionSectionProps {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  colorScheme: ColorScheme;
}

const colorSchemes: Record<ColorScheme, { bg: string; border: string; iconBg: string; headerBg: string }> = {
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
    headerBg: 'hover:bg-amber-50/50',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-500',
    headerBg: 'hover:bg-blue-50/50',
  },
  slate: {
    bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
    border: 'border-slate-300',
    iconBg: 'bg-slate-700',
    headerBg: 'hover:bg-slate-100/50',
  },
  white: {
    bg: 'bg-white',
    border: 'border-slate-200',
    iconBg: 'bg-yellow-500',
    headerBg: 'hover:bg-slate-50',
  },
};

export default function AccordionSection({
  id,
  stepNumber,
  title,
  subtitle,
  icon,
  isExpanded,
  onToggle,
  children,
  colorScheme,
}: AccordionSectionProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <section
      id={id}
      className={`rounded-xl border ${colors.border} overflow-hidden transition-all duration-300 ${
        isExpanded ? colors.bg : 'bg-white'
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${colors.headerBg}`}
      >
        <div className="flex items-center space-x-4">
          {/* Step number badge */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isExpanded ? `${colors.iconBg} text-white` : 'bg-slate-200 text-slate-600'
            }`}
          >
            {stepNumber}
          </div>

          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isExpanded ? `${colors.iconBg} text-white` : 'bg-slate-100 text-slate-500'
            }`}
          >
            {icon}
          </div>

          {/* Title & Subtitle */}
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content - Expandable */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </section>
  );
}