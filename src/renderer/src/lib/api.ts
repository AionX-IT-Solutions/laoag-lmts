import axios from 'axios'

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'https://asia-southeast1-laoaglmts.cloudfunctions.net/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('lmts-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      const token: string | undefined = parsed?.state?.user?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err?.config?.url, err?.response?.status, err?.response?.data)
    return Promise.reject(err)
  }
)

// Firebase config
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  serviceEmail: import.meta.env.VITE_FIREBASE_SERVICE_EMAIL,
  servicePassword: import.meta.env.VITE_FIREBASE_SERVICE_PASSWORD
}
