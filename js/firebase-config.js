/**
 * Firebase Configuration
 * 
 * This file contains the Firebase project credentials for the Risk Game multiplayer system.
 * 
 * SECURITY NOTES:
 * - API key is safe to expose in client-side code (it's not a secret)
 * - Database security is controlled by Firebase Realtime Database Rules
 * - Never commit service account keys or admin credentials to version control
 * 
 * Environment: Production
 * Region: europe-west1
 * Database: Realtime Database
 */

const firebaseConfig = {
    // Firebase project API key (public, used for client authentication)
    apiKey: "AIzaSyA_2AwluTygKIQDgo4S1UtwP5_lVrLWpNg",
    
    // Authentication domain for Firebase Auth (if needed later)
    authDomain: "risk-game-multiplayer.firebaseapp.com",
    
    // Realtime Database URL - all session data stored here
    databaseURL: "https://risk-game-multiplayer-default-rtdb.europe-west1.firebasedatabase.app",
    
    // Firebase project identifier
    projectId: "risk-game-multiplayer",
    
    // Cloud Storage bucket (for future file uploads if needed)
    storageBucket: "risk-game-multiplayer.firebasestorage.app",
    
    // Firebase Cloud Messaging sender ID (for push notifications if needed)
    messagingSenderId: "506421701739",
    
    // Unique app identifier
    appId: "1:506421701739:web:5d2f7cdc2b4cdbd4a1152e"
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
