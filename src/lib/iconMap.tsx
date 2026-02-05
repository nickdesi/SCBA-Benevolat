import React from 'react';
import {
    Beer,
    Timer,
    ClipboardList,
    Cookie,
    Home,
    Plane,
    Car,
    Calendar,
    Smile,
    type LucideIcon
} from 'lucide-react';

// Centralized icon mapping for consistent iconography across the app
// Replaces emoji usage with professional SVG icons

export type IconId =
    | 'beer'
    | 'timer'
    | 'clipboard'
    | 'cookie'
    | 'home'
    | 'plane'
    | 'car'
    | 'calendar'
    | 'default';

const iconMap: Record<IconId, LucideIcon> = {
    beer: Beer,
    timer: Timer,
    clipboard: ClipboardList,
    cookie: Cookie,
    home: Home,
    plane: Plane,
    car: Car,
    calendar: Calendar,
    default: Smile,
};

// Role configuration with icon ID and colors for modern styling
export interface RoleConfig {
    iconId: IconId;
    bgColor: string;      // Background for icon circle
    textColor: string;    // Icon color
    borderColor: string;  // Left border accent
    gradientFrom: string; // Card gradient start
    gradientTo: string;   // Card gradient end
}

export const roleConfigMap: Record<string, RoleConfig> = {
    'Buvette': {
        iconId: 'beer',
        bgColor: 'bg-amber-100 dark:bg-amber-500/20',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-l-amber-500',
        gradientFrom: 'from-amber-50/50',
        gradientTo: 'to-white',
    },
    'Chrono': {
        iconId: 'timer',
        bgColor: 'bg-blue-100 dark:bg-blue-500/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-l-blue-500',
        gradientFrom: 'from-blue-50/50',
        gradientTo: 'to-white',
    },
    'Table de marque': {
        iconId: 'clipboard',
        bgColor: 'bg-indigo-100 dark:bg-indigo-500/20',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        borderColor: 'border-l-indigo-500',
        gradientFrom: 'from-indigo-50/50',
        gradientTo: 'to-white',
    },
    'Goûter': {
        iconId: 'cookie',
        bgColor: 'bg-pink-100 dark:bg-pink-500/20',
        textColor: 'text-pink-600 dark:text-pink-400',
        borderColor: 'border-l-pink-500',
        gradientFrom: 'from-pink-50/50',
        gradientTo: 'to-white',
    },
};

// Default config for unknown roles
const defaultRoleConfig: RoleConfig = {
    iconId: 'default',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-l-slate-400',
    gradientFrom: 'from-slate-50/50',
    gradientTo: 'to-white',
};

// Role name to icon ID mapping (legacy, kept for compatibility)
export const roleIconMap: Record<string, IconId> = {
    'Buvette': 'beer',
    'Chrono': 'timer',
    'Table de marque': 'clipboard',
    'Goûter': 'cookie',
};

/**
 * Get role configuration by role name
 */
export const getRoleConfig = (role: string): RoleConfig => {
    return roleConfigMap[role] || defaultRoleConfig;
};

interface IconProps {
    id: IconId;
    className?: string;
    size?: number;
}

/**
 * Get a Lucide icon component by ID
 * @example <Icon id="beer" className="w-5 h-5" />
 */
export const Icon: React.FC<IconProps> = ({ id, className = 'w-5 h-5', size }) => {
    const IconComponent = iconMap[id] || iconMap.default;
    return <IconComponent className={className} size={size} />;
};

/**
 * Get a Lucide icon for a volunteer role name
 * @example <RoleIcon role="Buvette" className="w-4 h-4" />
 */
export const RoleIcon: React.FC<{ role: string; className?: string }> = ({ role, className = 'w-4 h-4' }) => {
    const config = getRoleConfig(role);
    return <Icon id={config.iconId} className={className} />;
};

/**
 * Styled role icon with colored circle background
 * @example <StyledRoleIcon role="Buvette" size="md" />
 */
export const StyledRoleIcon: React.FC<{ role: string; size?: 'sm' | 'md' | 'lg' }> = ({ role, size = 'md' }) => {
    const config = getRoleConfig(role);

    // Container sizes (width/height of the circle)
    const containerSize = {
        sm: 'w-7 h-7',
        md: 'w-9 h-9',
        lg: 'w-11 h-11',
    };

    // Icon sizes inside the circle
    const iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <div className={`${containerSize[size]} rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon id={config.iconId} className={`${iconSize[size]} ${config.textColor}`} />
        </div>
    );
};


