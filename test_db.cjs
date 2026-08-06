const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Since we are running outside GCP, we might not have credentials for admin SDK
// BUT wait, in the dev container, sometimes admin SDK works if GOOGLE_APPLICATION_CREDENTIALS is set
// or if we use the default service account? 
// No, earlier we got PERMISSION_DENIED.
