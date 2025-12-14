import React, { useState, useEffect, useCallback } from 'react';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(handleClose, 3000);
        return () => clearTimeout(timer);
    }, [handleClose]);

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
    };

    return (
        <div
            className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-xl shadow-lg 
                  flex items-center gap-2 animate-[fadeInUp_0.3s_ease-out]
                  min-w-[250px] max-w-[320px]`}
            onClick={onClose}
        >
            <span className="text-lg">{icons[toast.type]}</span>
            <span className="font-medium text-sm">{toast.message}</span>
        </div>
    );
};

// Hook to manage toasts
export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
};
