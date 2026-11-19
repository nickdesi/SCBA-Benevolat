import { useCallback } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import type { Game, CarpoolEntry } from '../types';

/** Hook return type for better TypeScript inference */
interface UseCarpoolReturn {
  handleAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => Promise<void>;
  handleRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
  handleRequestSeat: (gameId: string, passengerId: string, driverId: string) => Promise<void>;
  handleAcceptPassenger: (gameId: string, driverId: string, passengerId: string) => Promise<void>;
  handleRejectPassenger: (gameId: string, driverId: string, passengerId: string) => Promise<void>;
  handleCancelRequest: (gameId: string, passengerId: string) => Promise<void>;
}

/** Utility: calculate remaining seats for a driver */
export const getRemainingSeats = (driver: CarpoolEntry, allEntries: CarpoolEntry[]): number => {
  const totalSeats = driver.seats || 1;
  // Count total seats requested by matched passengers
  let seatsUsed = 0;
  if (driver.matchedWith) {
    driver.matchedWith.forEach((passengerId) => {
      const passenger = allEntries.find((e) => e.id === passengerId);
      seatsUsed += passenger?.seats || 1;
    });
  }
  return Math.max(0, totalSeats - seatsUsed);
};

export const useCarpool = (): UseCarpoolReturn => {
  const handleAddCarpool = useCallback(
    async (gameId: string, entry: Omit<CarpoolEntry, 'id'>): Promise<void> => {
      const gameRef = doc(db, 'matches', gameId);
      try {
        await runTransaction(db, async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists()) {
            throw new Error(`Game with ID ${gameId} not found`);
          }
          const gameData = gameDoc.data() as Game;

          // New entries start as 'available' by default
          const newEntry: CarpoolEntry = {
            ...entry,
            id: crypto.randomUUID(),
            status: 'available',
            matchedWith: entry.type === 'driver' ? [] : undefined,
          };
          const updatedCarpool = [...(gameData.carpool || []), newEntry];

          transaction.update(gameRef, { carpool: updatedCarpool });
        });
      } catch (error) {
        console.error('[useCarpool] Failed to add carpool entry:', error);
        throw error;
      }
    },
    [],
  );

  const handleRemoveCarpool = useCallback(
    async (gameId: string, entryId: string): Promise<void> => {
      const gameRef = doc(db, 'matches', gameId);
      try {
        await runTransaction(db, async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists()) {
            throw new Error(`Game with ID ${gameId} not found`);
          }
          const gameData = gameDoc.data() as Game;
          const carpool = gameData.carpool || [];

          // Find the entry being removed
          const entryToRemove = carpool.find((e) => e.id === entryId);

          let updatedCarpool = carpool.filter((e) => e.id !== entryId);

          // If removing a driver, reset all passengers that were matched/pending with them
          if (entryToRemove?.type === 'driver') {
            updatedCarpool = updatedCarpool.map((e) => {
              if (e.type === 'passenger' && e.requestedDriverId === entryId) {
                const resetPassenger = {
                  ...e,
                  status: 'available' as const,
                };
                delete resetPassenger.requestedDriverId;
                delete resetPassenger.matchedWith;
                return resetPassenger;
              }
              return e;
            });
          }

          // If removing a passenger, update driver's matchedWith
          if (entryToRemove?.type === 'passenger' && entryToRemove.requestedDriverId) {
            updatedCarpool = updatedCarpool.map((e) => {
              if (e.id === entryToRemove.requestedDriverId && e.matchedWith) {
                return { ...e, matchedWith: e.matchedWith.filter((id) => id !== entryId) };
              }
              return e;
            });
          }

          transaction.update(gameRef, { carpool: updatedCarpool });
        });
      } catch (error) {
        console.error('[useCarpool] Failed to remove carpool entry:', error);
        throw error;
      }
    },
    [],
  );

  const handleRequestSeat = useCallback(
    async (gameId: string, passengerId: string, driverId: string): Promise<void> => {
      const gameRef = doc(db, 'matches', gameId);
      try {
        await runTransaction(db, async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists()) {
            throw new Error(`Game with ID ${gameId} not found`);
          }
          const gameData = gameDoc.data() as Game;
          const carpool = gameData.carpool || [];
          const driver = carpool.find((e) => e.id === driverId && e.type === 'driver');
          const passenger = carpool.find((e) => e.id === passengerId && e.type === 'passenger');

          if (!driver || !passenger) {
            throw new Error('Conducteur ou passager introuvable');
          }
          if (passenger.status && passenger.status !== 'available') {
            throw new Error('Cette demande est déjà en cours ou confirmée');
          }
          if (getRemainingSeats(driver, carpool) < (passenger.seats || 1)) {
            throw new Error('Plus assez de places disponibles');
          }

          const updatedCarpool = carpool.map((e) => {
            if (e.id === passengerId) {
              return { ...e, status: 'pending' as const, requestedDriverId: driverId };
            }
            return e;
          });

          transaction.update(gameRef, { carpool: updatedCarpool });
        });
      } catch (error) {
        console.error('[useCarpool] Failed to request seat:', error);
        throw error;
      }
    },
    [],
  );

  const handleAcceptPassenger = useCallback(
    async (gameId: string, driverId: string, passengerId: string): Promise<void> => {
      const gameRef = doc(db, 'matches', gameId);
      try {
        await runTransaction(db, async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists()) {
            throw new Error(`Game with ID ${gameId} not found`);
          }
          const gameData = gameDoc.data() as Game;
          const carpool = gameData.carpool || [];

          const driver = carpool.find((e) => e.id === driverId);
          const passenger = carpool.find((e) => e.id === passengerId);

          if (!driver || driver.type !== 'driver' || !passenger || passenger.type !== 'passenger') {
            throw new Error('Driver or passenger not found');
          }
          if (passenger.status !== 'pending' || passenger.requestedDriverId !== driverId) {
            throw new Error('La demande ne correspond pas à ce conducteur');
          }

          // Check if driver has enough remaining seats
          const remainingSeats = getRemainingSeats(driver, carpool);
          const passengerSeats = passenger.seats || 1;

          if (remainingSeats < passengerSeats) {
            throw new Error('Plus assez de places disponibles');
          }

          // Update both driver and passenger
          const updatedCarpool = carpool.map((e) => {
            if (e.id === driverId) {
              return {
                ...e,
                matchedWith: [...(e.matchedWith || []), passengerId],
              };
            }
            if (e.id === passengerId) {
              return {
                ...e,
                status: 'matched' as const,
                matchedWith: [driverId],
              };
            }
            return e;
          });

          transaction.update(gameRef, { carpool: updatedCarpool });
        });
      } catch (error) {
        console.error('[useCarpool] Failed to accept passenger:', error);
        throw error;
      }
    },
    [],
  );

  const handleRejectPassenger = useCallback(
    async (gameId: string, driverId: string, passengerId: string): Promise<void> => {
      const gameRef = doc(db, 'matches', gameId);
      try {
        await runTransaction(db, async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists()) {
            throw new Error(`Game with ID ${gameId} not found`);
          }
          const gameData = gameDoc.data() as Game;
          const carpool = gameData.carpool || [];
          const driver = carpool.find((entry) => entry.id === driverId && entry.type === 'driver');
          const passenger = carpool.find(
            (entry) => entry.id === passengerId && entry.type === 'passenger',
          );
          if (!driver || !passenger || passenger.requestedDriverId !== driverId) {
            throw new Error('Demande de covoiturage introuvable');
          }

          const updatedCarpool = carpool.map((e) => {
            if (e.id === passengerId) {
              const rejectedPassenger = {
                ...e,
                status: 'available' as const,
              };
              delete rejectedPassenger.requestedDriverId;
              return rejectedPassenger;
            }
            return e;
          });

          transaction.update(gameRef, { carpool: updatedCarpool });
        });
      } catch (error) {
        console.error('[useCarpool] Failed to reject passenger:', error);
        throw error;
      }
    },
    [],
  );

  const handleCancelRequest = useCallback(
    async (gameId: string, passengerId: string): Promise<void> => {
      const gameRef = doc(db, 'matches', gameId);
      try {
        await runTransaction(db, async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists()) {
            throw new Error(`Game with ID ${gameId} not found`);
          }
          const gameData = gameDoc.data() as Game;
          const carpool = gameData.carpool || [];
          const passenger = carpool.find(
            (entry) => entry.id === passengerId && entry.type === 'passenger',
          );
          if (!passenger || passenger.status !== 'pending') {
            throw new Error('Aucune demande en attente à annuler');
          }

          const updatedCarpool = carpool.map((e) => {
            if (e.id === passengerId) {
              const cancelledPassenger = {
                ...e,
                status: 'available' as const,
              };
              delete cancelledPassenger.requestedDriverId;
              return cancelledPassenger;
            }
            return e;
          });

          transaction.update(gameRef, { carpool: updatedCarpool });
        });
      } catch (error) {
        console.error('[useCarpool] Failed to cancel request:', error);
        throw error;
      }
    },
    [],
  );

  return {
    handleAddCarpool,
    handleRemoveCarpool,
    handleRequestSeat,
    handleAcceptPassenger,
    handleRejectPassenger,
    handleCancelRequest,
  };
};
