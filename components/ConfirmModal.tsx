import React, { useEffect } from 'react';

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
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position and lock
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll position when modal closes
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const confirmButtonStyles = {
        primary: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-500/30',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/30',
        success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30',
    };

    const icons = {
        primary: '✋',
        danger: '⚠️',
        success: '✅',
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            style={{ height: '100dvh', minHeight: '100vh' }}
        >
            {/* Invisible click area to close */}
            <div
                className="absolute inset-0 pointer-events-auto"
                onClick={onCancel}
            />

            {/* Modal - centered on screen */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 
                    animate-[fadeInUp_0.3s_ease-out] pointer-events-auto
                    ring-1 ring-black/10">
                {/* Icon */}
                <div className="text-center mb-4">
                    <span className="text-5xl">{icons[confirmStyle]}</span>
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
                      transition-all shadow-lg ${confirmButtonStyles[confirmStyle]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
