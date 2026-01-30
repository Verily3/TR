// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const env = {
  // API
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",

  // Firebase
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  },

  // App
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Transformation OS",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173",
} as const;
