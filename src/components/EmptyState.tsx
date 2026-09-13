import React from 'react';
import { MotionIconWrapper } from './Icons';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

// Default SVG icon component (per UI/UX Pro Max: no emoji icons)
const DefaultIcon = () => <Inbox className="w-12 h-12 text-slate-400" strokeWidth={1.5} />;

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gradient';
}

interface EmptyStateProps {
  /** Unicode icon or SVG component */
  icon?: React.ReactNode | string;
  /** Primary title */
  title: string;
  /** Helper text */
  description?: string;
  /** Primary Call to Action button */
  action?: EmptyStateAction;
  /** Optional secondary Call to Action button */
  secondaryAction?: EmptyStateAction;
  /** Optional secondary icon/background effect */
  variant?: 'default' | 'fun' | 'simple';
  /** Custom class for wrapper */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <DefaultIcon />,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
                flex flex-col items-center justify-center text-center p-8
                ${variant === 'fun' ? 'bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 sm:p-14 border border-slate-100 dark:border-slate-800' : ''}
                ${className}
            `}
    >
      {/* Icon Container */}
      <div
        className={`
                mb-6 relative inline-block
                ${variant === 'fun' ? 'text-6xl' : 'text-5xl text-slate-300 dark:text-slate-600'}
            `}
      >
        {variant === 'fun' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-3xl opacity-20 scale-150 animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center shadow-lg mx-auto border border-blue-100/50 dark:border-indigo-800/40">
              {icon}
            </div>
          </>
        )}
        {variant !== 'fun' && (
          <MotionIconWrapper
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            {icon}
          </MotionIconWrapper>
        )}
      </div>

      {/* Content */}
      <h3
        className={`
                text-2xl font-bold mb-2
                ${variant === 'fun' ? 'text-2xl sm:text-3xl font-black text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}
            `}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`
                    max-w-md mx-auto leading-relaxed
                    ${variant === 'fun' ? 'text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8' : 'text-slate-500 dark:text-slate-400 mb-6'}
                `}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
          {action && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`
                            w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer
                            ${
                              action.variant === 'gradient' || variant === 'fun'
                                ? 'bg-[#3629e1] hover:bg-[#2a21b4] text-white shadow-[#3629e1]/25 hover:shadow-lg hover:shadow-[#3629e1]/35'
                                : 'bg-[#3629e1] text-white hover:bg-[#2a21b4] shadow-[#3629e1]/20 dark:shadow-none'
                            }
                        `}
            >
              {action.icon}
              {action.label}
            </motion.button>
          )}

          {secondaryAction && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};
