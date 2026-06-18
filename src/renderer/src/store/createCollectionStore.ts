import { create } from 'zustand'
import { fetchDocs } from '../lib/firebase'
import type { QueryDocumentSnapshot, OrderByDirection } from 'firebase/firestore'

export interface CollectionState<T> {
  items: (T & { id: string })[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  /** @internal cursor for Firestore pagination */
  _lastDoc: QueryDocumentSnapshot | null
  reload: () => Promise<void>
  loadMore: () => Promise<void>
}

export function createCollectionStore<T extends Record<string, unknown>>(
  collectionName: string,
  orderByField: string,
  direction: OrderByDirection = 'desc',
  pageSize = 500
) {
  return create<CollectionState<T>>()((set, get) => ({
    items: [],
    loading: false,
    loadingMore: false,
    hasMore: false,
    _lastDoc: null,

    reload: async () => {
      if (get().loading) return
      set({ loading: true, items: [], hasMore: false, _lastDoc: null })
      try {
        const result = await fetchDocs<T>(collectionName, {
          orderByField,
          direction,
          pageSize,
          after: null
        })
        set({ items: result.items, hasMore: result.hasMore, _lastDoc: result.lastDoc })
      } catch (err) {
        console.error(`[${collectionName}] reload failed:`, err)
      } finally {
        set({ loading: false })
      }
    },

    loadMore: async () => {
      const { loadingMore, loading, _lastDoc, hasMore } = get()
      if (loadingMore || loading || !_lastDoc || !hasMore) return
      set({ loadingMore: true })
      try {
        const result = await fetchDocs<T>(collectionName, {
          orderByField,
          direction,
          pageSize,
          after: _lastDoc
        })
        set((s) => ({
          items: [...s.items, ...result.items],
          hasMore: result.hasMore,
          _lastDoc: result.lastDoc
        }))
      } catch (err) {
        console.error(`[${collectionName}] loadMore failed:`, err)
      } finally {
        set({ loadingMore: false })
      }
    }
  }))
}
