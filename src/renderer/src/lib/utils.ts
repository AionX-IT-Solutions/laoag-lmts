import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function toInputDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return dateStr.trim()
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function getFullName(
  firstName: string,
  middleName: string,
  lastName: string,
  suffix?: string
): string {
  return [firstName, middleName, lastName, suffix].filter(Boolean).join(' ')
}

export function sortByField<T>(arr: T[], field: string, direction: 'asc' | 'desc'): T[] {
  return [...arr].sort((a, b) => {
    const av = String((a as Record<string, unknown>)[field] ?? '')
    const bv = String((b as Record<string, unknown>)[field] ?? '')
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
    return direction === 'desc' ? -cmp : cmp
  })
}

export function nowDateString(): string {
  const now = new Date()
  return (
    now.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) +
    ' ' +
    now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  )
}
