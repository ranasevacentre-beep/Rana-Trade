import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * 📢 यहाँ अपनी Firebase Config पेस्ट करें। 
 * यह आपको Firebase Console > Project Settings > 'Your Apps' सेक्शन में मिलेगी।
 */
const firebaseConfig = {
  apiKey: "Paste_API_Key_Here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);