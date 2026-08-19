import React from 'react';
import { PlusIcon } from './Icons';

interface EmptySlotProps {
  onClick: () => void;
  label?: string;
  isUrgent?: boolean;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ onClick, label = 'Rejoindre', isUrgent }) => {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1 focus:outline-none"
      title="S'inscrire sur ce poste"
    >
      {/* Dashed Circle - 48x48px Touch Target */}
      <div
        className={`
                w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200
                ${
                  isUrgent
                    ? 'border-[#aa2e0f]/50 bg-[#aa2e0f]/10 dark:border-red-500/60 dark:bg-red-950/40 animate-pulse-slow'
                    : 'border-slate-300 hover:border-[#3629e1] bg-slate-100/70 hover:bg-indigo-50/80 dark:border-slate-600 dark:hover:border-indigo-400 dark:bg-slate-800/40 dark:hover:bg-indigo-950/30'
                }
            `}
      >
        <PlusIcon
          className={`
                    w-5 h-5 transition-colors
                    ${isUrgent ? 'text-[#aa2e0f] dark:text-red-300' : 'text-slate-600 group-hover:text-[#3629e1] dark:text-slate-300 dark:group-hover:text-indigo-300'}
                `}
        />
      </div>

      {/* Label with WCAG AA compliant contrast */}
      <span
        className={`
                text-xs font-medium transition-colors
                ${
                  isUrgent
                    ? 'text-[#aa2e0f] dark:text-red-300 font-semibold'
                    : 'text-slate-600 group-hover:text-[#3629e1] dark:text-slate-300 dark:group-hover:text-indigo-300'
                }
            `}
      >
        {label}
      </span>
    </button>
  );
};

export default EmptySlot;
