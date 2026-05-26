import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  getDocFromServer,
  collection, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Track } from "../types";

// 1. Initialize Firebase App and Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

// 2. Validate connection to Firestore on initialization (Mandatory skill check)
export async function testFirestoreConnection() {
  try {
    // Attempt load to confirm online state
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration or network status.", error);
    }
  }
}
testFirestoreConnection();

// 3. Define OAuth Scopes requested by user
export const WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts"
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => {
  provider.addScope(scope);
});

// Cache the access token in memory (No storage, for high security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// 4. Custom compliant Error Handling conforms to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error("Firestore Permission/Quota Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 5. Authentication Listeners and actions
export const initAuthListener = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get google access token from credentials.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google/Firebase auth sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// 6. Firestore Database Operations with Error Catching

// Save or Update Track in Firestore
export async function syncTrackToCloud(track: Track, userId: string): Promise<void> {
  const trackPath = `tracks/${track.id}`;
  try {
    const trackRef = doc(db, "tracks", track.id);
    const trackDoc = await getDoc(trackRef);

    const payload = {
      id: track.id,
      title: track.title,
      bpm: Number(track.bpm),
      rhythmStyle: track.rhythmStyle,
      vocalStyle: track.vocalStyle,
      vocalStyleCategory: track.vocalStyleCategory,
      vibeTags: track.vibeTags || [],
      introductionBeat: track.introductionBeat || "",
      creator: userId,
      createdAt: trackDoc.exists() ? trackDoc.data()?.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      lines: track.lines.map(line => ({
        section: line.section,
        text: line.text,
        pronunciation: line.pronunciation,
        vocalEffect: line.vocalEffect,
        durationSeconds: Number(line.durationSeconds)
      }))
    };

    await setDoc(trackRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, trackPath);
  }
}

// Fetch all tracks from Cloud Firestore
export async function fetchCloudTracks(): Promise<Track[]> {
  const collectionPath = "tracks";
  try {
    const tracksQuery = query(collection(db, "tracks"), orderBy("createdAt", "desc"), limit(40));
    const snapshot = await getDocs(tracksQuery);
    const result: Track[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      result.push({
        id: docSnap.id,
        title: data.title || "أغنية شعبية بدون عنوان",
        bpm: data.bpm || 120,
        rhythmStyle: data.rhythmStyle || "",
        vocalStyle: data.vocalStyle || "",
        vocalStyleCategory: data.vocalStyleCategory || "Mahraganat",
        vibeTags: data.vibeTags || [],
        introductionBeat: data.introductionBeat || "",
        creator: data.creator || "مجهول",
        lines: data.lines || []
      });
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

// Ensure User Profile setup on Login
export async function ensureUserProfile(user: User): Promise<{ username: string; favorites: string[] }> {
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        username: data.username || user.displayName || "فنان ستاموني",
        favorites: data.favorites || []
      };
    } else {
      const username = user.displayName || user.email?.split("@")[0] || "فنان شعبى";
      const initialProfile = {
        username: username,
        email: user.email || "",
        favorites: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userRef, initialProfile);
      return {
        username,
        favorites: []
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

// Toggle Favorite Song status in Firestore user database
export async function toggleCloudFavorite(userId: string, trackId: string, isFavorited: boolean): Promise<string[]> {
  const userPath = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    if (isFavorited) {
      await updateDoc(userRef, {
        favorites: arrayRemove(trackId),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, {
        favorites: arrayUnion(trackId),
        updatedAt: serverTimestamp()
      });
    }
    const updatedSnap = await getDoc(userRef);
    return updatedSnap.data()?.favorites || [];
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}
