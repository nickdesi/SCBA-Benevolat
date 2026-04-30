import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface UserProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    email?: string;
}

/**
 * Redimensionne une image en 128×128 (center-crop) et retourne un data URI JPEG base64.
 * Résultat ~10-20 KB — compatible Firestore (limite 1 MB/document).
 */
const resizeImageToBase64 = (file: File, size = 128): Promise<string> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas non supporté')); return; }
            // Center-crop carré
            const min = Math.min(img.width, img.height);
            const sx = (img.width - min) / 2;
            const sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Impossible de charger l\'image')); };
        img.src = url;
    });

/**
 * Redimensionne l'avatar et le stocke en base64 dans Firestore (sans Firebase Storage).
 * Retourne le data URI pour affichage immédiat.
 */
export const saveAvatarToFirestore = async (file: File, uid: string, displayName?: string): Promise<string> => {
    const dataUri = await resizeImageToBase64(file);
    const userRef = doc(db, 'users', uid);
    // setDoc avec merge: crée le document s'il n'existe pas, et garantit que displayName
    // est présent pour que useAvatars puisse construire le mapping displayName→photoURL
    const update: Record<string, string> = { photoURL: dataUri };
    if (displayName) update.displayName = displayName;
    await setDoc(userRef, update, { merge: true });
    return dataUri;
};


