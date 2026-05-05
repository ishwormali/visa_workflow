export type DocCategory = "upload" | "gdoc" | "gdoc_photos"
export type DateFormat = "single" | "range"
export type SessionStatus = "draft" | "sent"
export type DocProgressStatus =
  | "detected"
  | "pending"
  | "ready"
  | "skipped"
  | "sent"
  | "draft"

export type EmailConfig = {
  toEmail: string
  ccEmail: string
  greeting: string
  signOff: string
}

export type DocTypeConfig = {
  id: string
  number: number
  label: string
  category: DocCategory
  dateFormat: DateFormat
  matchPattern: string
  active: boolean
}

export type DocumentDateValue =
  | {
      mode: "single"
      date: string
    }
  | {
      mode: "range"
      from: string
      to: string
    }

export type PhotoCaption = {
  id: string
  fileName: string
  date: string
  people: string
  description: string
  formattedCaption: string
  skipped: boolean
}

export type WorkflowDocumentState = {
  docTypeId: string
  dates: DocumentDateValue
  matchedFiles: string[]
  generatedFiles: string[]
  generatedDocId?: string
  status: DocProgressStatus
  validationMessage?: string
  captions: PhotoCaption[]
}

export type SessionDocumentRecord = {
  docTypeId: string
  number: number
  label: string
  category: DocCategory
  dateFormat: DateFormat
  dates: DocumentDateValue
  dateLabel: string
  filenames: string[]
  status: DocProgressStatus
  captions: PhotoCaption[]
}

export type VisaSessionRecord = {
  id: string
  createdAt: string
  submittedAt?: string
  draftDate: string
  folderName: string
  emailSubject: string
  status: SessionStatus
  filesMoved: boolean
  documents: SessionDocumentRecord[]
}

export type VisaConfig = {
  email: EmailConfig
  docTypes: DocTypeConfig[]
  seededAt?: string
}

export const VISA_CONFIG_KEY = "visa_config"
export const VISA_SESSIONS_KEY = "visa_sessions"

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  toEmail: "",
  ccEmail: "",
  greeting: "Team",
  signOff: "Applicant",
}

export const SAMPLE_DOCUMENT_LIST = `| No | Document | Status | Attachment |
| 1 | Sponsor letter | | 1 - sponsor letter.pdf |
| 2 | Passport copies | | 2 - passport.pdf |
| 3 | Employment letters | | 3 - employment.pdf |
| 4 | Joint statements from January to current | | 4 - savers account.pdf\n4 - smart account.pdf |
| 5 | Travel itinerary | | 5 - itinerary.pdf |
| 6 | Proof of address | | 6 - address.pdf |
| 7 | WhatsApp chat history from January to current | | 7 - Whatsapp export.zip |
| 8 | Photographs of relationship | | 8 - Photograph collage.jpg |`

const RANGE_DESCRIPTION_PATTERN = /from .+ to|till today|to current/i
const PHOTO_PATTERN = /photo|photograph/i
const CHAT_PATTERN = /whatsapp|chat|history/i

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

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

export function parseDocumentList(plainText: string): DocTypeConfig[] {
  const rows = plainText.split("\n")
  const docTypes: DocTypeConfig[] = []

  for (const row of rows) {
    const match = row.match(
      /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/
    )

    if (!match) {
      continue
    }

    const [, rawNumber, rawDescription, , rawAttachments] = match
    const number = Number.parseInt(rawNumber, 10)

    if (Number.isNaN(number)) {
      continue
    }

    const description = rawDescription.trim()
    const attachments = rawAttachments.trim()
    const category: DocCategory = PHOTO_PATTERN.test(description)
      ? "gdoc_photos"
      : CHAT_PATTERN.test(description)
        ? "gdoc"
        : "upload"
    const dateFormat: DateFormat = RANGE_DESCRIPTION_PATTERN.test(description)
      ? "range"
      : "single"
    const subTypes: Array<"savers" | "smart"> = []

    if (/savers/i.test(attachments)) {
      subTypes.push("savers")
    }

    if (/smart/i.test(attachments)) {
      subTypes.push("smart")
    }

    if (subTypes.length > 0) {
      for (const subType of subTypes) {
        docTypes.push({
          id: `doc_${number}_${category}_${slugify(subType)}`,
          number,
          label: `${description} - ${subType} account`,
          category,
          dateFormat,
          matchPattern: `^${number}[\\s\\-].*${subType}`,
          active: true,
        })
      }

      continue
    }

    let matchPattern = `^${number}[\\s\\-]`

    if (category === "gdoc") {
      matchPattern = `^${number}[\\s\\-].*[Ww]hatsapp`
    }

    if (category === "gdoc_photos") {
      matchPattern = `^${number}[\\s\\-].*[Pp]hotograph`
    }

    docTypes.push({
      id: `doc_${number}_${category}`,
      number,
      label: description,
      category,
      dateFormat,
      matchPattern,
      active: true,
    })
  }

  return docTypes
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

export function formatDateLabel(value: DocumentDateValue) {
  if (value.mode === "single") {
    return value.date || "Date required"
  }

  if (!value.from || !value.to) {
    return "Date range required"
  }

  return `${value.from} to ${value.to}`
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

export function createSessionFolderName(dateIso: string) {
  const date = new Date(dateIso)

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(" ", "-")
    .replace(/^(\w{3})-(\d{4})$/, "Visa-$1-$2")
}

export function createEmailSubject(dateIso: string) {
  const date = new Date(dateIso)
  const day = String(date.getDate()).padStart(2, "0")
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(date)
  const year = date.getFullYear()

  return `Visa Application Documents - ${day}-${month}-${year}`
}

export function validateDocumentDates(
  docType: DocTypeConfig,
  documentState: WorkflowDocumentState
) {
  if (docType.category === "gdoc_photos") {
    return ""
  }

  if (documentState.dates.mode === "single") {
    return documentState.dates.date ? "" : `Set a date for ${docType.label}.`
  }

  if (documentState.dates.from && documentState.dates.to) {
    return ""
  }

  return `Set a date range for ${docType.label}.`
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

export function buildEmailBody(args: {
  config: VisaConfig
  documents: SessionDocumentRecord[]
}) {
  const lines = args.documents
    .filter((document) => document.status !== "skipped")
    .map(
      (document) =>
        `* ${document.number} - ${document.label} ${document.dateLabel}`
    )
    .join("\n")

  return [
    `Hi ${args.config.email.greeting},`,
    "",
    "Hope you guys are doing well.",
    "Please find the attachments below:",
    "",
    lines,
    "",
    "--",
    "Best Regards,",
    args.config.email.signOff,
  ].join("\n")
}

export function matchesDocType(fileName: string, docType: DocTypeConfig) {
  try {
    return new RegExp(docType.matchPattern, "i").test(fileName)
  } catch {
    return false
  }
}

export const SAMPLE_DRIVE_FILES = [
  "4 - savers account - Apr 2026.pdf",
  "4 - smart account - Apr 2026.pdf",
  "7 - Whatsapp export - Apr 2026.zip",
  "8 - Photograph - picnic.jpg",
  "8 - Photograph - wedding.jpg",
]