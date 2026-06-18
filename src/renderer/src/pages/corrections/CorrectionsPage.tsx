import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { PenTool, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  addDocument,
  addDocumentWithCount,
  updateDocument,
  queryDocuments,
  deleteDocumentWithFile,
  deleteDocumentWithCount,
  addDocumentWithFile,
  updateDocumentWithFile
} from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { Correction, EditCorrection } from '../../types'
import { getFullName, sortByField } from '../../lib/utils'

const CATEGORIES = [
  { value: '1st Reading-Resolution', label: '1st Reading-Resolution' },
  { value: '2nd Reading-Resolution', label: '2nd Reading-Resolution' },
  { value: '1st Reading-Ordinance', label: '1st Reading-Ordinance' },
  { value: '2nd Reading-Ordinance', label: '2nd Reading-Ordinance' },
  { value: '3rd Reading', label: '3rd Reading' },
  { value: 'Barangay Review', label: 'Barangay Review' },
  { value: 'Committee Report', label: 'Committee Report' },
  { value: 'Other Communication', label: 'Other Communication' }
]

const columns: Column<Correction>[] = [
  { key: 'addendumNo', header: 'Addendum No.', width: 'w-32' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-28' },
  {
    key: 'category',
    header: 'Category',
    width: 'w-28',
    render: (r) => <Badge variant="yellow">{r.category}</Badge>
  },
  { key: 'title', header: 'Title' }
]

const EMPTY_FORM = {
  addendumNo: '',
  sessionNo: '',
  title: '',
  category: CATEGORIES[0].value
}

function EditedCorrectionModal({
  open,
  onClose,
  addendumNo,
  sessionNo
}: {
  open: boolean
  onClose: () => void
  addendumNo: string
  sessionNo: string
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [existing, setExisting] = useState<EditCorrection | null>(null)

  useEffect(() => {
    if (!open) return
    setContent('')
    setExisting(null)
    setLoading(true)
    queryDocuments<EditCorrection>('laoag_edited_correction', 'orNo', addendumNo)
      .then((docs) => {
        const match = docs.find(
          (d) => (d.sessionNo ?? '').toLowerCase() === (sessionNo ?? '').toLowerCase()
        )
        if (match) {
          setExisting(match)
          setContent(match.content ?? '')
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [open, addendumNo, sessionNo])

  async function handleSave() {
    if (!content.trim()) {
      toast.error('Content is required')
      return
    }
    setSaving(true)
    try {
      if (existing)
        await updateDocument('laoag_edited_correction', existing.id, {
          orNo: addendumNo,
          sessionNo,
          content
        })
      else
        await addDocumentWithCount('laoag_edited_correction', {
          orNo: addendumNo,
          sessionNo,
          content
        })
      toast.success(existing ? 'Updated Successfully!' : 'Added Successfully!')
      onClose()
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
      title="Edited Correction"
      size="md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Spinner size="sm" className="text-white" />
                Saving...
              </>
            ) : existing ? (
              'Update Text for Correction'
            ) : (
              'Add Text for Correction'
            )}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <FormField label="Content" required>
          <TextArea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
        </FormField>
      )}
    </Modal>
  )
}

function CorrectionFormModal({
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
  record?: Correction
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showEditedCorrection, setShowEditedCorrection] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              addendumNo: record.addendumNo ?? '',
              sessionNo: record.sessionNo ?? '',
              title: record.title ?? '',
              category: record.category ?? CATEGORIES[0].value
            }
          : EMPTY_FORM
      )
      setFile(null)
    }
  }, [open, record])

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.addendumNo.trim() || !form.title.trim()) {
      toast.error('Addendum Number and Title are required')
      return
    }
    if (!isEdit && !file) {
      toast.error('Please attach a file')
      return
    }
    setSaving(true)
    try {
      const data = {
        addendumNo: form.addendumNo,
        sessionNo: form.sessionNo,
        title: form.title,
        category: form.category
      }

      if (isEdit)
        await updateDocumentWithFile(
          'laoag_correction',
          record!.id,
          data,
          'Addendum',
          `${form.sessionNo}${form.title}${form.category}`,
          file,
          record?.filePath ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'laoag_correction',
          data,
          'Addendum',
          `${form.sessionNo}${form.title}${form.category}`,
          file
        )
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Addendum ${form.addendumNo}`)
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
      title={isEdit ? 'Edit Correction' : 'Add Correction'}
      size="md"
      footer={
        <>
          {isEdit && (
            <button
              className="btn-secondary mr-auto"
              onClick={() => setShowEditedCorrection(true)}
              disabled={saving}
            >
              Add Text for Correction
            </button>
          )}
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="text-white" />
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEdit ? 'Update' : 'Add'
            )}
          </button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4">
        <FormField label="Addendum Number" required>
          <Input value={form.addendumNo} onChange={set('addendumNo')} />
        </FormField>
        <FormField label="Session Number">
          <Input value={form.sessionNo} onChange={set('sessionNo')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={5} />
        </FormField>
        <FormField label="Category">
          <Select options={CATEGORIES} value={form.category} onChange={set('category')} />
        </FormField>
        <div className="col-span-2">
          <FileUploadField value={file} onChange={setFile} required={!isEdit} />
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
      {isEdit && (
        <EditedCorrectionModal
          open={showEditedCorrection}
          onClose={() => setShowEditedCorrection(false)}
          addendumNo={record!.addendumNo}
          sessionNo={record!.sessionNo}
        />
      )}
    </Modal>
  )
}

export function CorrectionsPage() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'laoag_correction',
    sortParam: 'addendumNo|desc',
    dataKey: 'correction',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Correction | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const arr = items as unknown as Correction[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? arr : arr.filter((r) =>
      Object.values(r as unknown as Record<string, unknown>).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Correction[]
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
        'laoag_correction',
        selected.id,
        'Addendum',
        `${selected.sessionNo}${selected.title}${selected.category}`
      )
      const editedDocs = await queryDocuments<EditCorrection>(
        'laoag_edited_correction',
        'orNo',
        selected.addendumNo
      )
      const editedMatch = editedDocs.find(
        (d) => (d.sessionNo ?? '').toLowerCase() === (selected.sessionNo ?? '').toLowerCase()
      )
      if (editedMatch) {
        await deleteDocumentWithCount('laoag_edited_correction', editedMatch.id)
      }
      await logActivity(`Deleted Addendum ${selected.addendumNo}`)
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
          title="Addendum and Corrections"
          subtitle={`${filtered.length} records`}
          icon={<PenTool size={20} />}
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
            emptyMessage="No correction records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <CorrectionFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <CorrectionFormModal
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
          title="Delete Correction"
          message={`Delete Addendum ${selected?.addendumNo}?`}
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
