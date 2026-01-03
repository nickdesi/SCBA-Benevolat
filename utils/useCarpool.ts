import { useCallback } from 'react';
import {
    doc,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Game, CarpoolEntry } from '../types';

/** Hook return type for better TypeScript inference */
interface UseCarpoolReturn {
    handleAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => Promise<void>;
    handleRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
}

export const useCarpool = (): UseCarpoolReturn => {
    const handleAddCarpool = useCallback(async (gameId: string, entry: Omit<CarpoolEntry, 'id'>): Promise<void> => {
        const gameRef = doc(db, "matches", gameId);
        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) {
                    throw new Error(`Game with ID ${gameId} not found`);
                }
                const gameData = gameDoc.data() as Game;

                const newEntry: CarpoolEntry = { ...entry, id: crypto.randomUUID() };
                const updatedCarpool = [...(gameData.carpool || []), newEntry];

                transaction.update(gameRef, { carpool: updatedCarpool });
            });
        } catch (error) {
            console.error('[useCarpool] Failed to add carpool entry:', error);
            throw error;
        }
    }, []);

    const handleRemoveCarpool = useCallback(async (gameId: string, entryId: string): Promise<void> => {
        const gameRef = doc(db, "matches", gameId);
        try {
            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) {
                    throw new Error(`Game with ID ${gameId} not found`);
                }
                const gameData = gameDoc.data() as Game;

                const updatedCarpool = (gameData.carpool || []).filter(e => e.id !== entryId);

                transaction.update(gameRef, { carpool: updatedCarpool });
            });
        } catch (error) {
            console.error('[useCarpool] Failed to remove carpool entry:', error);
            throw error;
        }
    }, []);

    return {
        handleAddCarpool,
        handleRemoveCarpool
    };
};
