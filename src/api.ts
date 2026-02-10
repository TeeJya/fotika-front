import { db } from './firebase'
import { collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'

// Generate a random slug
const nanoid = () => Math.random().toString(36).substring(2, 8)
// Admin/Site Manager Check
export async function isSiteManager(uid: string) {
  try {
    // 1. Check strict Firestore collection
    const docRef = doc(db, 'site_managers', uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) return true
    // 2. Fallback: Check 'users' collection for role='admin'
    // This is often easier to manage in early dev
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    return userSnap.exists() && userSnap.data().role === 'admin'
  } catch (err) {
    console.error('Error checking site manager status:', err)
    return false
  }
}

// User Settings
export async function getUserSettings(userId: string) {
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (err) {
    console.error('Error fetching user settings:', err)
    return null
  }
}

export async function getAllUsers() {
  try {
     const q = query(collection(db, 'users'))
     const snap = await getDocs(q)
     return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
  } catch(e) {
     console.error('List users failed', e)
     return []
  }
}

export async function updateUserSettings(userId: string, data: any) {
  try {
    const docRef = doc(db, 'users', userId)
    await setDoc(docRef, data, { merge: true })
    return { ok: true }
  } catch (err: any) {
    console.error('Error saving settings:', err)
    return { ok: false, error: err.message }
  }
}

// Events
export async function getUserEvents(userId: string) {
  try {
    // Note: This requires a Firestore index on userId. 
    // If it fails initially, check console for index creation link.
    const q = query(collection(db, 'events'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err: any) {
    console.error('Error getting user events:', err)
    return []
  }
}

export async function deleteEvent(eventId: string) {
  try {
    await deleteDoc(doc(db, 'events', eventId))
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export async function createEvent(payload: any) {
  try {
    const slug = (payload.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + nanoid()
    
    // Save to Firestore directly from frontend
    const docRef = await addDoc(collection(db, 'events'), {
      ...payload,
      slug,
      createdAt: new Date().toISOString()
    })

    return { ok: true, event: { id: docRef.id, slug, ...payload } }
  } catch (err: any) {
    console.error(err)
    return { ok: false, error: err.message || 'Firestore write failed' }
  }
}

export async function fetchEvent(slug: string) {
  try {
    const q = query(collection(db, 'events'), where('slug', '==', slug))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return { error: 'not found' }
    }

    const doc = querySnapshot.docs[0]
    const event = { id: doc.id, ...doc.data() }
    
    // 1. Try to get images from Firestore document first (Snapshot approach)
    let images: any[] = (event as any).images || []

    // 2. If no images in DB, try to fetch from Drive (Legacy/Dynamic approach)
    if (images.length === 0 && (event as any).driveFolderId) {
      const token = window.localStorage.getItem('fotika:googleAccessToken')
      try {
        images = await getDriveFiles((event as any).driveFolderId, token)
      } catch (e) {
        console.warn('Failed to fetch images from Drive', e)
      }
    }

    let channelId = ''
    if ((event as any).userId) {
       const userSettings = await getUserSettings((event as any).userId)
       if (userSettings) channelId = userSettings.channelId
    }

    return { event, images, channelId }
  } catch (err: any) {
    console.error(err)
    return { error: err.message }
  }
}

export async function getDriveFiles(folderId: string, token: string | null) {
  const q = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`
  const params: any = {
    q,
    fields: 'files(id, name, mimeType, thumbnailLink, webContentLink)',
    orderBy: 'name',
    pageSize: '100'
  }
  
  // If no token, assume public folder and try using API Key
  if (!token) {
    params.key = import.meta.env.VITE_FIREBASE_API_KEY
  }

  const headers: any = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${qs}`, { headers })
  
  if (!res.ok) {
     const text = await res.text()
     throw new Error(`Drive fetch failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.files || []
}

export async function setFolderPublic(token: string, folderId: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const message = errorData.error?.message || res.statusText
    // Pass strictly the Google API error reason if available for better handling
    const reason = errorData.error?.errors?.[0]?.reason || 'unknown'
    throw new Error(JSON.stringify({ message, reason, status: res.status }))
  }
  return res.json()
}

export function driveConnectUrl(userId: string) {
  return '#'
}

// SwiftWallet Integration (via backend proxy)
const PAYMENT_API_BASE = import.meta.env.VITE_PAYMENT_API_BASE || 'http://localhost:3001/api'

export async function initiatePayment(phoneNumber: string, amount: number, reference: string, channelId?: string) {
    // Format: Remove non-digits, ensure 254 prefix
    let phone = phoneNumber.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '254' + phone.slice(1)
    if (phone.startsWith('7') || phone.startsWith('1')) phone = '254' + phone
    
    // Check local dev requirement (bypass or proxy)
    // For now, attempting direct call. If CORS fails, you need a proxy.
    try {
        const body: any = {
            amount,
            phone_number: phone,
            external_reference: reference,
            // callback_url: '...' // Optional: Add if you have a listening backend
        }

        if (channelId) {
            body.channel_id = parseInt(channelId)
        }

        const res = await fetch(`${PAYMENT_API_BASE}/initiate-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        return await res.json()
    } catch (err: any) {
        console.error('Payment Error', err)
        return { success: false, error: err.message || 'Network error' }
    }
}

export async function checkPaymentStatus(reference: string) {
    try {
        const res = await fetch(`${PAYMENT_API_BASE}/status/${reference}`)
        if (!res.ok) throw new Error(res.statusText)
        return await res.json()
    } catch (err: any) {
        console.error('Status Check Error', err)
        return { success: false, status: 'error', error: err.message }
    }
}


