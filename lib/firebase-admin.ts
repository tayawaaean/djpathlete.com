import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import { getFirestore } from "firebase-admin/firestore"

let app: App

function getAdminApp() {
  if (!app) {
    if (getApps().length) {
      app = getApps()[0]
    } else {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}"
      )
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    }
  }
  return app
}

export function getAdminStorage() {
  return getStorage(getAdminApp())
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp())
}

/**
 * Generate a signed URL for a Firebase Storage file.
 * Defaults to 1-hour expiry.
 */
export async function getSignedVideoUrl(
  videoPath: string,
  expiresInMs = 60 * 60 * 1000
): Promise<string> {
  const bucket = getAdminStorage().bucket()
  const file = bucket.file(videoPath)
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMs,
  })
  return url
}
