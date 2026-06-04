import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRPLoFws3I_JoagIKpdj28JSX4hw_DvUk",
  authDomain: "fasilitas-tmr.firebaseapp.com",
  projectId: "fasilitas-tmr",
  storageBucket: "fasilitas-tmr.firebasestorage.app",
  messagingSenderId: "905355425334",
  appId: "1:905355425334:web:71aa3289c7cb54e1a60a97"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
storage.maxUploadRetryTime = 5000; // 5 seconds max retry to avoid infinite hang
storage.maxOperationRetryTime = 5000;
