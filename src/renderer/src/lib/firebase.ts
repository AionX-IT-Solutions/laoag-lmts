import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment,
  where,
  type WhereFilterOp,
  type QueryDocumentSnapshot,
  type OrderByDirection
} from 'firebase/firestore'

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBcrCxQEfKHaUKhVoRGDfZ2tSur3roTw0w',
  authDomain: 'laoaglmts.firebaseapp.com',
  projectId: 'laoaglmts',
  storageBucket: 'laoaglmts.appspot.com',
  serviceEmail: 'adolfotristanjames@gmail.com',
  servicePassword: 'laoaglmts'
}

const app = initializeApp(FIREBASE_CONFIG)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)

// Singleton auth promise — avoids concurrent sign-in attempts
let _authReady: Promise<void> | null = null

export async function ensureAuth(): Promise<void> {
  if (auth.currentUser) return
  if (!_authReady) {
    _authReady = signInWithEmailAndPassword(
      auth,
      FIREBASE_CONFIG.serviceEmail,
      FIREBASE_CONFIG.servicePassword
    ).then(() => {
      _authReady = null
    })
  }
  await _authReady
}

// ── Firestore CRUD ───────────────────────────────────────────────────────────

export interface FetchResult<T> {
  items: (T & { id: string })[]
  lastDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}

export interface FetchFilter {
  field: string
  op: WhereFilterOp
  value: unknown
}

export async function fetchDocs<T>(
  collectionName: string,
  opts: {
    orderByField: string
    direction?: OrderByDirection
    pageSize?: number
    after?: QueryDocumentSnapshot | null
    filters?: FetchFilter[]
  }
): Promise<FetchResult<T>> {
  await ensureAuth()
  const { orderByField, direction = 'desc', pageSize, after = null, filters = [] } = opts
  const col = collection(db, collectionName)
  const constraints = [
    ...filters.map((f) => where(f.field, f.op, f.value)),
    orderBy(orderByField, direction),
    ...(pageSize ? [limit(pageSize)] : []),
    ...(after ? [startAfter(after)] : [])
  ]
  const snap = await getDocs(query(col, ...constraints))
  const items = snap.docs
    .filter((d) => d.id !== '--count--')
    .map((d) => ({ id: d.id, ...d.data() })) as (T & { id: string })[]
  return { items, lastDoc: snap.docs.at(-1) ?? null, hasMore: pageSize ? snap.docs.length >= pageSize : false }
}

export async function addDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  await ensureAuth()
  const ref2 = await addDoc(collection(db, collectionName), data)
  return ref2.id
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureAuth()
  await updateDoc(doc(db, collectionName, id), data)
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await ensureAuth()
  await deleteDoc(doc(db, collectionName, id))
}

export async function queryDocuments<T>(
  collectionName: string,
  field: string,
  value: string
): Promise<(T & { id: string })[]> {
  await ensureAuth()
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (T & { id: string })[]
}

// ── Storage ──────────────────────────────────────────────────────────────────

export async function uploadFile(folder: string, filename: string, file: File): Promise<string> {
  await ensureAuth()
  const storageRef = ref(storage, `${folder}/${filename}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function deleteFile(folder: string, filename: string): Promise<void> {
  await ensureAuth()
  const storageRef = ref(storage, `${folder}/${filename}`)
  await deleteObject(storageRef)
}

export async function addDocumentWithFile(
  collectionName: string,
  data: Record<string, unknown>,
  storageFolder: string,
  storageFilename: string,
  file: File | null
): Promise<string> {
  await ensureAuth()
  let filePath = ''
  let fileType = ''
  if (file) {
    const ext = file.name.split('.').pop() ?? ''
    filePath = await uploadFile(storageFolder, storageFilename, file)
    fileType = `.${ext}`
  }
  const newDocRef = doc(collection(db, collectionName))
  const fullData = { ...data, filePath, fileType, id: newDocRef.id }
  const batch = writeBatch(db)
  batch.set(newDocRef, fullData)
  const countsRef = doc(db, collectionName, '--count--')
  batch.set(countsRef, { count: increment(1) }, { merge: true })
  try {
    await batch.commit()
    return newDocRef.id
  } catch (err) {
    if (file) {
      try {
        await deleteFile(storageFolder, storageFilename)
      } catch {}
    }
    throw err
  }
}

export async function updateDocumentWithFile(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
  storageFolder: string,
  storageFilename: string,
  file: File | null,
  existingFilePath: string,
  existingFileType: string
): Promise<void> {
  if (file) {
    const ext = file.name.split('.').pop() ?? ''
    const filePath = await uploadFile(storageFolder, storageFilename, file)
    const fileType = `.${ext}`
    try {
      await updateDocument(collectionName, id, { ...data, filePath, fileType })
    } catch (err) {
      try {
        await deleteFile(storageFolder, storageFilename)
      } catch {}
      throw err
    }
    if (existingFilePath) {
      try {
        await deleteObject(ref(storage, existingFilePath))
      } catch {}
    }
  } else {
    await updateDocument(collectionName, id, {
      ...data,
      filePath: existingFilePath,
      fileType: existingFileType
    })
  }
}

export async function deleteDocumentWithFile(
  collectionName: string,
  id: string,
  _storageFolder: string,
  _storageFilename: string
): Promise<void> {
  await ensureAuth()
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  const filePath = docSnap.exists() ? (docSnap.data().filePath as string) : ''
  const batch = writeBatch(db)
  batch.delete(docRef)
  const countsRef = doc(db, collectionName, '--count--')
  batch.set(countsRef, { count: increment(-1) }, { merge: true })
  await batch.commit()
  if (filePath) {
    try {
      await deleteObject(ref(storage, filePath))
    } catch {}
  }
}

export async function bulkCopyField(
  collectionName: string,
  sourceField: string,
  targetField: string
): Promise<number> {
  await ensureAuth()
  const snap = await getDocs(collection(db, collectionName))
  const docs = snap.docs.filter((d) => d.id !== '--count--')
  for (let i = 0; i < docs.length; i += 499) {
    const batch = writeBatch(db)
    for (const d of docs.slice(i, i + 499)) {
      const val = (d.data()[sourceField] as string) ?? ''
      batch.update(d.ref, { [targetField]: val })
    }
    await batch.commit()
  }
  return docs.length
}

export async function addDocumentWithCount(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  await ensureAuth()
  const batch = writeBatch(db)
  const newDocRef = doc(collection(db, collectionName))
  batch.set(newDocRef, { ...data, id: newDocRef.id })
  const countsRef = doc(db, collectionName, '--count--')
  batch.set(countsRef, { count: increment(1) }, { merge: true })
  await batch.commit()
  return newDocRef.id
}

export async function deleteDocumentWithCount(collectionName: string, id: string): Promise<void> {
  await ensureAuth()
  const batch = writeBatch(db)
  batch.delete(doc(db, collectionName, id))
  const countsRef = doc(db, collectionName, '--count--')
  batch.set(countsRef, { count: increment(-1) }, { merge: true })
  await batch.commit()
}

export async function getCollectionCounts(collectionName: string): Promise<Record<string, number>> {
  await ensureAuth()
  const countsRef = doc(db, collectionName, '--count--')
  const snap = await getDoc(countsRef)
  if (snap.exists()) {
    const data = snap.data()
    return { count: typeof data.count === 'number' ? data.count : 0 }
  }

  // --count-- doesn't exist yet — build it from all existing documents
  const allSnap = await getDocs(collection(db, collectionName))
  const result = { count: allSnap.docs.filter((d) => d.id !== '--count--').length }
  await setDoc(countsRef, result)
  return result
}
