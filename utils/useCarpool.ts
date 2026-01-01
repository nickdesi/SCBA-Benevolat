import { useCallback } from 'react';
import {
    doc,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Game, CarpoolEntry } from '../types';

export const useCarpool = () => {
    const handleAddCarpool = useCallback(async (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => {
        const gameRef = doc(db, "matches", gameId);
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw "Game missing";
            const gameData = gameDoc.data() as Game;

            const newEntry: CarpoolEntry = { ...entry, id: crypto.randomUUID() };
            const updatedCarpool = [...(gameData.carpool || []), newEntry];

            transaction.update(gameRef, { carpool: updatedCarpool });
        });
    }, []);

    const handleRemoveCarpool = useCallback(async (gameId: string, entryId: string) => {
        const gameRef = doc(db, "matches", gameId);
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw "Game missing";
            const gameData = gameDoc.data() as Game;

            const updatedCarpool = (gameData.carpool || []).filter(e => e.id !== entryId);

            transaction.update(gameRef, { carpool: updatedCarpool });
        });
    }, []);

    return {
        handleAddCarpool,
        handleRemoveCarpool
    };
};
