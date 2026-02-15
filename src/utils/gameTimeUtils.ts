import { UserRegistration } from '../types';
import { getTodayISO } from './dateUtils';

export const isGameUpcoming = (reg: UserRegistration): boolean => {
    if (!reg.gameDateISO) return true;

    const now = new Date();
    const todayISO = getTodayISO();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Future date: Keep
    if (reg.gameDateISO > todayISO) return true;

    // Past date: Hide
    if (reg.gameDateISO < todayISO) return false;

    // Today: Check time
    // Expected format "HH:mm" e.g. "14h00" or "14:00"
    if (reg.gameDateISO === todayISO && reg.gameTime) {
        // Parse time, handling 'h' or ':' separator
        const [hStr, mStr] = reg.gameTime.split(/[h:]/);
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr || '0', 10);

        if (!isNaN(h)) {
            // Match duration approx 3 hours (match + warm up + post match).
            // If match starts at 14:00, we consider it "upcoming/active" until 17:00 approx.
            // Adjust this logic as needed. The user complained about 14h match visible at 21h.

            const endHour = h + 3;

            // If current time is past the end timestamp
            if (currentHours > endHour) return false;
            if (currentHours === endHour && currentMinutes > m) return false;
        }
    }

    return true;
};
