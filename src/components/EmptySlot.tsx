import React from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from './Icons';

interface EmptySlotProps {
  onClick: () => void;
  label?: string;
  isUrgent?: boolean;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ onClick, label = 'Rejoindre', isUrgent }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
      title="S'inscrire sur ce poste"
    >
      {/* Dashed Circle with Glow */}
      <div
        className={`
          relative w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300
          ${
            isUrgent
              ? 'border-orange-500/80 bg-orange-500/10 text-orange-600 dark:border-orange-400 dark:bg-orange-950/40 dark:text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
              : 'border-slate-300/80 hover:border-[#3629e1] bg-slate-100/80 hover:bg-indigo-50/90 text-slate-500 hover:text-[#3629e1] dark:border-slate-600/80 dark:hover:border-indigo-400 dark:bg-slate-800/50 dark:hover:bg-indigo-950/40 dark:text-slate-400 dark:hover:text-indigo-300'
          }
        `}
      >
        <PlusIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
      </div>

      {/* Action Tag */}
      <span
        className={`
          text-[11px] font-bold tracking-tight px-2 py-0.5 rounded-full transition-all duration-200
          ${
            isUrgent
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold border border-orange-200/60 dark:border-orange-800/60 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 group-hover:text-[#3629e1] dark:group-hover:text-indigo-300'
          }
        `}
      >
        {label}
      </span>
    </motion.button>
  );
};

export default EmptySlot;
