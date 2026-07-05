import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

// Error messages in French
const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte associé à cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-verification-code': 'Code de vérification invalide.',
  'auth/invalid-verification-id': 'Identifiant de vérification invalide.',
  'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
  'auth/credential-already-in-use': 'Ce compte est déjà utilisé.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/operation-not-allowed': 'Cette méthode de connexion est désactivée.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
  'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  'auth/missing-email': 'Veuillez renseigner une adresse email.',
  'auth/missing-password': 'Veuillez renseigner un mot de passe.',
  'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée.',
  'auth/popup-blocked': 'La fenêtre pop-up a été bloquée par le navigateur.',
  'auth/cancelled-popup-request': 'La connexion a été annulée.',
  'auth/unauthorized-domain': "Ce domaine n'est pas autorisé pour la connexion.",
  'auth/operation-not-supported-in-this-environment':
    'Opération non supportée dans cet environnement.',
  'auth/account-exists-with-different-credential':
    'Un compte existe déjà avec cet email via une autre méthode de connexion.',
  'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
  'auth/expired-action-code': 'Le lien a expiré. Demandez un nouveau lien.',
  'auth/invalid-action-code': 'Le lien est invalide ou a déjà été utilisé.',
  'auth/internal-error': 'Une erreur interne est survenue. Réessayez plus tard.',
  'auth/quota-exceeded': 'Quota dépassé. Réessayez plus tard.',
  'auth/app-deleted': "L'application a été supprimée.",
  'auth/app-not-authorized': "L'application n'est pas autorisée à se connecter.",
  'auth/argument-error': 'Argument invalide.',
  'auth/invalid-phone-number': 'Numéro de téléphone invalide.',
  'auth/no-auth-event': 'Événement de connexion introuvable.',
  'auth/no-such-provider': "Ce fournisseur de connexion n'existe pas.",
  'auth/null-user': 'Aucun utilisateur connecté.',
  'auth/session-expired': 'La session a expiré. Reconnectez-vous.',
  'auth/timeout': 'La connexion a expiré. Réessayez.',
  'auth/user-token-expired': 'Votre session a expiré. Reconnectez-vous.',
  'auth/user-token-revoked': 'Votre session a été révoquée. Reconnectez-vous.',
  'auth/web-storage-unsupported': "Le stockage web n'est pas supporté par ce navigateur.",
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
    throw new Error(message, { cause: error });
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
      displayName: name,
    });
    return userCredential.user;
  } catch (error: any) {
    const code = error?.code || '';
    const message = AUTH_ERRORS[code] || "Erreur lors de l'inscription.";
    throw new Error(message, { cause: error });
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
    console.error('Google Sign-In Error:', error);
    const code = error?.code || '';
    const message = AUTH_ERRORS[code] || 'Erreur de connexion Google. Veuillez réessayer.';
    throw new Error(message, { cause: error });
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

/**
 * Send password reset email
 */
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    auth.languageCode = 'fr';
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    const code = error?.code || '';
    const message = AUTH_ERRORS[code] || 'Erreur lors de la réinitialisation du mot de passe.';
    throw new Error(message, { cause: error });
  }
};
