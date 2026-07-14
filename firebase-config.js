// firebase-config.js
// Initialize Firebase using the compat libraries to avoid CORS issues on file:/// protocol

const firebaseConfig = {
    apiKey: "AIzaSyDmV8kDK7YZk-lxPwwDG2drrjybylwenWE",
    authDomain: "fci-lms.firebaseapp.com",
    projectId: "fci-lms",
    storageBucket: "fci-lms.firebasestorage.app",
    messagingSenderId: "180801083177",
    appId: "1:180801083177:web:2a56c4a8b096f993420938",
    measurementId: "G-9R91N0CDCG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
