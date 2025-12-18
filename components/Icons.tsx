import React from 'react';

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
        <rect fill="#fff" x="0" y="0" width="48" height="48" rx="8" ry="8" />
        <path fill="#4285F4" d="M36.19 12.01L14.71 12.01C12.67 12.01 11 13.68 11 15.72L11 36.29C11 38.33 12.66 40 14.71 40L36.18 40C38.23 40 39.9 38.33 39.9 36.29L39.9 15.72C39.9 13.68 38.24 12.01 36.19 12.01Z" />
        <path fill="#fff" d="M25.44 26.01C25.44 23.8 27.23 22.01 29.44 22.01C31.65 22.01 33.44 23.8 33.44 26.01C33.44 28.22 31.65 30.01 29.44 30.01C27.23 30.01 25.44 28.22 25.44 26.01Z" />
        <path fill="#4285F4" d="M11 12h27.9c2.04 0 3.71 1.67 3.71 3.72v20.57c0 2.05-1.67 3.71-3.71 3.71H14.71c-2.05 0-3.71-1.67-3.71-3.71V12z" />
        <path fill="#EA4335" d="M37.5,6v8.5H12V6c0-1.66,1.34-3,3-3h19.5C36.16,3,37.5,4.34,37.5,6z" />
        <path fill="#34A853" d="M37.5,14.5v28c0,1.66-1.34,3-3,3h-22c-1.66,0-3-1.34-3-3v-28H37.5z" />
        <path fill="#4285F4" d="M32.5 45.49L37.9 40.09C38.6 39.39 39 38.49 39 37.49L39 12.51C39 12.21 38.8 12.01 38.5 12.01L14.5 12.01L9.5 7.01C9 6.51 8.8 5.81 8.8 5.01L8.8 42.49C8.8 44.15 10.15 45.49 11.8 45.49L32.5 45.49Z" opacity="0" />
        <g>
            <path fill="#FBBC04" d="M12,41c0,1.66,1.34,3,3,3h23l-7-7H15C13.34,37,12,38.34,12,41z" />
            <path fill="#1967D2" d="M37.5,14.5L37.5,14.5c0-1.66-1.34-3-3-3h-29L9.5,8L12,11.5l25.5,0V14.5z" />
        </g>
        <path d="M12,41c0,1.66,1.34,3,3,3h23c1.66,0,3-1.34,3-3v-6.5h-29V41z" fill="#34A853" />
        <path d="M38,14.5c0-1.66-1.34-3-3-3H15c-1.66,0-3,1.34-3,3v20h26V14.5z" fill="#4285F4" />
        <rect fill="#EA4335" x="12" y="6" width="26" height="8.5" />
        <path fill="#FBBC04" d="M12,34.5v6.5c0,1.66,1.34,3,3,3h16V34.5H12z" />
        <text x="50%" y="68%" textAnchor="middle" fill="#4285F4" fontSize="20" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif">31</text>
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
