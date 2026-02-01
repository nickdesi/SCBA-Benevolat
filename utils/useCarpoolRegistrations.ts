import { useMemo } from 'react';
import type { Game, CarpoolEntry } from '../types';
import { getStoredName } from './storage';

/**
 * Represents a user's carpool participation for display in the dashboard
 */
export interface UserCarpoolRegistration {
    id: string;           // CarpoolEntry ID
    gameId: string;
    gameDateISO: string;
    gameDate: string;     // Display format
    gameTime: string;
    team: string;
    opponent: string;
    location: string;
    type: 'driver' | 'passenger';
    status: 'available' | 'pending' | 'matched';
    seats?: number;
    departureLocation?: string;
    // For passengers: matched driver info
    matchedDriverName?: string;
    matchedDriverPhone?: string;
    // For drivers: matched passengers count
    matchedPassengersCount?: number;
    pendingRequestsCount?: number;
}

interface UseCarpoolRegistrationsOptions {
    games: Game[];
}

interface UseCarpoolRegistrationsReturn {
    userCarpools: UserCarpoolRegistration[];
    upcomingCarpools: UserCarpoolRegistration[];
    nextCarpool: UserCarpoolRegistration | undefined;
    stats: {
        totalCarpools: number;
        asDriver: number;
        asPassenger: number;
    };
}

/**
 * Check if a carpool registration is for an upcoming game
 */
const isCarpoolUpcoming = (gameDateISO: string, gameTime?: string): boolean => {
    if (!gameDateISO) return true;

    const now = new Date();
    const todayISO = now.toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    if (gameDateISO > todayISO) return true;
    if (gameDateISO < todayISO) return false;

    // Today: check time
    if (gameDateISO === todayISO && gameTime) {
        const [hStr, mStr] = gameTime.split(/[h:]/);
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr || '0', 10);

        if (!isNaN(h)) {
            const endHour = h + 3;
            if (currentHours > endHour) return false;
            if (currentHours === endHour && currentMinutes > m) return false;
        }
    }

    return true;
};

/**
 * Hook to extract and format user's carpool participations from games
 * Uses the stored name to identify user entries (consistent with CarpoolingSection)
 */
export const useCarpoolRegistrations = (
    options: UseCarpoolRegistrationsOptions
): UseCarpoolRegistrationsReturn => {
    const { games } = options;
    const storedName = getStoredName();

    const userCarpools = useMemo(() => {
        if (!storedName) return [];

        const registrations: UserCarpoolRegistration[] = [];

        games.forEach(game => {
            if (!game.carpool || game.carpool.length === 0) return;

            const userEntry = game.carpool.find(
                e => e.name.toLowerCase() === storedName.toLowerCase()
            );

            if (!userEntry) return;

            // Build the registration object
            const registration: UserCarpoolRegistration = {
                id: userEntry.id,
                gameId: game.id,
                gameDateISO: game.dateISO,
                gameDate: game.date,
                gameTime: game.time,
                team: game.team,
                opponent: game.opponent,
                location: game.location,
                type: userEntry.type,
                status: userEntry.status || 'available',
                seats: userEntry.seats,
                departureLocation: userEntry.departureLocation,
            };

            // Add driver-specific info
            if (userEntry.type === 'driver') {
                registration.matchedPassengersCount = userEntry.matchedWith?.length || 0;
                // Count pending requests
                const pendingRequests = game.carpool.filter(
                    e => e.type === 'passenger' &&
                        e.status === 'pending' &&
                        e.requestedDriverId === userEntry.id
                );
                registration.pendingRequestsCount = pendingRequests.length;
            }

            // Add passenger-specific info
            if (userEntry.type === 'passenger' && userEntry.status === 'matched' && userEntry.matchedWith?.[0]) {
                const driver = game.carpool.find(e => e.id === userEntry.matchedWith?.[0]);
                if (driver) {
                    registration.matchedDriverName = driver.name;
                    registration.matchedDriverPhone = driver.phone;
                }
            }

            registrations.push(registration);
        });

        // Sort by date
        return registrations.sort((a, b) =>
            (a.gameDateISO || '').localeCompare(b.gameDateISO || '')
        );
    }, [games, storedName]);

    // Filter upcoming carpools
    const upcomingCarpools = useMemo(() => {
        return userCarpools.filter(c => isCarpoolUpcoming(c.gameDateISO, c.gameTime));
    }, [userCarpools]);

    // Get next carpool
    const nextCarpool = upcomingCarpools[0];

    // Calculate stats
    const stats = useMemo(() => ({
        totalCarpools: userCarpools.length,
        asDriver: userCarpools.filter(c => c.type === 'driver').length,
        asPassenger: userCarpools.filter(c => c.type === 'passenger').length,
    }), [userCarpools]);

    return {
        userCarpools,
        upcomingCarpools,
        nextCarpool,
        stats,
    };
};
