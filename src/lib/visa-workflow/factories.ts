import { DEFAULT_EMAIL_CONFIG, SAMPLE_DOCUMENT_LIST } from "./constants"
import {
  createEmailSubject,
  createSessionFolderName,
  formatDateLabel,
} from "./formatters"
import { parseDocumentList } from "./parsers"
import type {
  DateFormat,
  DocTypeConfig,
  DocumentDateValue,
  SessionStatus,
  VisaConfig,
  VisaSessionRecord,
  WorkflowDocumentState,
} from "./types"

function startOfMonthIso() {
  const date = new Date()
  date.setDate(1)

  return date.toISOString().slice(0, 10)
}

export function createDefaultDateValue(dateFormat: DateFormat): DocumentDateValue {
  if (dateFormat === "range") {
    return {
      mode: "range",
      from: startOfMonthIso(),
      to: new Date().toISOString().slice(0, 10),
    }
  }

  return {
    mode: "single",
    date: new Date().toISOString().slice(0, 10),
  }
}

export function createSeededConfig(rawDocumentList = SAMPLE_DOCUMENT_LIST): VisaConfig {
  const docTypes = parseDocumentList(rawDocumentList).map((docType) => ({
    ...docType,
    active: docType.number === 4 || docType.number === 7 || docType.number === 8,
  }))

  return {
    email: DEFAULT_EMAIL_CONFIG,
    docTypes,
    seededAt: new Date().toISOString(),
  }
}

export function createWorkflowDocumentState(
  docType: DocTypeConfig,
  previous?: WorkflowDocumentState
): WorkflowDocumentState {
  return {
    docTypeId: docType.id,
    dates: previous?.dates ?? createDefaultDateValue(docType.dateFormat),
    matchedFiles: previous?.matchedFiles ?? [],
    generatedFiles: previous?.generatedFiles ?? [],
    generatedDocId: previous?.generatedDocId,
    status: previous?.status ?? "pending",
    validationMessage: previous?.validationMessage,
    captions: previous?.captions ?? [],
  }
}

export function createSessionRecord(args: {
  id?: string
  config: VisaConfig
  documents: WorkflowDocumentState[]
  draftDate: string
  status: SessionStatus
  filesMoved: boolean
  submittedAt?: string
}): VisaSessionRecord {
  const folderName = createSessionFolderName(args.submittedAt ?? args.draftDate)
  const activeDocTypes = args.config.docTypes.filter((docType) => docType.active)
  const documents = args.documents.flatMap((documentState) => {
    const docType = activeDocTypes.find((item) => item.id === documentState.docTypeId)

    if (!docType) {
      return []
    }

    return {
      docTypeId: docType.id,
      number: docType.number,
      label: docType.label,
      category: docType.category,
      dateFormat: docType.dateFormat,
      dates: documentState.dates,
      dateLabel: formatDateLabel(documentState.dates),
      filenames: documentState.generatedFiles.length
        ? documentState.generatedFiles
        : documentState.matchedFiles,
      status: documentState.status,
      captions: documentState.captions,
    }
  })

  return {
    id: args.id ?? `session_${Date.now()}`,
    createdAt: new Date().toISOString(),
    submittedAt: args.submittedAt,
    draftDate: args.draftDate,
    folderName,
    emailSubject: createEmailSubject(args.submittedAt ?? args.draftDate),
    status: args.status,
    filesMoved: args.filesMoved,
    documents,
  }
}