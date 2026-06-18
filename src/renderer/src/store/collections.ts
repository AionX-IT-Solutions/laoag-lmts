import { createCollectionStore } from './createCollectionStore'

export const useMinutesStore = createCollectionStore('minutes', 'sessionNo')
export const useOrdinancesStore = createCollectionStore('ordinance', 'ordinanceNumber')
export const useResolutionsStore = createCollectionStore('resolution', 'resolutionNumber')
export const useBrgyStore = createCollectionStore('brgy', 'brgy')
export const useCommunicationsStore = createCollectionStore('communication', 'referenceNumber')
export const useCommitteeReportsStore = createCollectionStore(
  'committeeReport',
  'committeeReportNumber'
)
export const useCommitteesStore = createCollectionStore('committee', 'committeeNumber')
export const useCorrectionsStore = createCollectionStore('correction', 'referenceNumber')
export const useDraftOrdinancesStore = createCollectionStore(
  'draftOrdinance',
  'draftOrdinanceNumber'
)
export const useDraftResolutionsStore = createCollectionStore(
  'draftResolution',
  'draftResolutionNumber'
)
export const useIncomingStore = createCollectionStore('incoming', 'referenceNumber')
export const useJudicialStore = createCollectionStore('judicial', 'caseNumber')
export const useLogsStore = createCollectionStore('logs', 'date')
export const useOfficialsStore = createCollectionStore('official', 'lastName')
export const useOtherMattersStore = createCollectionStore('matters', 'referenceNumber')
export const useReviewStore = createCollectionStore('review', 'referenceNumber')
export const useTranscriptsStore = createCollectionStore('transcript', 'session')
export const useTricycleStore = createCollectionStore('tricy', 'franchiseNo')
export const useAccountsStore = createCollectionStore('accounts', 'username')
