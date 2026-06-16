import { useMemo } from 'react';
import type { Game } from '../types';
import { getStoredName } from './storage';

/**
 * Represents a user's carpool participation for display in the dashboard
 */
export interface UserCarpoolRegistration {
  id: string; // CarpoolEntry ID
  gameId: string;
  gameDateISO: string;
  gameDate: string; // Display format
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
const isCarpoolUpcoming = (
  gameDateISO: string,
  gameTime: string | undefined,
  todayISO: string,
  currentHours: number,
  currentMinutes: number
): boolean => {
  if (!gameDateISO) return true;

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
  options: UseCarpoolRegistrationsOptions,
): UseCarpoolRegistrationsReturn => {
  const { games } = options;
  const storedName = getStoredName();

  const userCarpools = useMemo(() => {
    if (!storedName) return [];

    const registrations: UserCarpoolRegistration[] = [];
    // ⚡ Bolt Optimization: Hoist toLowerCase() outside the loop to avoid O(N) redundant string normalizations
    const normalizedStoredName = storedName.toLowerCase();

    games.forEach((game) => {
      if (!game.carpool || game.carpool.length === 0) return;

      const userEntry = game.carpool.find((e) => e.name.toLowerCase() === normalizedStoredName);

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
        // ⚡ Bolt Optimization: Use inline loop instead of .filter().length to prevent intermediate array creation
        let pendingCount = 0;
        for (let i = 0; i < game.carpool.length; i++) {
          const e = game.carpool[i];
          if (
            e.type === 'passenger' &&
            e.status === 'pending' &&
            e.requestedDriverId === userEntry.id
          ) {
            pendingCount++;
          }
        }
        registration.pendingRequestsCount = pendingCount;
      }

      // Add passenger-specific info
      if (
        userEntry.type === 'passenger' &&
        userEntry.status === 'matched' &&
        userEntry.matchedWith?.[0]
      ) {
        const driver = game.carpool.find((e) => e.id === userEntry.matchedWith?.[0]);
        if (driver) {
          registration.matchedDriverName = driver.name;
          registration.matchedDriverPhone = driver.phone;
        }
      }

      registrations.push(registration);
    });

    // Sort by date
    return registrations.sort((a, b) => (a.gameDateISO || '').localeCompare(b.gameDateISO || ''));
  }, [games, storedName]);

  // Filter upcoming carpools
  const upcomingCarpools = useMemo(() => {
    // ⚡ Bolt Optimization: Hoist Date instantiation out of O(N) filter traversal
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    return userCarpools.filter((c) =>
      isCarpoolUpcoming(c.gameDateISO, c.gameTime, todayISO, currentHours, currentMinutes)
    );
  }, [userCarpools]);

  // Get next carpool
  const nextCarpool = upcomingCarpools[0];

  // Calculate stats
  const stats = useMemo(() => {
    // ⚡ Bolt Optimization: Combine multiple .filter().length passes into a single O(N) iteration
    let driverCount = 0;
    let passengerCount = 0;

    for (let i = 0; i < userCarpools.length; i++) {
      if (userCarpools[i].type === 'driver') {
        driverCount++;
      } else if (userCarpools[i].type === 'passenger') {
        passengerCount++;
      }
    }

    return {
      totalCarpools: userCarpools.length,
      asDriver: driverCount,
      asPassenger: passengerCount,
    };
  }, [userCarpools]);

  return {
    userCarpools,
    upcomingCarpools,
    nextCarpool,
    stats,
  };
};
