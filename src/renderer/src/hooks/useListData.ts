import { useCallback, useEffect, useRef, useState } from 'react'
import { type QueryDocumentSnapshot } from 'firebase/firestore'
import { fetchDocs, type FetchFilter } from '../lib/firebase'

interface Options {
  endpoint: string
  sortParam: string
  dataKey: string
  limit?: number
  filters?: FetchFilter[]
  searchQuery?: string
}

export function useListData<T>({
  endpoint,
  sortParam,
  limit = 100,
  filters,
  searchQuery
}: Options) {
  const collectionName = endpoint.split('/').filter(Boolean)[0]
  const parts = sortParam.split('|')
  const orderByField = parts[0]
  const direction = (parts[1] === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
  const filtersKey = JSON.stringify(filters ?? [])
  const isSearching = (searchQuery ?? '').trim().length > 0
  // limit === 0 means "fetch all records" — disables pagination entirely.
  // Also fetch everything while searching: pagination windows are cut by the
  // page's raw sort order, so a match past page 1 would otherwise never be
  // fetched to test against the search query.
  const fetchAll = limit === 0 || isSearching

  const [items, setItems] = useState<(T & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null)
  const busyRef = useRef(false)
  const filtersRef = useRef(filters)
  filtersRef.current = filters // eslint-disable-line
  const isSearchingRef = useRef(isSearching)
  isSearchingRef.current = isSearching // eslint-disable-line

  const reload = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setLoading(true)
    setItems([])
    setHasMore(false)
    lastDocRef.current = null
    try {
      const result = await fetchDocs<T>(collectionName, {
        orderByField,
        direction,
        pageSize: fetchAll ? undefined : limit,
        filters: filtersRef.current,
        searchQuery
      })
      setItems(result.items)
      setHasMore(fetchAll ? false : result.hasMore)
      lastDocRef.current = result.lastDoc
    } catch (err) {
      console.error(`[useListData] reload failed for ${collectionName}:`, err)
    } finally {
      setLoading(false)
      busyRef.current = false
    }
  }, [collectionName, orderByField, direction, limit, filtersKey, searchQuery, fetchAll]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (busyRef.current || !lastDocRef.current || fetchAll) return
    busyRef.current = true
    setLoadingMore(true)
    try {
      const result = await fetchDocs<T>(collectionName, {
        orderByField,
        direction,
        pageSize: limit,
        after: lastDocRef.current,
        filters: filtersRef.current,
        searchQuery
      })
      if (result.items.length > 0) {
        setItems((prev) => [...prev, ...result.items])
        setHasMore(result.hasMore)
        lastDocRef.current = result.lastDoc
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error(`[useListData] loadMore failed for ${collectionName}:`, err)
    } finally {
      setLoadingMore(false)
      busyRef.current = false
    }
  }, [collectionName, orderByField, direction, limit, filtersKey, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    items,
    loading,
    loadingMore,
    hasMore: fetchAll ? false : hasMore,
    reload,
    loadMore,
    sortField: orderByField,
    sortDirection: direction
  }
}
