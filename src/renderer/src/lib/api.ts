import axios from 'axios'

export const API_BASE = 'https://asia-southeast1-laoaglmts.cloudfunctions.net/api'

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
  apiKey: 'AIzaSyBcrCxQEfKHaUKhVoRGDfZ2tSur3roTw0w',
  authDomain: 'laoaglmts.firebaseapp.com',
  storageBucket: 'laoaglmts.appspot.com',
  serviceEmail: 'adolfotristanjames@gmail.com',
  servicePassword: 'laoaglmts'
}
