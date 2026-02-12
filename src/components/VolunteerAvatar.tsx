import React from 'react';
import { UserIcon } from './Icons';
import { CheckCircle } from 'lucide-react';

interface VolunteerAvatarProps {
    name: string;
    isMine?: boolean;
    onRemove?: () => void;
    isAdmin?: boolean;
    canEdit?: boolean;
    onEdit?: () => void;
}

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const VolunteerAvatar: React.FC<VolunteerAvatarProps> = ({
    name,
    isMine,
    onRemove,
    isAdmin,
    canEdit,
    onEdit
}) => {
    return (
        <div className="group relative flex flex-col items-center gap-1 animate-scale-in">
            {/* Avatar Circle */}
            <div className={`
                w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105
                ${isMine
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-200 dark:ring-blue-900'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300'
                }
            `}>
                <span className="text-sm font-bold tracking-tight">
                    {getInitials(name)}
                </span>

                {/* Badge "Me" */}
                {isMine && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                        Moi
                    </div>
                )}
            </div>

            {/* Name Label */}
            <span className="text-xs text-center font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]" title={name}>
                {name}
            </span>

            {/* Admin/User Actions Overlay (Hover) - DEBUG: Removed opacity-0 for visibility check */}
            {(isAdmin || isMine) && (
                <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                    {onRemove && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Delete button clicked for', name);
                                onRemove();
                            }}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                            title="Retirer"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VolunteerAvatar;
