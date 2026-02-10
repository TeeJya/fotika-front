import { initializeApp } from 'firebase/app'
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
}

const app = initializeApp(firebaseConfig as any)
// initialize analytics if available (no-op in non-browser or if not configured)
try {
  if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) getAnalytics(app)
} catch (e) {
  // analytics may fail in some environments (SSR/test); ignore
}
export const auth = getAuth(app)
export const db = getFirestore(app)

export function sendMagicLink(email: string) {
  const actionCodeSettings = {
    url: `${window.location.origin}/#/auth`,
    handleCodeInApp: true
  }
  window.localStorage.setItem('fotika:email', email)
  return sendSignInLinkToEmail(auth, email, actionCodeSettings)
}

export async function finishSignIn(email?: string) {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null
  const stored = email || window.localStorage.getItem('fotika:email') || ''
  if (!stored) throw new Error('email-required')
  const result = await signInWithEmailLink(auth, stored, window.location.href)
  const idToken = await result.user.getIdToken()
  const uid = result.user.uid
  window.localStorage.setItem('fotika:idToken', idToken)
  window.localStorage.setItem('fotika:uid', uid)
  window.localStorage.removeItem('fotika:email')
  return { uid, idToken }
}

export async function getFreshIdToken() {
  if (auth.currentUser) {
    // true forces a refresh if expired
    const token = await auth.currentUser.getIdToken(false)
    window.localStorage.setItem('fotika:idToken', token)
    return token
  }
  return window.localStorage.getItem('fotika:idToken') || null
}

export function getIdToken() {
  return window.localStorage.getItem('fotika:idToken') || null
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  // Request full drive access to allow sharing folders publicly
  provider.addScope('https://www.googleapis.com/auth/drive')
  // Force consent prompt to ensure new scopes are granted
  provider.setCustomParameters({ prompt: 'consent' })
  
  const result = await signInWithPopup(auth, provider)
  
  // This gives you a Google Access Token. You can use it to access the Google API.
  const credential = GoogleAuthProvider.credentialFromResult(result)
  const accessToken = credential?.accessToken

  const idToken = await result.user.getIdToken()
  const uid = result.user.uid
  
  window.localStorage.setItem('fotika:idToken', idToken)
  window.localStorage.setItem('fotika:uid', uid)
  if (accessToken) {
    window.localStorage.setItem('fotika:googleAccessToken', accessToken)
  }
  
  return { uid, idToken, accessToken }
}

export async function signOutUser() {
  await auth.signOut()
  window.localStorage.removeItem('fotika:idToken')
  window.localStorage.removeItem('fotika:uid')
  window.localStorage.removeItem('fotika:email')
}

