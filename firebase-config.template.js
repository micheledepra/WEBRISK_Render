/**
 * 🔥 Firebase Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Create a new project (or select existing)
 * 3. Add a Web App to your project
 * 4. Copy the firebaseConfig object from Firebase Console
 * 5. Replace the placeholder values below with your actual Firebase config
 * 6. Rename this file to: firebase-config.js
 * 7. Import this file in your HTML pages
 * 
 * SECURITY NOTE:
 * - These values are safe to expose in client-side code
 * - Real security is handled by Firebase Security Rules
 * - See Firebase Console -> Realtime Database -> Rules tab
 */

// TODO: Replace these values with your actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Example of what your config should look like:
/*
const firebaseConfig = {
    apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "risk-multiplayer-12345.firebaseapp.com",
    databaseURL: "https://risk-multiplayer-12345-default-rtdb.firebaseio.com",
    projectId: "risk-multiplayer-12345",
    storageBucket: "risk-multiplayer-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
*/

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
}
