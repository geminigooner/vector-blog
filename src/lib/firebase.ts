import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0376397936",
  appId: "1:477131639733:web:70e07f3e4cb647e364a7fc",
  apiKey: "AIzaSyC4R3mGscx0P77zlLmNf_2wkkxH7UvwdAs",
  authDomain: "gen-lang-client-0376397936.firebaseapp.com",
  storageBucket: "gen-lang-client-0376397936.firebasestorage.app",
  messagingSenderId: "477131639733",
  measurementId: "",
  firestoreDatabaseId: "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9",
};

export const app = initializeApp(firebaseConfig, "LatentAffairsV3");
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const OWNER_EMAIL = "ahatley094@gmail.com";
