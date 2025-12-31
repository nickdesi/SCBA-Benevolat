import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

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
    // Prevent background scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Full screen overlay with backdrop */}
            <div
                className="fixed top-0 left-0 w-full h-full bg-black/50 z-[9998]"
                onClick={onCancel}
            />

            {/* Modal container - absolutely centered */}
            <div
                className="fixed top-1/2 left-1/2 z-[9999] w-full max-w-sm px-4"
                style={{ transform: 'translate(-50%, -50%)' }}
            >
                <div className="bg-white rounded-2xl shadow-2xl p-6 ring-1 ring-black/10">
                    {/* Icon */}
                    <div className="text-center mb-4">
                        <span className="text-5xl">{CONFIRM_ICONS[confirmStyle]}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-slate-600 text-center mb-6">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 text-base font-semibold text-slate-700 
                         bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-4 text-base font-bold text-white rounded-xl 
                          transition-all shadow-lg ${CONFIRM_BUTTON_STYLES[confirmStyle]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default ConfirmModal;
