import React, { useState, memo } from 'react';

interface PhoneDisplayProps {
    phone: string;
}

/**
 * Phone number display component with privacy masking.
 * Shows masked phone by default, click to reveal.
 */
const PhoneDisplay: React.FC<PhoneDisplayProps> = memo(({ phone }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const maskPhone = (phoneNumber: string): string => {
        // Keep first 2 and last 2 digits, mask the rest
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length <= 4) return phoneNumber; // Too short to mask
        const first = digits.slice(0, 2);
        const last = digits.slice(-2);
        return `${first} •• •• •• ${last}`;
    };

    return (
        <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors group"
            title={isRevealed ? "Cliquer pour masquer" : "Cliquer pour afficher le numéro"}
        >
            <span>📞</span>
            <span className={isRevealed ? '' : 'font-mono'}>
                {isRevealed ? phone : maskPhone(phone)}
            </span>
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {isRevealed ? '🔒' : '👁️'}
            </span>
        </button>
    );
});

PhoneDisplay.displayName = 'PhoneDisplay';

export default PhoneDisplay;
