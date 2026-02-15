import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { User } from "firebase/auth";

export interface UserProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    email?: string;
}

/**
 * Creates or updates a user profile in Firestore
 */
export const syncUserProfile = async (user: User) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const userData: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || "Bénévole",
        email: user.email || "",
        photoURL: user.photoURL || ""
    };

    if (!userSnap.exists()) {
        await setDoc(userRef, userData);
    } else {
        // Update only if changed to avoid unnecessary writes, 
        // but for now simple merge is fine
        await setDoc(userRef, userData, { merge: true });
    }
};

/**
 * Uploads an avatar image to Firebase Storage and returns the download URL
 */
export const uploadAvatar = async (file: File, uid: string): Promise<string> => {
    // strict path: avatars/{uid}/avatar.jpg (or png)
    // We overwrite the previous one to save space
    const storageRef = ref(storage, `avatars/${uid}/profile_pic`);

    // Upload
    await uploadBytes(storageRef, file);

    // Get URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

/**
 * Updates the user's avatar in Auth and Firestore
 */
export const updateUserAvatar = async (user: User, photoURL: string) => {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { photoURL });
};
