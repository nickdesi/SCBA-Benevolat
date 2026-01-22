import React from 'react';
import { motion, SVGMotionProps } from 'framer-motion';

// Generic Motion wrapper for interactions
export const MotionIconWrapper = motion.div;

// Animated Basketball Icon (Bounce on hover/tap)
export const AnimatedBallIcon: React.FC<SVGMotionProps<SVGSVGElement>> = (props) => (
    <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        whileHover={{ y: -4, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </motion.svg>
);

// Simple Basketball Icon (no animation, for static usage like headers)
export const BasketballIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

// Animated Badge Check (Pop effect)
export const AnimatedCheckBadge: React.FC<SVGMotionProps<SVGSVGElement>> = (props) => (
    <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
    >
        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm4.45 6.45l-4.5 4.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 111.06-1.06l.97.97 3.97-3.97a.75.75 0 111.06 1.06z" clipRule="evenodd" />
    </motion.svg>
);

// Calendar Icon
export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);

// Clock Icon
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Location Icon
export const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

// Edit Icon
export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

// Delete Icon
export const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

// Remove User Icon
export const RemoveUserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
    </svg>
);

// Edit Pencil Icon
export const EditPencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
);

// Plus Icon
export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

// Check Icon
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

// User Icon
export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

// Google Calendar Icon (Official Style)
export const GoogleCalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        {/* Background Canvas */}
        <rect fill="#fff" x="0" y="0" width="48" height="48" rx="8" ry="8" />

        {/* Blue Segment (Top-Left / Left) */}
        <path fill="#4285F4" d="M37,6H11c-2.76,0-5,2.24-5,5v26c0,0.55,0.45,1,1,1h4V11c0-2.76,2.24-5,5-5h21V6z" />

        {/* Green Segment (Bottom-Left / Bottom) */}
        <path fill="#34A853" d="M11,42h26c0.55,0,1-0.45,1-1v-4H16c-2.76,0-5-2.24-5-5V12H6v25C6,39.76,8.24,42,11,42z" />

        {/* Yellow Segment (Top-Right / Right) */}
        <path fill="#FBBC04" d="M37,6c0.55,0,1,0.45,1,1v26h4V11c0-2.76-2.24-5-5-5H37z" />

        {/* Red Segment (Bottom-Right / Corner) */}
        <path fill="#EA4335" d="M37,42h-4v-5h5c2.76,0,5-2.24,5-5v-5h-5v14C38,41.55,37.55,42,37,42z" />

        {/* Fold Effect (Red Triangle) */}
        <path fill="#EA4335" d="M37,32l5,5v-5H37z" opacity="0.1" />

        {/* 31 Text - High Fidelity via SVG path to avoid font issues */}
        <g transform="translate(14, 15)">
            <path fill="#4285F4" d="M3.5,0h4.8v2.4H6.3v1.5h2v2.4h-2V7.8h2.1v2.4H3.5V8.9H4V7.5H3.5V0z M12,0h2.4v10.2H12V3h-1.6L9.6,4.2L8.9,2.8L11.8,0.9H12z" transform="scale(1.5)" />
        </g>
    </svg>
);

// Outlook Calendar Icon (Official Style)
export const OutlookCalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        <path fill="#0078D4" d="M2.5 10.37L16.29 6.7V39.9L2.5 36.23L2.5 10.37Z" />
        <path fill="#50D1FF" d="M7 16h6v3H7zM7 21h6v3H7zM7 26h6v3H7z" />
        <path fill="#28A8EA" d="M16.29 6.7L42.16 10.37V39.9L16.29 36.23V6.7Z" opacity="0.3" />
        <path fill="#107C41" d="M16 6.7h29.5v33.2H16z" opacity="0" />
        <rect x="16.29" y="10.37" width="29.21" height="25.86" fill="#0078D4" opacity="0" />
        <path fill="#0078D4" d="M16.29 6.7L44.5 10.37V39.9L16.29 36.23V6.7Z" opacity="0" />
        <rect fill="#0072C6" x="16" y="8" width="28" height="32" rx="2" ry="2" />
        <rect fill="#fff" x="18" y="10" width="24" height="28" rx="2" ry="2" opacity="0.1" />
        <rect fill="#fff" x="17" y="9" width="26" height="30" rx="1" ry="1" />

        {/* Envelope O shape */}
        <rect fill="#0078D4" x="20" y="13" width="20" height="22" rx="2" ry="2" />
        <path fill="#fff" d="M22 17h16v-2h-16v2zm0 4h16v-2h-16v2zm0 4h16v-2h-16v2zm0 4h10v-2h-10v2z" opacity="0.8" />

        <g transform="translate(4, 18)">
            <text x="0" y="0" fontFamily="Segoe UI, sans-serif" fontWeight="bold" fontSize="16" fill="#fff">O</text>
        </g>
        <path fill="#0072C6" d="M2 11S1 11 1 12v24c0 1 1 2 2 2h14l.01-14.73 24.99-9.13V12c0-1-1-2-2-2H2zm26.06 9.87L15.01 26.68 2 20.87v-5l26.06 5z" />
        <path fill="#50D1FF" d="M15.01 26.68l-13.01-5.81v14.72l13.01 5.81V26.68z" />
        <path fill="#28A8EA" d="M42 15.87l-13.94 5L41.39 26.68 42 26.43V15.87z" />
        <path fill="#004b8c" d="M42 38H15.01v-3.79l26.39-11.78L42 22.68V38z" opacity=".2" />
        <path fill="#004b8c" d="M15.01 41.4l-13.01-5.81v2.41c0 1 1 2 2 2h11.01V41.4z" opacity=".2" />
        <path fill="#0078D4" d="M26 12L2 20.87v2.32L26 14.32V12zm0 18.84l-11-4.89V12l11 4.91v13.93z" opacity="0" />
        <g transform="translate(1,9) scale(0.95)">
            <rect fill="#0078D4" x="0" y="0" width="16" height="32" />
            <text x="8" y="22" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold" fontFamily="Arial">O</text>
        </g>
        <g transform="translate(17,8) scale(1)">
            <rect fill="#fff" x="0" y="0" width="28" height="32" rx="2" ry="2" />
            <rect fill="#0078D4" x="3" y="10" width="22" height="4" rx="1" />
            <rect fill="#0078D4" x="3" y="16" width="22" height="4" rx="1" />
            <rect fill="#0078D4" x="3" y="22" width="16" height="4" rx="1" />
            <circle fill="#0078D4" cx="24" cy="24" r="3" />
            <path fill="#fff" stroke="#fff" strokeWidth="1" d="M22,23 L23.5,25 L26,22" fill-opacity="0" />
        </g>
    </svg>
);

// Apple Calendar Icon (Official Style)
export const AppleCalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        <rect fill="#fff" x="4" y="4" width="40" height="40" rx="9" ry="9" />
        <path fill="#FF3B30" d="M44 13C44 8.02944 39.9706 4 35 4H13C8.02944 4 4 8.02944 4 13V16H44V13Z" />
        <text x="50%" y="65%" textAnchor="middle" fill="#1C1C1E" fontSize="22" fontWeight="500" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
            {new Date().getDate()}
        </text>
        <text x="50%" y="35%" textAnchor="middle" fill="#FF3B30" fontSize="9" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" className="uppercase tracking-widest">
            {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date()).toUpperCase().replace('.', '')}
        </text>
    </svg>
);

export const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

export const AppleIcon = () => (
    <svg viewBox="0 0 384 512" className="w-full h-full" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
    </svg>
);
