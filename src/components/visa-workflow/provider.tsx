import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { readStoredJson, writeStoredJson } from "@/lib/browser-storage"
import {
  copyGoogleDriveFile,
  createGoogleDocInDrive,
  createGoogleDriveFolder,
  downloadGoogleDriveFileAsBase64,
  listGoogleDriveFolders,
  listGoogleDriveFilesRecursively,
  moveGoogleDriveFile,
  readGoogleDriveDefaultRootFolderId,
  readGoogleDriveDocumentList,
  readGoogleDriveFileMetadata,
  type GoogleDriveFile,
} from "@/lib/google-drive"
import {
  DEFAULT_EMAIL_CONFIG,
  SAMPLE_DOCUMENT_LIST,
  VISA_CONFIG_KEY,
  VISA_SESSIONS_KEY,
  buildEmailBody,
  createDefaultDateValue,
  createEmailSubject,
  createSeededConfig,
  createSessionFolderName,
  createSessionRecord,
  createWorkflowDocumentState,
  formatDateLabel,
  parseDocumentList,
  type DocTypeConfig,
  type DocumentDateValue,
  type PhotoCaption,
  type VisaConfig,
  type VisaSessionRecord,
  type WorkflowDocumentState,
  type WorkflowStepValue,
} from "@/lib/visa-workflow"

export type WorkflowStep = WorkflowStepValue
type StepWithLogs = 1 | 2 | 3 | 4 | 5

type LogState = Record<StepWithLogs, string[]>
type DriveFileIndex = Map<string, GoogleDriveFile[]>

const STEP_ITEMS = [
  { id: 1, label: "Select Date Range" },
  { id: 2, label: "Visa Folder & Raw Docs" },
] as const

const EMPTY_CONFIG: VisaConfig = {
  email: DEFAULT_EMAIL_CONFIG,
  docTypes: [],
  googleDriveRootFolderId: undefined,
  googleDriveRootFolderName: undefined,
}

const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"

function normalizeWorkflowStep(step?: WorkflowStep) {
  if (!step || step < 1) {
    return 1
  }

  if (step > 2) {
    return 2
  }

  return step
}

function createInitialLogs(): LogState {
  return {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function startOfMonthIso() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

function createVisaFolderNameFromToDate(toDate: string) {
  const parsedDate = new Date(toDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return ""
  }

  const displayDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(parsedDate)
    .replace(/,/g, "")
    .replace(/\s+/g, "-")

  return `Visa-${displayDate}`
}

export function formatDisplayDate(dateValue?: string) {
  if (!dateValue) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue))
}

function wait(ms = 180) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function cloneDates(value: DocumentDateValue): DocumentDateValue {
  if (value.mode === "single") {
    return {
      mode: "single",
      date: value.date,
    }
  }

  return {
    mode: "range",
    from: value.from,
    to: value.to,
  }
}

function buildWorkflowDocuments(
  config: VisaConfig,
  sessions: VisaSessionRecord[]
): WorkflowDocumentState[] {
  const lastSession =
    sessions.find((session) => session.status === "sent") ?? sessions[0]
  const previousDocuments = new Map(
    lastSession?.documents.map((document) => [document.docTypeId, document]) ??
      []
  )

  return config.docTypes
    .filter((docType) => docType.active)
    .map((docType) => {
      const previous = previousDocuments.get(docType.id)

      return createWorkflowDocumentState(docType, {
        docTypeId: docType.id,
        dates: previous
          ? cloneDates(previous.dates)
          : createDefaultDateValue(docType.dateFormat),
        matchedFiles: [],
        generatedFiles: [],
        status: "pending",
        validationMessage: "",
        captions: [],
      })
    })
}

function buildWorkflowDocumentsFromSession(
  config: VisaConfig,
  session: VisaSessionRecord
): WorkflowDocumentState[] {
  const savedDocuments = new Map(
    session.documents.map((document) => [document.docTypeId, document])
  )

  return config.docTypes
    .filter((docType) => docType.active)
    .map((docType) => {
      const savedDocument = savedDocuments.get(docType.id)

      if (!savedDocument) {
        return createWorkflowDocumentState(docType, {
          docTypeId: docType.id,
          dates: createDefaultDateValue(docType.dateFormat),
          matchedFiles: [],
          generatedFiles: [],
          status: "pending",
          validationMessage: "",
          captions: [],
        })
      }

      return createWorkflowDocumentState(docType, {
        docTypeId: savedDocument.docTypeId,
        dates: cloneDates(savedDocument.dates),
        matchedFiles: savedDocument.matchedFiles ?? [],
        generatedFiles: savedDocument.generatedFiles ?? [],
        generatedDocId: savedDocument.generatedDocId,
        status: savedDocument.status,
        validationMessage: savedDocument.validationMessage,
        captions: savedDocument.captions,
      })
    })
}

function upsertSession(
  previousSessions: VisaSessionRecord[],
  nextSession: VisaSessionRecord
) {
  const remainingSessions = previousSessions.filter(
    (session) => session.id !== nextSession.id
  )

  return [nextSession, ...remainingSessions].sort((left, right) => {
    const leftDate = left.submittedAt ?? left.createdAt
    const rightDate = right.submittedAt ?? right.createdAt

    return new Date(rightDate).getTime() - new Date(leftDate).getTime()
  })
}

function createCaptionId(fileName: string) {
  return `caption_${fileName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
}

function formatCaptionDate(dateValue: string) {
  return formatDisplayDate(dateValue)
}

function createWorkflowId() {
  return `session_${Date.now()}`
}

function normalizeGoogleDriveFolderId(rawValue: string) {
  const trimmedValue = rawValue.trim()

  if (!trimmedValue) {
    return ""
  }

  const folderPathMatch = trimmedValue.match(/\/folders\/([^/?#]+)/)

  if (folderPathMatch) {
    return decodeURIComponent(folderPathMatch[1])
  }

  const queryIdMatch = trimmedValue.match(/[?&]id=([^&#]+)/)

  if (queryIdMatch) {
    return decodeURIComponent(queryIdMatch[1])
  }

  return trimmedValue
}

function createDriveFileIndex(files: GoogleDriveFile[]) {
  const index: DriveFileIndex = new Map()

  for (const file of files) {
    const existingFiles = index.get(file.name) ?? []
    existingFiles.push(file)
    index.set(file.name, existingFiles)
  }

  return index
}

function formatActionError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Unexpected Google Drive error."
}

function formatCaptionLine(caption: PhotoCaption) {
  if (caption.formattedCaption) {
    return caption.formattedCaption
  }

  return `${formatCaptionDate(caption.date)}: ${caption.people || "Names"} + ${caption.description || "Description"}`
}

function buildGeneratedDocumentContent(
  docType: DocTypeConfig,
  document: WorkflowDocumentState
) {
  const lines = [
    `${docType.number} - ${docType.label}`,
    "",
    `Dates: ${formatDateLabel(document.dates)}`,
  ]

  if (docType.category === "gdoc_photos") {
    const captions = document.captions.filter((caption) => !caption.skipped)

    lines.push("", "Photo captions:")

    if (!captions.length) {
      lines.push("- No photo captions were captured for this session.")
      return lines.join("\n")
    }

    for (const caption of captions) {
      lines.push(`- ${formatCaptionLine(caption)}`)
    }

    return lines.join("\n")
  }

  lines.push("", "Matched Drive files:")

  if (!document.matchedFiles.length) {
    lines.push(
      "- No Drive files matched this document type for the selected dates."
    )
    return lines.join("\n")
  }

  for (const fileName of document.matchedFiles) {
    lines.push(`- ${fileName}`)
  }

  return lines.join("\n")
}

function useVisaWorkflowState(options: { sessionId?: string } = {}) {
  const [hydrated, setHydrated] = useState(false)
  const [config, setConfig] = useState<VisaConfig>(EMPTY_CONFIG)
  const [sessions, setSessions] = useState<VisaSessionRecord[]>([])
  const [documents, setDocuments] = useState<WorkflowDocumentState[]>([])
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(0)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [seedSource, setSeedSource] = useState(SAMPLE_DOCUMENT_LIST)
  const [seedReview, setSeedReview] = useState<DocTypeConfig[]>([])
  const [seedError, setSeedError] = useState("")
  const [seedLogs, setSeedLogs] = useState<string[]>([])
  const [rootFolderInput, setRootFolderInput] = useState("")
  const [rootFolderError, setRootFolderError] = useState("")
  const [logs, setLogs] = useState<LogState>(createInitialLogs)
  const [draftDate, setDraftDate] = useState(todayIso())
  const [selectedFromDate, setSelectedFromDate] = useState(startOfMonthIso())
  const [selectedToDate, setSelectedToDate] = useState(todayIso())
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null)
  const [emailPreview, setEmailPreview] = useState("")
  const [hasScanned, setHasScanned] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null
  )
  const [workflowId, setWorkflowId] = useState(
    () => options.sessionId ?? createWorkflowId()
  )
  const [missingSession, setMissingSession] = useState(false)
  const [visaFolderName, setVisaFolderName] = useState("")
  const [visaFolderId, setVisaFolderId] = useState("")
  const [visaFolderMissing, setVisaFolderMissing] = useState(false)
  const [rawFolderId, setRawFolderId] = useState("")
  const [rawFolderMissing, setRawFolderMissing] = useState(false)
  const [rawFolderFiles, setRawFolderFiles] = useState<GoogleDriveFile[]>([])
  const scannedDriveFilesRef = useRef<DriveFileIndex>(new Map())
  const generatedDriveFilesRef = useRef<Map<string, GoogleDriveFile[]>>(
    new Map()
  )
  const sessionFolderRef = useRef<GoogleDriveFile | null>(null)

  const activeDocTypes = useMemo(
    () => config.docTypes.filter((docType) => docType.active),
    [config.docTypes]
  )
  const docTypesById = useMemo(
    () => new Map(activeDocTypes.map((docType) => [docType.id, docType])),
    [activeDocTypes]
  )
  const latestSession = sessions[0]
  const photoDocument = activeDocTypes.find(
    (docType) => docType.category === "gdoc_photos"
  )
  const photoState = photoDocument
    ? documents.find((document) => document.docTypeId === photoDocument.id)
    : undefined
  const photoFiles = photoState?.matchedFiles ?? []
  const currentPhotoFile = photoFiles[photoIndex]
  const currentCaption = currentPhotoFile
    ? photoState?.captions.find(
        (caption) => caption.fileName === currentPhotoFile
      )
    : undefined
  const draftSession = draftSessionId
    ? sessions.find((session) => session.id === draftSessionId)
    : undefined
  const currentStepLabel =
    STEP_ITEMS.find((step) => step.id === normalizeWorkflowStep(currentStep))
      ?.label ?? "Workflow"
  const sentSessionsCount = sessions.filter(
    (session) => session.status === "sent"
  ).length
  const pendingSessionsCount = sessions.filter(
    (session) => session.status === "draft"
  ).length
  const selectedRootFolderId =
    config.googleDriveRootFolderId ?? readGoogleDriveDefaultRootFolderId() ?? ""
  const selectedRootFolderName = config.googleDriveRootFolderName

  useEffect(() => {
    const storedConfig = readStoredJson<VisaConfig>(
      VISA_CONFIG_KEY,
      EMPTY_CONFIG
    )
    const storedSessions = readStoredJson<VisaSessionRecord[]>(
      VISA_SESSIONS_KEY,
      []
    )
    const targetSession = options.sessionId
      ? storedSessions.find((session) => session.id === options.sessionId)
      : undefined

    const nextDocuments = targetSession
      ? buildWorkflowDocumentsFromSession(storedConfig, targetSession)
      : buildWorkflowDocuments(storedConfig, storedSessions)

    const nextHasScanned = nextDocuments.some(
      (document) => document.matchedFiles.length > 0
    )
    const nextHasGenerated = nextDocuments.some(
      (document) => document.generatedFiles.length > 0
    )

    setConfig(storedConfig)
    setSessions(storedSessions)
    setDocuments(nextDocuments)
    setWorkflowId(targetSession?.id ?? options.sessionId ?? createWorkflowId())
    setMissingSession(Boolean(options.sessionId && !targetSession))
    setCurrentStep(normalizeWorkflowStep(targetSession?.currentStep))
    setDraftDate(targetSession?.draftDate ?? todayIso())
    setSelectedFromDate(startOfMonthIso())
    setSelectedToDate(todayIso())
    setDraftSessionId(targetSession?.id ?? null)
    setEmailPreview(
      targetSession
        ? buildEmailBody({
            config: storedConfig,
            documents: targetSession.documents,
          })
        : ""
    )
    setHasScanned(nextHasScanned)
    setHasGenerated(nextHasGenerated)
    setDraftReady(Boolean(targetSession?.status === "draft"))
    setPhotoIndex(0)
    setRootFolderInput(
      storedConfig.googleDriveRootFolderId ??
        readGoogleDriveDefaultRootFolderId() ??
        ""
    )
    setRootFolderError("")
    setVisaFolderName("")
    setVisaFolderId("")
    setVisaFolderMissing(false)
    setRawFolderId("")
    setRawFolderMissing(false)
    setRawFolderFiles([])
    scannedDriveFilesRef.current = new Map()
    generatedDriveFilesRef.current = new Map()
    sessionFolderRef.current = null
    setHydrated(true)
  }, [options.sessionId])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    writeStoredJson(VISA_CONFIG_KEY, config)
  }, [config, hydrated])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    writeStoredJson(VISA_SESSIONS_KEY, sessions)
  }, [hydrated, sessions])

  function appendSeedLog(message: string) {
    setSeedLogs((currentLogs) => [
      ...currentLogs,
      `${new Date().toLocaleTimeString()} ${message}`,
    ])
  }

  function appendLog(step: StepWithLogs, message: string) {
    setLogs((currentLogs) => ({
      ...currentLogs,
      [step]: [
        ...currentLogs[step],
        `${new Date().toLocaleTimeString()} ${message}`,
      ],
    }))
  }

  function resolveRootFolderId(currentConfig = config) {
    const configuredRootFolderId = currentConfig.googleDriveRootFolderId?.trim()

    if (configuredRootFolderId) {
      return configuredRootFolderId
    }

    const defaultRootFolderId = readGoogleDriveDefaultRootFolderId()

    if (defaultRootFolderId) {
      return defaultRootFolderId
    }

    throw new Error(
      "Select a Google Drive root folder in step 1 or set VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID."
    )
  }

  function resetWorkflow(nextConfig = config, nextSessions = sessions) {
    startTransition(() => {
      setDocuments(buildWorkflowDocuments(nextConfig, nextSessions))
      setCurrentStep(1)
      setLogs(createInitialLogs())
      setDraftDate(todayIso())
      setSelectedFromDate(startOfMonthIso())
      setSelectedToDate(todayIso())
      setDraftSessionId(null)
      setEmailPreview("")
      setHasScanned(false)
      setHasGenerated(false)
      setDraftReady(false)
      setPhotoIndex(0)
      setWorkflowId(createWorkflowId())
      setMissingSession(false)
      setVisaFolderName("")
      setVisaFolderId("")
      setVisaFolderMissing(false)
      setRawFolderId("")
      setRawFolderMissing(false)
      setRawFolderFiles([])
      scannedDriveFilesRef.current = new Map()
      generatedDriveFilesRef.current = new Map()
      sessionFolderRef.current = null
    })
  }

  function getScannedDriveFile(fileName: string) {
    return scannedDriveFilesRef.current.get(fileName)?.[0]
  }

  function getGeneratedDriveFile(docTypeId: string, fileName: string) {
    return generatedDriveFilesRef.current
      .get(docTypeId)
      ?.find((file) => file.name === fileName)
  }

  function updateDocument(
    docTypeId: string,
    updater: (current: WorkflowDocumentState) => WorkflowDocumentState
  ) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.docTypeId === docTypeId ? updater(document) : document
      )
    )
  }

  function updateConfigEmail<K extends keyof VisaConfig["email"]>(
    field: K,
    value: VisaConfig["email"][K]
  ) {
    setConfig((currentConfig) => ({
      ...currentConfig,
      email: {
        ...currentConfig.email,
        [field]: value,
      },
    }))
  }

  async function selectRootFolder(folderIdOrUrl = rootFolderInput) {
    const nextRootFolderId = normalizeGoogleDriveFolderId(folderIdOrUrl)

    setRootFolderError("")

    if (!nextRootFolderId) {
      setRootFolderError("Paste a Google Drive folder URL or folder ID first.")
      return
    }

    appendSeedLog("Verifying selected Google Drive root folder.")

    try {
      const folder = await readGoogleDriveFileMetadata(nextRootFolderId)

      if (folder.mimeType !== GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
        throw new Error("The selected Drive item is not a folder.")
      }

      const nextConfig: VisaConfig = {
        ...config,
        googleDriveRootFolderId: folder.id,
        googleDriveRootFolderName: folder.name,
      }

      setConfig(nextConfig)
      setRootFolderInput(folder.id)
      appendSeedLog(`Using ${folder.name} as the Google Drive root folder.`)

      if (
        folder.id !== config.googleDriveRootFolderId &&
        config.docTypes.length
      ) {
        resetWorkflow(nextConfig, sessions)
      }
    } catch (error) {
      const message = formatActionError(error)
      setRootFolderError(message)
      appendSeedLog(`Root folder verification failed: ${message}`)
    }
  }

  async function runSeedReview() {
    setSeedLogs([])
    setSeedError("")
    appendSeedLog("Authorizing Google Drive access.")

    let driveDocumentList = seedSource

    try {
      driveDocumentList = await readGoogleDriveDocumentList()
      setSeedSource(driveDocumentList)
      appendSeedLog("Read the latest Document list from Google Drive.")
    } catch (error) {
      const message = formatActionError(error)
      setSeedError(message)
      appendSeedLog(`Drive read failed: ${message}`)
      return
    }

    appendSeedLog("Parsing Drive document table rows.")
    await wait()

    const parsed = parseDocumentList(driveDocumentList)

    if (!parsed.length) {
      setSeedError("Document list parse failed. Inspect the raw content below.")
      appendSeedLog("Parse failed. No valid document rows detected.")
      return
    }

    setSeedReview(
      parsed.map((docType) => ({
        ...docType,
        active:
          docType.number === 4 || docType.number === 7 || docType.number === 8,
      }))
    )
    appendSeedLog(`Parsed ${parsed.length} document definitions for review.`)
  }

  function toggleSeedReviewDocType(docTypeId: string, active: boolean) {
    setSeedReview((currentDocTypes) =>
      currentDocTypes.map((currentDocType) =>
        currentDocType.id === docTypeId
          ? { ...currentDocType, active }
          : currentDocType
      )
    )
  }

  function saveSeedReview() {
    const nextDocTypes = seedReview.length
      ? seedReview
      : createSeededConfig(seedSource).docTypes
    const nextConfig: VisaConfig = {
      ...config,
      docTypes: nextDocTypes,
      seededAt: new Date().toISOString(),
    }

    setConfig(nextConfig)
    setShowSettings(false)
    resetWorkflow(nextConfig, sessions)
  }

  function handleDateChange(
    docTypeId: string,
    key: "date" | "from" | "to",
    value: string
  ) {
    updateDocument(docTypeId, (document) => {
      if (document.dates.mode === "single") {
        return {
          ...document,
          dates: {
            mode: "single",
            date: value,
          },
          validationMessage: "",
        }
      }

      return {
        ...document,
        dates: {
          mode: "range",
          from: key === "from" ? value : document.dates.from,
          to: key === "to" ? value : document.dates.to,
        },
        validationMessage: "",
      }
    })
  }

  async function runScan() {
    if (!selectedFromDate || !selectedToDate) {
      appendLog(2, "Set both from and to dates before continuing.")
      return
    }

    if (
      new Date(selectedFromDate).getTime() > new Date(selectedToDate).getTime()
    ) {
      appendLog(2, "From date must be on or before the to date.")
      return
    }

    setLogs((currentLogs) => ({
      ...currentLogs,
      2: [],
    }))
    setHasScanned(false)
    setVisaFolderMissing(false)
    setRawFolderMissing(false)
    setRawFolderFiles([])
    setRawFolderId("")
    setVisaFolderId("")
    setVisaFolderName("")

    appendLog(2, "Authorizing Google Drive access.")

    let rootFolderId = ""
    const expectedFolderName = createVisaFolderNameFromToDate(selectedToDate)

    if (!expectedFolderName) {
      appendLog(2, "Selected to date is invalid. Update the date and retry.")
      return
    }

    setVisaFolderName(expectedFolderName)

    try {
      rootFolderId = resolveRootFolderId()
      appendLog(
        2,
        `Looking for folder ${expectedFolderName} under the selected root folder.`
      )
      const rootFolders = await listGoogleDriveFolders(rootFolderId)
      const matchedVisaFolder = rootFolders.find(
        (folder) =>
          folder.name === expectedFolderName ||
          folder.name.startsWith(`${expectedFolderName}-`)
      )

      if (!matchedVisaFolder) {
        setVisaFolderMissing(true)
        appendLog(
          2,
          `No matching folder found. Create ${expectedFolderName} to continue.`
        )
        setHasScanned(true)
        return
      }

      setVisaFolderId(matchedVisaFolder.id)
      setVisaFolderName(matchedVisaFolder.name)
      appendLog(
        2,
        `Found folder ${matchedVisaFolder.name}. Checking for raw folder.`
      )

      const visaSubFolders = await listGoogleDriveFolders(matchedVisaFolder.id)
      const rawFolder = visaSubFolders.find(
        (folder) => folder.name.trim().toLowerCase() === "raw"
      )

      if (!rawFolder) {
        setRawFolderMissing(true)
        appendLog(2, "Raw folder not found under the Visa folder.")
        setHasScanned(true)
        return
      }

      setRawFolderId(rawFolder.id)
      appendLog(2, "Raw folder found. Reading files recursively.")

      const rawFiles = await listGoogleDriveFilesRecursively(rawFolder.id)
      setRawFolderFiles(rawFiles)
      scannedDriveFilesRef.current = createDriveFileIndex(rawFiles)

      appendLog(
        2,
        rawFiles.length
          ? `Detected ${rawFiles.length} raw file(s) for later processing.`
          : "Raw folder is currently empty."
      )
    } catch (error) {
      appendLog(2, `Drive lookup failed: ${formatActionError(error)}`)
      return
    }

    await wait()
    appendLog(2, "Visa folder lookup complete.")
    setHasScanned(true)
  }

  async function createVisaFolderFromSelectedDate() {
    const expectedFolderName = createVisaFolderNameFromToDate(selectedToDate)

    if (!expectedFolderName) {
      appendLog(2, "Selected to date is invalid. Update the date and retry.")
      return
    }

    try {
      const rootFolderId = resolveRootFolderId()
      appendLog(2, `Creating folder ${expectedFolderName}.`)
      const folder = await createGoogleDriveFolder(
        expectedFolderName,
        rootFolderId
      )
      setVisaFolderMissing(false)
      setVisaFolderName(folder.name)
      setVisaFolderId(folder.id)
      appendLog(2, `Created folder ${folder.name}.`)
    } catch (error) {
      appendLog(2, `Failed to create Visa folder: ${formatActionError(error)}`)
    }
  }

  function continueAfterScan() {
    setCurrentStep(2)
  }

  useEffect(() => {
    if (!currentPhotoFile || !photoDocument || !photoState) {
      return
    }

    const existing = photoState.captions.find(
      (caption) => caption.fileName === currentPhotoFile
    )

    if (existing) {
      return
    }

    const defaultDate =
      photoState.dates.mode === "single" ? photoState.dates.date : todayIso()
    const nextCaption: PhotoCaption = {
      id: createCaptionId(currentPhotoFile),
      fileName: currentPhotoFile,
      date: defaultDate,
      people: "",
      description: "",
      formattedCaption: "",
      skipped: false,
    }

    updateDocument(photoDocument.id, (document) => ({
      ...document,
      captions: [...document.captions, nextCaption],
    }))
  }, [currentPhotoFile, photoDocument, photoState])

  function updateCurrentCaption(
    field: keyof Omit<PhotoCaption, "id" | "fileName">,
    value: string | boolean
  ) {
    if (!photoDocument || !currentPhotoFile) {
      return
    }

    updateDocument(photoDocument.id, (document) => ({
      ...document,
      captions: document.captions.map((caption) =>
        caption.fileName === currentPhotoFile
          ? {
              ...caption,
              [field]: value,
            }
          : caption
      ),
    }))
  }

  function formatCaptionWithAi() {
    if (!currentCaption) {
      return
    }

    const formattedCaption = `${formatCaptionDate(currentCaption.date)}: ${currentCaption.people || "Names"} + ${currentCaption.description || "Description"}`
    updateCurrentCaption("formattedCaption", formattedCaption)
  }

  function saveCaptionAndContinue() {
    if (!photoDocument || !currentPhotoFile) {
      return
    }

    updateDocument(photoDocument.id, (document) => ({
      ...document,
      status: "detected",
    }))

    if (photoIndex < photoFiles.length - 1) {
      setPhotoIndex((currentIndex) => currentIndex + 1)
      return
    }

    setCurrentStep(3)
  }

  function skipCurrentPhoto() {
    updateCurrentCaption("skipped", true)
    saveCaptionAndContinue()
  }

  async function generateDocuments() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      3: [],
    }))
    setHasGenerated(false)
    const nextDraftDate = todayIso()

    setDraftDate(nextDraftDate)
    appendLog(3, "Authorizing Google Drive access.")

    const nextFolderName = createSessionFolderName(nextDraftDate)

    try {
      const rootFolderId = resolveRootFolderId()
      appendLog(3, `Creating Drive subfolder ${nextFolderName}.`)
      const sessionFolder = await createGoogleDriveFolder(
        nextFolderName,
        rootFolderId
      )
      sessionFolderRef.current = sessionFolder
      generatedDriveFilesRef.current = new Map()

      const nextDocuments: WorkflowDocumentState[] = []

      for (const document of documents) {
        const docType = docTypesById.get(document.docTypeId)

        if (!docType) {
          nextDocuments.push(document)
          continue
        }

        if (docType.category === "upload") {
          const sourceFiles = document.matchedFiles
            .map((fileName) => getScannedDriveFile(fileName))
            .filter((file): file is GoogleDriveFile => Boolean(file))

          if (!sourceFiles.length) {
            appendLog(
              3,
              `${docType.label}: skipped because no source files were detected.`
            )
            nextDocuments.push({
              ...document,
              generatedFiles: [],
              generatedDocId: undefined,
              status: "skipped",
            })
            continue
          }

          const copiedFiles: GoogleDriveFile[] = []

          for (const sourceFile of sourceFiles) {
            const nextFileName =
              sourceFile.name.startsWith(`${docType.number} `) ||
              sourceFile.name.startsWith(`${docType.number} -`)
                ? sourceFile.name
                : `${docType.number} - ${sourceFile.name}`
            const copiedFile = await copyGoogleDriveFile({
              fileId: sourceFile.id,
              name: nextFileName,
              parentId: sessionFolder.id,
            })

            copiedFiles.push(copiedFile)
          }

          generatedDriveFilesRef.current.set(docType.id, copiedFiles)
          appendLog(
            3,
            `${docType.label}: copied ${copiedFiles.length} upload attachment(s) into ${sessionFolder.name}.`
          )
          nextDocuments.push({
            ...document,
            generatedFiles: copiedFiles.map((file) => file.name),
            generatedDocId: undefined,
            status: "ready",
          })
          continue
        }

        if (docType.category === "gdoc_photos") {
          const usableCaptions = document.captions.filter(
            (caption) => !caption.skipped
          )

          if (!usableCaptions.length) {
            appendLog(
              3,
              `${docType.label}: skipped because no photo captions were saved.`
            )
            nextDocuments.push({
              ...document,
              generatedFiles: [],
              generatedDocId: undefined,
              status: "skipped",
            })
            continue
          }

          const googleDoc = await createGoogleDocInDrive({
            name: `${docType.number} - ${docType.label}`,
            parentId: sessionFolder.id,
            content: buildGeneratedDocumentContent(docType, document),
          })

          generatedDriveFilesRef.current.set(docType.id, [googleDoc])
          appendLog(
            3,
            `${docType.label}: generated Google Doc with ${usableCaptions.length} captions.`
          )
          nextDocuments.push({
            ...document,
            generatedFiles: [googleDoc.name],
            generatedDocId: googleDoc.id,
            status: "ready",
          })
          continue
        }

        const googleDoc = await createGoogleDocInDrive({
          name: `${docType.number} - ${docType.label}`,
          parentId: sessionFolder.id,
          content: buildGeneratedDocumentContent(docType, document),
        })

        generatedDriveFilesRef.current.set(docType.id, [googleDoc])
        appendLog(
          3,
          `${docType.label}: generated Google Doc using ${formatDateLabel(document.dates)}.`
        )
        nextDocuments.push({
          ...document,
          generatedFiles: [googleDoc.name],
          generatedDocId: googleDoc.id,
          status: document.matchedFiles.length ? "ready" : "pending",
        })
      }

      setDocuments(nextDocuments)
      appendLog(3, "Document generation complete.")
      setHasGenerated(true)
      setCurrentStep(4)
    } catch (error) {
      appendLog(3, `Document generation failed: ${formatActionError(error)}`)
    }
  }

  async function createDraft() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      4: [],
    }))

    const existingSession = sessions.find(
      (session) => session.id === workflowId
    )
    const sessionId = draftSessionId ?? workflowId
    const draftSessionRecord = createSessionRecord({
      id: sessionId,
      config,
      documents,
      draftDate,
      status: "draft",
      filesMoved: false,
      currentStep: 5,
      createdAt: existingSession?.createdAt,
    })
    const preview = buildEmailBody({
      config,
      documents: draftSessionRecord.documents,
    })

    setWorkflowId(sessionId)
    setDraftSessionId(sessionId)
    setEmailPreview(preview)
    appendLog(
      4,
      `Building Gmail draft subject: ${createEmailSubject(draftDate)}.`
    )
    await wait()

    for (const document of draftSessionRecord.documents) {
      for (const fileName of document.filenames) {
        const driveFile =
          getGeneratedDriveFile(document.docTypeId, fileName) ??
          getScannedDriveFile(fileName)

        if (!driveFile) {
          appendLog(
            4,
            `Skipping ${fileName}; no matching Drive file metadata is available.`
          )
          continue
        }

        try {
          await downloadGoogleDriveFileAsBase64(driveFile)
          appendLog(4, `Downloaded ${fileName} from Drive as base64.`)
        } catch (error) {
          appendLog(
            4,
            `Failed to download ${fileName} from Drive: ${formatActionError(error)}`
          )
        }

        await wait(120)
      }
    }

    appendLog(4, "Sending payload to Gmail draft adapter.")
    await wait()
    appendLog(
      4,
      "Draft created. Verify the Gmail drafts folder if anything looks uncertain."
    )
    setSessions((currentSessions) =>
      upsertSession(currentSessions, draftSessionRecord)
    )
    setDraftReady(true)
    setCurrentStep(5)
  }

  async function markEmailSent() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      5: [],
    }))

    const existingSession = sessions.find(
      (session) => session.id === workflowId
    )
    const submittedAt = new Date().toISOString()
    const sentRecord = createSessionRecord({
      id: draftSessionId ?? workflowId,
      config,
      documents,
      draftDate,
      status: "sent",
      filesMoved: true,
      currentStep: 5,
      createdAt: existingSession?.createdAt,
      submittedAt,
    })

    appendLog(
      5,
      `Recording sent session for ${formatDisplayDate(submittedAt)}.`
    )
    await wait()
    appendLog(
      5,
      `Renaming folder to ${sentRecord.folderName} if the submitted date changed.`
    )
    await wait()

    if (sessionFolderRef.current) {
      try {
        const rootFolderId = resolveRootFolderId()
        appendLog(
          5,
          "Moving generated files back to the configured Google Drive root folder."
        )

        for (const files of generatedDriveFilesRef.current.values()) {
          for (const file of files) {
            await moveGoogleDriveFile({
              fileId: file.id,
              addParentId: rootFolderId,
              removeParentIds: sessionFolderRef.current.parents?.length
                ? sessionFolderRef.current.parents
                : [sessionFolderRef.current.id],
            })
          }
        }

        await wait()
      } catch (error) {
        appendLog(5, `Drive move failed: ${formatActionError(error)}`)
      }
    } else {
      appendLog(
        5,
        "Skipping Drive move because no active session folder is attached to this browser session."
      )
    }

    appendLog(5, "Session closed with status sent.")
    setSessions((currentSessions) => upsertSession(currentSessions, sentRecord))
    setWorkflowId(sentRecord.id)
    setDraftSessionId(sentRecord.id)
    setDraftReady(true)
    setCurrentStep(5)
  }

  function saveWorkflow() {
    const existingSession = sessions.find(
      (session) => session.id === workflowId
    )
    const nextSession = createSessionRecord({
      id: workflowId,
      config,
      documents,
      draftDate,
      status: "draft",
      filesMoved: false,
      currentStep,
      createdAt: existingSession?.createdAt,
    })

    setSessions((currentSessions) =>
      upsertSession(currentSessions, nextSession)
    )
    setDraftSessionId(nextSession.id)
    setDraftReady(true)

    if (currentStep >= 4) {
      setEmailPreview(
        buildEmailBody({
          config,
          documents: nextSession.documents,
        })
      )
    }
  }

  function markSessionSent(sessionId: string) {
    setSessions((currentSessions) => {
      const currentSession = currentSessions.find(
        (session) => session.id === sessionId
      )

      if (!currentSession || currentSession.status === "sent") {
        return currentSessions
      }

      const submittedAt = new Date().toISOString()
      const nextSession: VisaSessionRecord = {
        ...currentSession,
        updatedAt: submittedAt,
        submittedAt,
        folderName: createSessionFolderName(submittedAt),
        emailSubject: createEmailSubject(submittedAt),
        status: "sent",
        filesMoved: true,
        currentStep: 5,
      }

      return upsertSession(currentSessions, nextSession)
    })
  }

  function startNextSession() {
    resetWorkflow(config, sessions)
  }

  function toggleExpandedHistory(sessionId: string) {
    setExpandedHistoryId((currentId) =>
      currentId === sessionId ? null : sessionId
    )
  }

  return {
    activeDocTypes,
    closeHistory: () => setShowHistory(false),
    closeSettings: () => setShowSettings(false),
    config,
    continueAfterScan,
    createDraft,
    currentCaption,
    currentPhotoFile,
    currentStep,
    currentStepLabel,
    documents,
    draftDate,
    draftReady,
    draftSession,
    emailPreview,
    expandedHistoryId,
    formatCaptionWithAi,
    generateDocuments,
    goToDraftStep: () => setCurrentStep(4),
    goToDoneStep: () => setCurrentStep(5),
    handleDateChange,
    hasGenerated,
    hasScanned,
    hydrated,
    logs,
    selectedFromDate,
    selectedToDate,
    setSelectedFromDate,
    setSelectedToDate,
    latestSession,
    markEmailSent,
    markSessionSent,
    missingSession,
    openHistory: () => setShowHistory(true),
    openSettings: () => setShowSettings(true),
    pendingSessionsCount,
    photoFiles,
    photoIndex,
    saveWorkflow,
    saveCaptionAndContinue,
    saveSeedReview,
    seedError,
    seedLogs,
    rootFolderError,
    visaFolderName,
    visaFolderId,
    visaFolderMissing,
    rawFolderId,
    rawFolderMissing,
    rawFolderFiles,
    rootFolderInput,
    seedReview,
    seedSource,
    sentSessionsCount,
    selectedRootFolderId,
    selectedRootFolderName,
    sessions,
    setSeedSource,
    setRootFolderInput,
    showHistory,
    showSettings,
    skipCurrentPhoto,
    skipPhotoStep: () => setCurrentStep(3),
    startNextSession,
    selectRootFolder,
    toggleExpandedHistory,
    toggleSeedReviewDocType,
    updateConfigEmail,
    updateCurrentCaption,
    workflowId,
    runScan,
    createVisaFolderFromSelectedDate,
    runSeedReview,
  }
}

type VisaWorkflowContextValue = ReturnType<typeof useVisaWorkflowState>

const VisaWorkflowContext = createContext<VisaWorkflowContextValue | null>(null)

export function VisaWorkflowProvider({ children }: { children: ReactNode }) {
  const value = useVisaWorkflowState()

  return (
    <VisaWorkflowContext.Provider value={value}>
      {children}
    </VisaWorkflowContext.Provider>
  )
}

export function VisaWorkflowRouteProvider({
  children,
  sessionId,
}: {
  children: ReactNode
  sessionId?: string
}) {
  const value = useVisaWorkflowState({ sessionId })

  return (
    <VisaWorkflowContext.Provider value={value}>
      {children}
    </VisaWorkflowContext.Provider>
  )
}

export function useVisaWorkflow() {
  const context = useContext(VisaWorkflowContext)

  if (!context) {
    throw new Error("useVisaWorkflow must be used within VisaWorkflowProvider")
  }

  return context
}
