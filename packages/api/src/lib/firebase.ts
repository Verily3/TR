import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { env } from "./env";

let app: App;
let auth: Auth;

export function initializeFirebase(): void {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    // In production, use service account credentials
    // In development, can use application default credentials
    if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      // Use application default credentials (for local dev with gcloud auth)
      app = initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });
    }
  }

  auth = getAuth(app);
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return auth;
}
