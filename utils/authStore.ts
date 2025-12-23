import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from '../firebase';

// Error messages in French
const AUTH_ERRORS: Record<string, string> = {
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte associé à cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        const code = error?.code || '';
        const message = AUTH_ERRORS[code] || 'Erreur de connexion. Veuillez réessayer.';
        throw new Error(message);
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    return firebaseOnAuthStateChanged(auth, callback);
};
