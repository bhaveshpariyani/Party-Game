import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAhH3FeQ3z7bwflGX130Lv6PCDtrKVG1Gw",
    authDomain: "the-game-app-9e46a.firebaseapp.com",
    projectId: "the-game-app-9e46a",
    storageBucket: "the-game-app-9e46a.firebasestorage.app",
    messagingSenderId: "311582864830",
    appId: "1:311582864830:web:3a55826df416990db2f5ef",
    measurementId: "G-H08F2DWV6E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth, analytics };
