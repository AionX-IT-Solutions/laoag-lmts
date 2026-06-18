import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Users, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select } from '../../components/ui/FormField'
import { Spinner } from '../../components/ui/Spinner'
import type { Official } from '../../types'
import { getFullName, sortByField } from '../../lib/utils'

const POSITIONS = [
  { value: 'City Vice Mayor', label: 'City Vice Mayor' },
  { value: 'City Councilor', label: 'City Councilor' },
  { value: 'Ex-Officio', label: 'Ex-Officio' }
]

const columns: Column<Official>[] = [
  { key: 'firstName', header: 'First Name', width: 'w-28' },
  { key: 'middleName', header: 'Middle Name', width: 'w-28' },
  { key: 'lastName', header: 'Last Name', width: 'w-28' },
  { key: 'suffix', header: 'Suffix', width: 'w-16' },
  {
    key: 'position',
    header: 'Position',
    width: 'w-36',
    render: (r) => <Badge variant="blue">{r.position}</Badge>
  },
  { key: 'term', header: 'Term', width: 'w-24' }
]

function OfficialFormModal({
  open,
  onClose,
  onSuccess,
  logActivity,
  record
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  logActivity: (a: string) => Promise<void>
  record?: Official
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    position: 'City Councilor',
    term: ''
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              firstName: record.firstName ?? '',
              middleName: record.middleName ?? '',
              lastName: record.lastName ?? '',
              suffix: record.suffix ?? '',
              position: record.position ?? 'City Councilor',
              term: record.term ?? ''
            }
          : {
              firstName: '',
              middleName: '',
              lastName: '',
              suffix: '',
              position: 'City Councilor',
              term: ''
            }
      )
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and Last name are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit) await updateDocument('official', record!.id, { ...form })
      else await addDocument('official', { ...form })
      await logActivity(
        `${isEdit ? 'Updated' : 'Added'} Official ${form.firstName} ${form.lastName}`
      )
      toast.success(isEdit ? 'Updated' : 'Added')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Official' : 'Add Official'}
      size="md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="text-white" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required>
          <Input value={form.firstName} onChange={set('firstName')} />
        </FormField>
        <FormField label="Middle Name">
          <Input value={form.middleName} onChange={set('middleName')} />
        </FormField>
        <FormField label="Last Name" required>
          <Input value={form.lastName} onChange={set('lastName')} />
        </FormField>
        <FormField label="Suffix">
          <Input value={form.suffix} onChange={set('suffix')} placeholder="Jr., Sr., III" />
        </FormField>
        <FormField label="Position" className="col-span-2">
          <Select options={POSITIONS} value={form.position} onChange={set('position')} />
        </FormField>
        <FormField label="Term" className="col-span-2">
          <Input value={form.term} onChange={set('term')} placeholder="e.g. 2022-2025" />
        </FormField>
      </form>
    </Modal>
  )
}

export function OfficialsPage() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: '/official/all',
    sortParam: 'lastName|desc',
    dataKey: 'official',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Official | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as Official[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (r) =>
        r.firstName?.toLowerCase().includes(q) ||
        r.lastName?.toLowerCase().includes(q) ||
        r.position?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Official[]
  }, [items, debouncedSearch, sortField, sortDirection])

  async function logActivity(activity: string) {
    if (!user) return
    const name = getFullName(user.firstName, user.middleName, user.lastName)
    const date =
      new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) +
      ' ' +
      new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    await addDocument('laoag_logs', { name, activity, date, year: new Date().getFullYear() })
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteDocument('official', selected.id)
      await logActivity(`Deleted Official ${selected.firstName} ${selected.lastName}`)
      toast.success('Deleted')
      setShowDelete(false)
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="S.P. Members / Officials"
          subtitle={`${filtered.length} records`}
          icon={<Users size={20} />}
          actions={
            <>
              <button className="btn-ghost" onClick={reload}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
                  <button className="btn-secondary" onClick={() => setShowEdit(true)}>
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => setShowDelete(true)}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </>
              )}
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={15} />
                Add Official
              </button>
            </>
          }
        />
        <div className="flex justify-end mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !w-56 !py-2"
          />
        </div>
        <div className="card flex flex-col flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filtered}
            selectedId={selected?.id}
            onRowClick={setSelected}
            loading={loading}
            emptyMessage="No official records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <OfficialFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <OfficialFormModal
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false)
              reload()
            }}
            logActivity={logActivity}
            record={selected}
          />
        )}
        <ConfirmDialog
          open={showDelete}
          title="Delete Official"
          message={`Delete ${selected?.firstName} ${selected?.lastName}?`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      </PageContainer>
    </Layout>
  )
}
