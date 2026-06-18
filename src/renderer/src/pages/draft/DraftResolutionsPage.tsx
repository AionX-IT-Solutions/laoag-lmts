import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { FileEdit, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  addDocument,
  deleteDocumentWithFile,
  addDocumentWithFile,
  updateDocumentWithFile
} from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column } from '../../components/ui/DataTable'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { DraftResolution } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'

const CATEGORIES = [
  { value: 'General Resolutions', label: 'General Resolutions' },
  { value: 'Commendations', label: 'Commendations' },
  { value: 'Posthumous', label: 'Posthumous' }
]
const ACTION_OPTIONS = [
  { value: 'First Reading', label: 'First Reading' },
  { value: 'Second Reading', label: 'Second Reading' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Disapproved', label: 'Disapproved' }
]

const columns: Column<DraftResolution>[] = [
  { key: 'draftResolutionNumber', header: 'Draft No.', width: 'w-28' },
  { key: 'tag', header: 'Tag', width: 'w-28' },
  { key: 'title', header: 'Title' },
  { key: 'author', header: 'Author', width: 'w-32' },
  { key: 'action', header: 'Action', width: 'w-32' },
  {
    key: 'dateReceived',
    header: 'Date',
    width: 'w-28',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  }
]

function DraftResFormModal({
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
  record?: DraftResolution
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    draftResolutionNumber: '',
    category: 'General Resolutions',
    title: '',
    author: '',
    tag: '',
    dateReceived: '',
    action: 'First Reading',
    remarks: ''
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              draftResolutionNumber: record.draftResolutionNumber ?? '',
              category: record.category ?? 'General Resolutions',
              title: record.title ?? '',
              author: record.author ?? '',
              tag: record.tag ?? '',
              dateReceived: toInputDate(record.dateReceived),
              action: record.action ?? 'First Reading',
              remarks: record.remarks ?? ''
            }
          : {
              draftResolutionNumber: '',
              category: 'General Resolutions',
              title: '',
              author: '',
              tag: '',
              dateReceived: '',
              action: 'First Reading',
              remarks: ''
            }
      )
      setFile(null)
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.draftResolutionNumber.trim() || !form.title.trim()) {
      toast.error('Draft number and Title are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit)
        await updateDocumentWithFile(
          'laoag_draft_resolution',
          record!.id,
          { ...form },
          'draftResolutions',
          `DraftRes_${form.draftResolutionNumber}`,
          file,
          record?.filePath ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'laoag_draft_resolution',
          { ...form },
          'draftResolutions',
          `DraftRes_${form.draftResolutionNumber}`,
          file
        )
      await logActivity(
        `${isEdit ? 'Updated' : 'Created'} Draft Resolution ${form.draftResolutionNumber}`
      )
      toast.success(isEdit ? 'Updated' : 'Created')
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
      title={isEdit ? 'Edit Draft Resolution' : 'Add Draft Resolution'}
      size="lg"
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
        <FormField label="Draft Resolution Number" required>
          <Input value={form.draftResolutionNumber} onChange={set('draftResolutionNumber')} />
        </FormField>
        <FormField label="Category">
          <Select options={CATEGORIES} value={form.category} onChange={set('category')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <Input value={form.title} onChange={set('title')} />
        </FormField>
        <FormField label="Author">
          <Input value={form.author} onChange={set('author')} />
        </FormField>
        <FormField label="Tag">
          <Input value={form.tag} onChange={set('tag')} />
        </FormField>
        <FormField label="Date Received">
          <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
        </FormField>
        <FormField label="Action">
          <Select options={ACTION_OPTIONS} value={form.action} onChange={set('action')} />
        </FormField>
        <FormField label="Remarks" className="col-span-2">
          <Input value={form.remarks} onChange={set('remarks')} />
        </FormField>
        <div className="col-span-2">
          <FileUploadField value={file} onChange={setFile} />
          {isEdit && record?.filePath && !file && (
            <p className="text-xs text-slate-500 mt-1.5">
              Current file:{' '}
              <a
                href={record.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View attached file
              </a>
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export function DraftResolutionsPage() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } =
    useListData<Record<string, unknown>>({
      endpoint: 'laoag_draft_resolution',
      sortParam: 'draftResolutionNumber|desc',
      dataKey: 'draftResolution',
      limit: 100,
      searchQuery: debouncedSearch
    })
  const [selected, setSelected] = useState<DraftResolution | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as DraftResolution[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim()
      ? base
      : base.filter(
          (r) =>
            r.title?.toLowerCase().includes(q) || r.draftResolutionNumber?.toLowerCase().includes(q)
        )
    return sortByField(result, sortField, sortDirection)
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
      await deleteDocumentWithFile(
        'laoag_draft_resolution',
        selected.id,
        'draftResolutions',
        `DraftRes_${selected.draftResolutionNumber}`
      )
      await logActivity(`Deleted Draft Resolution ${selected.draftResolutionNumber}`)
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
          title="Draft Resolutions"
          subtitle={`${filtered.length} records`}
          icon={<FileEdit size={20} />}
          actions={
            <>
              <button className="btn-ghost" onClick={reload}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
                  {selected.filePath && (
                    <button
                      className="btn-ghost"
                      onClick={() => window.open(selected.filePath, '_blank')}
                    >
                      <ExternalLink size={15} />
                      Open
                    </button>
                  )}
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
                Add
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
            onRowDoubleClick={() => selected?.filePath && window.open(selected.filePath, '_blank')}
            loading={loading}
            emptyMessage="No draft resolution records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <DraftResFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <DraftResFormModal
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
          title="Delete Draft Resolution"
          message={`Delete Draft Resolution ${selected?.draftResolutionNumber}?`}
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
