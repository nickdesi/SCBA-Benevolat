import React from 'react';
import { MotionIconWrapper } from './Icons';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    /** Unicode icon or SVG component */
    icon?: React.ReactNode | string;
    /** Primary title */
    title: string;
    /** Helper text */
    description?: string;
    /** Optional Call to Action button */
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    /** Optional secondary icon/background effect */
    variant?: 'default' | 'fun' | 'simple';
    /** Custom class for wrapper */
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '📭',
    title,
    description,
    action,
    variant = 'default',
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`
                flex flex-col items-center justify-center text-center p-8 
                ${variant === 'fun' ? 'bg-white rounded-3xl shadow-2xl p-16 border border-slate-100' : ''}
                ${className}
            `}
        >
            {/* Icon Container */}
            <div className={`
                mb-6 relative inline-block
                ${variant === 'fun' ? 'text-6xl' : 'text-5xl text-slate-300'}
            `}>
                {variant === 'fun' && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-3xl opacity-20 scale-150 animate-pulse-glow"></div>
                        <div className="relative bg-gradient-to-br from-red-50 to-orange-50 w-32 h-32 rounded-3xl flex items-center justify-center shadow-lg mx-auto">
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
            <h3 className={`
                text-2xl font-bold mb-2
                ${variant === 'fun' ? 'text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent' : 'text-slate-700'}
            `}>
                {title}
            </h3>

            {description && (
                <p className={`
                    max-w-md mx-auto
                    ${variant === 'fun' ? 'text-lg text-slate-500 mb-10' : 'text-slate-400 mb-6'}
                `}>
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className={`
                        inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold font-sport transition-all shadow-lg
                        ${variant === 'fun'
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-red-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                        }
                    `}
                >
                    {action.icon}
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
};
