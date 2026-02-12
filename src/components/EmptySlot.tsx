import React from 'react';
import { PlusIcon } from './Icons';

interface EmptySlotProps {
    onClick: () => void;
    label?: string;
    isUrgent?: boolean;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ onClick, label = "Rejoindre", isUrgent }) => {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center gap-1 focus:outline-none"
            title="S'inscrire sur ce poste"
        >
            {/* Dashed Circle */}
            <div className={`
                w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200
                ${isUrgent
                    ? 'border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-900/10 animate-pulse-slow'
                    : 'border-slate-300 hover:border-amber-400 bg-transparent hover:bg-amber-50 dark:border-slate-600 dark:hover:border-amber-500/50 dark:hover:bg-amber-900/10'
                }
            `}>
                <PlusIcon className={`
                    w-5 h-5 transition-colors
                    ${isUrgent
                        ? 'text-red-400'
                        : 'text-slate-400 group-hover:text-amber-500'
                    }
                `} />
            </div>

            {/* Label */}
            <span className={`
                text-xs font-medium transition-colors
                ${isUrgent
                    ? 'text-red-500'
                    : 'text-slate-400 group-hover:text-amber-600 dark:text-slate-500 dark:group-hover:text-amber-400'
                }
            `}>
                {label}
            </span>
        </button>
    );
};

export default EmptySlot;
