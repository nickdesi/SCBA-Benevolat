import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

// SVG Icons for professional look (per UI/UX skill: no emoji icons)
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
);

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return createPortal(
        <div
            className="fixed z-[9999] pointer-events-none
                       bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6
                       flex flex-col gap-3 items-center sm:items-end"
            aria-live="polite"
            aria-label="Notifications"
        >
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>,
        document.body
    );
};

interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = memo(({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        // Wait for exit animation before removing
        setTimeout(onClose, 200);
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(handleClose, 4000);
        return () => clearTimeout(timer);
    }, [handleClose]);

    // Rich color schemes with gradients (inspired by Sonner richColors)
    const styles = {
        success: {
            container: 'bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700',
            icon: 'text-white/90',
            text: 'text-white',
            shadow: 'shadow-emerald-500/25',
        },
        error: {
            container: 'bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700',
            icon: 'text-white/90',
            text: 'text-white',
            shadow: 'shadow-red-500/25',
        },
        info: {
            container: 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700',
            icon: 'text-white/90',
            text: 'text-white',
            shadow: 'shadow-blue-500/25',
        },
    };

    const icons = {
        success: <CheckIcon />,
        error: <ErrorIcon />,
        info: <InfoIcon />,
    };

    const currentStyle = styles[toast.type];

    return (
        <div
            role="status"
            aria-live="polite"
            className={`
                ${currentStyle.container} 
                ${currentStyle.shadow}
                pointer-events-auto cursor-pointer
                px-4 py-3 rounded-2xl shadow-xl
                flex items-center gap-3
                min-w-[280px] max-w-[400px] sm:max-w-[360px]
                backdrop-blur-sm
                border border-white/20
                transform transition-all duration-200 ease-out
                ${isVisible
                    ? 'translate-y-0 opacity-100 scale-100'
                    : 'translate-y-2 opacity-0 scale-95'}
                hover:scale-[1.02] hover:shadow-2xl
                active:scale-[0.98]
            `}
            onClick={handleClose}
            style={{
                animation: isVisible ? 'slideInUp 0.3s ease-out' : undefined,
            }}
        >
            {/* Icon container with subtle background */}
            <div className={`flex-shrink-0 p-1.5 rounded-full bg-white/20 ${currentStyle.icon}`}>
                {icons[toast.type]}
            </div>

            {/* Message */}
            <span className={`font-semibold text-sm flex-1 ${currentStyle.text}`}>
                {toast.message}
            </span>

            {/* Close hint on hover (desktop only) */}
            <div className="hidden sm:flex flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/70">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
            </div>
        </div>
    );
});

ToastItem.displayName = 'ToastItem';

// Hook to manage toasts
export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, visible: true }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};

// Add required keyframes to document head (one-time)
if (typeof document !== 'undefined') {
    const styleId = 'toast-animations';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes slideInUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
