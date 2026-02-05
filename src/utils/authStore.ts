import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
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
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
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
 * Sign up with email, password, and display name
 */
export const signUp = async (email: string, password: string, name: string): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update profile with the provided name
        await updateProfile(userCredential.user, {
            displayName: name
        });
        return userCredential.user;
    } catch (error: any) {
        const code = error?.code || '';
        const message = AUTH_ERRORS[code] || 'Erreur lors de l\'inscription.';
        throw new Error(message);
    }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        const code = error?.code || '';
        const message = AUTH_ERRORS[code] || 'Erreur de connexion Google. Veuillez réessayer.';
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
