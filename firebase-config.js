import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdB5SZ9Xi6MVZl-DsmTgWjJPK5EId-4F8",
  authDomain: "dized-box.firebaseapp.com",
  projectId: "dized-box",
  storageBucket: "dized-box.firebasestorage.app",
  messagingSenderId: "163199308320",
  appId: "1:163199308320:web:7e8217dabae7668d016245",
  measurementId: "G-Q9GFSXFZG8"
};

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase initialization error:", e);
}

export { app, db, auth };
