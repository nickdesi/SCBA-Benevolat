import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScrollLock from '../utils/useScrollLock';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    confirmStyle?: 'primary' | 'danger' | 'success';
    onConfirm: () => void;
    onCancel: () => void;
}

// Style constants (outside component to prevent recreation)
const CONFIRM_BUTTON_STYLES = {
    primary: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/30',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30',
} as const;

const CONFIRM_ICONS = {
    primary: '✋',
    danger: '⚠️',
    success: '✅',
} as const;

// Animation variants for smooth transitions
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 25
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: {
            type: 'tween' as const,
            duration: 0.15
        }
    }
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText = 'Annuler',
    confirmStyle = 'primary',
    onConfirm,
    onCancel,
}) => {
    useScrollLock(isOpen);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Animated backdrop */}
                    <motion.div
                        key="confirm-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                        onClick={onCancel}
                    />

                    {/* Animated modal container */}
                    <motion.div
                        key="confirm-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-1/2 left-1/2 z-[9999] w-full max-w-sm px-4"
                        style={{ x: '-50%', y: '-50%' }}
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 ring-1 ring-black/10 dark:ring-white/10">
                            {/* Icon with subtle animation */}
                            <motion.div
                                className="text-center mb-4"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                            >
                                <span className="text-5xl">{CONFIRM_ICONS[confirmStyle]}</span>
                            </motion.div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
                                {title}
                            </h3>

                            {/* Message */}
                            <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                                {message}
                            </p>

                            {/* Buttons with hover animations */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onCancel}
                                    className="flex-1 py-3 px-4 text-base font-semibold text-slate-700 dark:text-slate-200
                                     bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    {cancelText}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 px-4 text-base font-bold text-white rounded-xl 
                                      transition-all shadow-lg ${CONFIRM_BUTTON_STYLES[confirmStyle]}`}
                                >
                                    {confirmText}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmModal;

