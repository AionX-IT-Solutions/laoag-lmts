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
import { formatDate, getFullName } from '../../lib/utils'

const parseSessionNo = (sessionNo?: string) => {
  const m = /^(\d+)SP_(\d+)/i.exec(sessionNo ?? '')
  if (m) return { group: 0, primary: parseInt(m[1], 10), secondary: parseInt(m[2], 10) }
  return { group: 1, primary: parseInt(sessionNo ?? '', 10) || 0, secondary: 0 }
}

const compareSessionNoDesc = (a?: string, b?: string) => {
  const pa = parseSessionNo(a)
  const pb = parseSessionNo(b)
  if (pa.group !== pb.group) return pa.group - pb.group
  if (pa.primary !== pb.primary) return pb.primary - pa.primary
  return pb.secondary - pa.secondary
}

const READING_OPTIONS = [
  { value: '1st reading', label: '1st Reading' },
  { value: '2nd reading', label: '2nd Reading' },
  { value: '3rd reading', label: '3rd Reading' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Disapproved', label: 'Disapproved' }
]

const columns: Column<DraftResolution>[] = [
  { key: 'draftResolutionNumber', header: 'Draft No.', width: 'w-48' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-28' },
  { key: 'reading', header: 'Reading', width: 'w-28' },
  { key: 'title', header: 'Title' },
  { key: 'author', header: 'Author/Sponsor', width: 'w-40' },
  {
    key: 'dateReceived',
    header: 'Date Received',
    width: 'w-32',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  }
]

const EMPTY_FORM = {
  draftResolutionNumber: '',
  title: '',
  author: '',
  sessionNo: '',
  reading: '1st reading',
  actionOfOfficer: '',
  dateReceived: '',
  dateOfReading: '',
  timeReceived: ''
}

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
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              draftResolutionNumber: record.draftResolutionNumber ?? '',
              title: record.title ?? '',
              author: record.author ?? '',
              sessionNo: record.sessionNo ?? '',
              reading: record.reading ?? '1st reading',
              actionOfOfficer: record.actionOfOfficer ?? '',
              dateReceived: record.dateReceived ?? '',
              dateOfReading: record.dateOfReading ?? '',
              timeReceived: record.timeReceived ?? ''
            }
          : EMPTY_FORM
      )
      setFile(null)
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
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
          'DraftResolutions',
          `ResolutionNo._${form.draftResolutionNumber}`,
          file,
          record?.filePath ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'laoag_draft_resolution',
          { ...form },
          'DraftResolutions',
          `ResolutionNo._${form.draftResolutionNumber}`,
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
          <button className="btn-primary" onClick={() => handleSubmit()} disabled={saving}>
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
        <FormField label="Draft Resolution Number" required className="col-span-2">
          <Input value={form.draftResolutionNumber} onChange={set('draftResolutionNumber')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <Input value={form.title} onChange={set('title')} />
        </FormField>
        <FormField label="Author / Sponsor" className="col-span-2">
          <Input value={form.author} onChange={set('author')} />
        </FormField>
        <FormField label="Session No.">
          <Input value={form.sessionNo} onChange={set('sessionNo')} placeholder="e.g. 95th" />
        </FormField>
        <FormField label="Reading">
          <Select options={READING_OPTIONS} value={form.reading} onChange={set('reading')} />
        </FormField>
        <FormField label="Action taken by SP">
          <Input value={form.actionOfOfficer} onChange={set('actionOfOfficer')} />
        </FormField>
        <FormField label="Date Received">
          <Input
            value={form.dateReceived}
            onChange={set('dateReceived')}
            placeholder="e.g. Friday, 14 June 2024"
          />
        </FormField>
        <FormField label="Time Received">
          <Input
            value={form.timeReceived}
            onChange={set('timeReceived')}
            placeholder="e.g. 10:44:54 am"
          />
        </FormField>
        <FormField label="Date of Reading" className="col-span-2">
          <Input
            value={form.dateOfReading}
            onChange={set('dateOfReading')}
            placeholder="e.g. Tuesday, 18 June 2024"
          />
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
  const { items, loading, loadingMore, hasMore, reload, loadMore } =
    useListData<Record<string, unknown>>({
      endpoint: 'laoag_draft_resolution',
      sortParam: 'sessionNo|desc',
      dataKey: 'draftResolution',
      limit: 0,
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
            r.title?.toLowerCase().includes(q) ||
            r.draftResolutionNumber?.toLowerCase().includes(q) ||
            r.author?.toLowerCase().includes(q)
        )
    return [...result].sort((a, b) => compareSessionNoDesc(a.sessionNo, b.sessionNo))
  }, [items, debouncedSearch])

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
        'DraftResolutions',
        `ResolutionNo._${selected.draftResolutionNumber}`
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
        <div className="flex justify-end mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search by number or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-64! py-2!"
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
