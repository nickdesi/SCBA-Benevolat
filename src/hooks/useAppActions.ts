import { useCallback } from 'react';
import { useToast } from '../components/Toast';
import type { Game, GameFormData, CarpoolEntry } from '../types';

interface UseAppActionsProps {
    isAuthenticated: boolean;
    setIsAuthModalOpen: (open: boolean) => void;
    addGame: (data: GameFormData) => Promise<void>;
    updateGame: (game: Game) => Promise<void>;
    deleteGame: (id: string) => Promise<boolean>;
    importGames: (data: GameFormData[]) => Promise<void>;
    handleVolunteer: (gameId: string, roleId: string, name: string | string[]) => Promise<void>;
    handleRemoveVolunteer: (gameId: string, roleId: string, name: string) => Promise<void>;
    handleUpdateVolunteer: (gameId: string, roleId: string, old: string, next: string) => Promise<void>;
    handleAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => Promise<void>;
    handleRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    handleRequestSeat: (gameId: string, pId: string, dId: string) => Promise<void>;
    handleAcceptPassenger: (gameId: string, dId: string, pId: string) => Promise<void>;
    handleRejectPassenger: (gameId: string, dId: string, pId: string) => Promise<void>;
    handleCancelRequest: (gameId: string, pId: string) => Promise<void>;
}

export const useAppActions = (props: UseAppActionsProps) => {
    const { addToast } = useToast();
    const {
        isAuthenticated,
        setIsAuthModalOpen,
        addGame,
        updateGame,
        deleteGame,
        importGames,
        handleVolunteer,
        handleRemoveVolunteer,
        handleUpdateVolunteer,
        handleAddCarpool,
        handleRequestSeat,
        handleAcceptPassenger,
        handleRejectPassenger,
        handleCancelRequest
    } = props;

    const addGameWithToast = useCallback(async (data: GameFormData) => {
        try {
            await addGame(data);
            return true;
        } catch (err) {
            console.error("Add error:", err);
            addToast("Erreur lors de l'ajout", 'error');
            return false;
        }
    }, [addGame, addToast]);

    const updateGameWithToast = useCallback(async (game: Game) => {
        try {
            await updateGame(game);
            return true;
        } catch (err) {
            console.error("Update error:", err);
            addToast("Erreur lors de la modification", 'error');
            return false;
        }
    }, [updateGame, addToast]);

    const deleteGameWithToast = useCallback(async (id: string) => {
        try {
            await deleteGame(id);
            return true;
        } catch (err) {
            console.error("Delete error:", err);
            addToast("Erreur lors de la suppression", 'error');
            return false;
        }
    }, [deleteGame, addToast]);

    const importCSVWithToast = useCallback(async (data: GameFormData[]) => {
        try {
            await importGames(data);
            addToast(`${data.length} match(s) importé(s) !`, 'success');
            return true;
        } catch (err) {
            console.error("Import error:", err);
            addToast("Erreur lors de l'import", 'error');
            return false;
        }
    }, [importGames, addToast]);

    const volunteerWithToast = useCallback(async (gameId: string, roleId: string, name: string | string[]) => {
        if (!isAuthenticated) {
            addToast('Connectez-vous pour vous inscrire', 'info');
            setTimeout(() => setIsAuthModalOpen(true), 400);
            return;
        }
        try {
            await handleVolunteer(gameId, roleId, name);
            addToast('Inscription confirmée !', 'success');
        } catch (err) {
            addToast("Erreur lors de l'inscription", 'error');
        }
    }, [handleVolunteer, addToast, isAuthenticated, setIsAuthModalOpen]);

    const removeVolunteerWithToast = useCallback(async (gameId: string, roleId: string, name: string) => {
        try {
            await handleRemoveVolunteer(gameId, roleId, name);
        } catch (err) {
            addToast("Erreur lors de la désinscription", 'error');
        }
    }, [handleRemoveVolunteer, addToast]);

    const updateVolunteerWithToast = useCallback(async (gameId: string, roleId: string, old: string, next: string) => {
        try {
            await handleUpdateVolunteer(gameId, roleId, old, next);
            addToast('Nom modifié', 'success');
        } catch (err) {
            addToast("Erreur lors de la modification", 'error');
        }
    }, [handleUpdateVolunteer, addToast]);

    const addCarpoolWithToast = useCallback(async (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => {
        if (!isAuthenticated) {
            addToast('Connectez-vous pour le covoiturage', 'info');
            setTimeout(() => setIsAuthModalOpen(true), 400);
            return;
        }
        try {
            await handleAddCarpool(gameId, entry);
            addToast('🚗 Inscription covoiturage !', 'success');
        } catch (err) {
            addToast("Erreur covoiturage", 'error');
        }
    }, [handleAddCarpool, addToast, isAuthenticated, setIsAuthModalOpen]);

    return {
        addGameWithToast,
        updateGameWithToast,
        deleteGameWithToast,
        importCSVWithToast,
        volunteerWithToast,
        removeVolunteerWithToast,
        updateVolunteerWithToast,
        addCarpoolWithToast,
        requestSeatWithToast: async (gId: string, pId: string, dId: string) => {
            try { await handleRequestSeat(gId, pId, dId); addToast('✨ Demande envoyée !', 'success'); }
            catch { addToast("Erreur demande", 'error'); }
        },
        acceptPassengerWithToast: async (gId: string, dId: string, pId: string) => {
            try { await handleAcceptPassenger(gId, dId, pId); addToast('✅ Passager accepté !', 'success'); }
            catch (err: any) { addToast(err.message || "Erreur acceptation", 'error'); }
        },
        rejectPassengerWithToast: async (gId: string, dId: string, pId: string) => {
            try { await handleRejectPassenger(gId, dId, pId); addToast('Demande refusée', 'info'); }
            catch { addToast("Erreur refus", 'error'); }
        },
        cancelRequestWithToast: async (gId: string, pId: string) => {
            try { await handleCancelRequest(gId, pId); addToast('Demande annulée', 'info'); }
            catch { addToast("Erreur annulation", 'error'); }
        }
    };
};
