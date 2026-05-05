import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { readStoredJson, writeStoredJson } from "@/lib/browser-storage"
import {
  DEFAULT_EMAIL_CONFIG,
  SAMPLE_DOCUMENT_LIST,
  SAMPLE_DRIVE_FILES,
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
  matchesDocType,
  parseDocumentList,
  validateDocumentDates,
  type DocTypeConfig,
  type DocumentDateValue,
  type PhotoCaption,
  type VisaConfig,
  type VisaSessionRecord,
  type WorkflowDocumentState,
} from "@/lib/visa-workflow"

export type WorkflowStep = 0 | 1 | 2 | 3 | 4 | 5
type StepWithLogs = 1 | 3 | 4 | 5

type LogState = Record<StepWithLogs, string[]>

const STEP_ITEMS = [
  { id: 1, label: "Scan Drive" },
  { id: 2, label: "Photo Captions" },
  { id: 3, label: "Generate Docs" },
  { id: 4, label: "Email Draft" },
  { id: 5, label: "Done" },
] as const

const EMPTY_CONFIG: VisaConfig = {
  email: DEFAULT_EMAIL_CONFIG,
  docTypes: [],
}

function createInitialLogs(): LogState {
  return {
    1: [],
    3: [],
    4: [],
    5: [],
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
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
  const lastSession = sessions.find((session) => session.status === "sent") ?? sessions[0]
  const previousDocuments = new Map(
    lastSession?.documents.map((document) => [document.docTypeId, document]) ?? []
  )

  return config.docTypes
    .filter((docType) => docType.active)
    .map((docType) => {
      const previous = previousDocuments.get(docType.id)

      return createWorkflowDocumentState(docType, {
        docTypeId: docType.id,
        dates: previous ? cloneDates(previous.dates) : createDefaultDateValue(docType.dateFormat),
        matchedFiles: [],
        generatedFiles: [],
        status: "pending",
        validationMessage: "",
        captions: [],
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

function useVisaWorkflowState() {
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
  const [logs, setLogs] = useState<LogState>(createInitialLogs)
  const [draftDate, setDraftDate] = useState(todayIso())
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null)
  const [emailPreview, setEmailPreview] = useState("")
  const [hasScanned, setHasScanned] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

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
    ? photoState?.captions.find((caption) => caption.fileName === currentPhotoFile)
    : undefined
  const draftSession = draftSessionId
    ? sessions.find((session) => session.id === draftSessionId)
    : undefined
  const currentStepLabel =
    currentStep === 0
      ? "Step 0 — Setup"
      : STEP_ITEMS.find((step) => step.id === currentStep)?.label ?? "Workflow"
  const sentSessionsCount = sessions.filter((session) => session.status === "sent").length

  useEffect(() => {
    const storedConfig = readStoredJson<VisaConfig>(VISA_CONFIG_KEY, EMPTY_CONFIG)
    const storedSessions = readStoredJson<VisaSessionRecord[]>(VISA_SESSIONS_KEY, [])

    setConfig(storedConfig)
    setSessions(storedSessions)
    setDocuments(buildWorkflowDocuments(storedConfig, storedSessions))
    setHydrated(true)
  }, [])

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
    setSeedLogs((currentLogs) => [...currentLogs, `${new Date().toLocaleTimeString()} ${message}`])
  }

  function appendLog(step: StepWithLogs, message: string) {
    setLogs((currentLogs) => ({
      ...currentLogs,
      [step]: [...currentLogs[step], `${new Date().toLocaleTimeString()} ${message}`],
    }))
  }

  function resetWorkflow(nextConfig = config, nextSessions = sessions) {
    startTransition(() => {
      setDocuments(buildWorkflowDocuments(nextConfig, nextSessions))
      setCurrentStep(0)
      setLogs(createInitialLogs())
      setDraftDate(todayIso())
      setDraftSessionId(null)
      setEmailPreview("")
      setHasScanned(false)
      setHasGenerated(false)
      setDraftReady(false)
      setPhotoIndex(0)
    })
  }

  function updateDocument(docTypeId: string, updater: (current: WorkflowDocumentState) => WorkflowDocumentState) {
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

  async function runSeedReview() {
    setSeedLogs([])
    setSeedError("")
    appendSeedLog("Reading Document list via Google Drive adapter.")
    await wait()
    appendSeedLog("Parsing Drive document table rows.")
    await wait()

    const parsed = parseDocumentList(seedSource)

    if (!parsed.length) {
      setSeedError("Document list parse failed. Inspect the raw content below.")
      appendSeedLog("Parse failed. No valid document rows detected.")
      return
    }

    setSeedReview(
      parsed.map((docType) => ({
        ...docType,
        active: docType.number === 4 || docType.number === 7 || docType.number === 8,
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
    const nextDocTypes = seedReview.length ? seedReview : createSeededConfig(seedSource).docTypes
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

  function goToScanStep() {
    let hasValidationError = false

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        const docType = docTypesById.get(document.docTypeId)

        if (!docType) {
          return document
        }

        const validationMessage = validateDocumentDates(docType, document)

        if (validationMessage) {
          hasValidationError = true
        }

        return {
          ...document,
          validationMessage,
        }
      })
    )

    if (hasValidationError) {
      return
    }

    setCurrentStep(1)
  }

  async function runScan() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      1: [],
    }))
    setHasScanned(false)

    appendLog(1, "Searching Google Drive for the root folder Documents requested.")
    await wait()

    if (!SAMPLE_DRIVE_FILES.length) {
      appendLog(1, "Warning: root folder not found or returned no files. Scan halted.")
      return
    }

    appendLog(1, `Found ${SAMPLE_DRIVE_FILES.length} files. Matching against configured document types.`)
    await wait()

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        const docType = docTypesById.get(document.docTypeId)

        if (!docType) {
          return document
        }

        const matchedFiles = SAMPLE_DRIVE_FILES.filter((fileName) => matchesDocType(fileName, docType))
        const nextStatus = matchedFiles.length ? "detected" : "pending"

        appendLog(
          1,
          matchedFiles.length
            ? `${docType.label}: detected ${matchedFiles.length} matching file(s).`
            : `${docType.label}: no files matched ${docType.matchPattern}.`
        )

        return {
          ...document,
          matchedFiles,
          generatedFiles: [],
          status: nextStatus,
        }
      })
    )

    await wait()
    appendLog(1, "Drive scan complete.")
    setHasScanned(true)
  }

  function continueAfterScan() {
    if (photoFiles.length) {
      setCurrentStep(2)
      return
    }

    setCurrentStep(3)
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
    appendLog(3, `Creating Drive subfolder ${createSessionFolderName(nextDraftDate)}.`)
    await wait()

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        const docType = docTypesById.get(document.docTypeId)

        if (!docType) {
          return document
        }

        if (docType.category === "upload") {
          if (!document.matchedFiles.length) {
            appendLog(3, `${docType.label}: skipped because no source files were detected.`)
            return {
              ...document,
              generatedFiles: [],
              status: "skipped",
            }
          }

          const generatedFiles = document.matchedFiles.map((fileName) =>
            fileName.startsWith(`${docType.number} `) || fileName.startsWith(`${docType.number} -`)
              ? fileName
              : `${docType.number} - ${fileName}`
          )

          appendLog(3, `${docType.label}: queued ${generatedFiles.length} upload attachment(s).`)
          return {
            ...document,
            generatedFiles,
            status: "ready",
          }
        }

        if (docType.category === "gdoc") {
          const generatedFile = `${docType.number} - ${docType.label}.gdoc`
          appendLog(3, `${docType.label}: generated Google Doc using ${formatDateLabel(document.dates)}.`)
          return {
            ...document,
            generatedFiles: [generatedFile],
            status: document.matchedFiles.length ? "ready" : "pending",
          }
        }

        const usableCaptions = document.captions.filter((caption) => !caption.skipped)

        if (!usableCaptions.length) {
          appendLog(3, `${docType.label}: skipped because no photo captions were saved.`)
          return {
            ...document,
            generatedFiles: [],
            status: "skipped",
          }
        }

        const generatedFile = `${docType.number} - photographs of relationship.gdoc`
        appendLog(3, `${docType.label}: generated Google Doc with ${usableCaptions.length} captions.`)
        return {
          ...document,
          generatedFiles: [generatedFile],
          status: "ready",
        }
      })
    )

    await wait()
    appendLog(3, "Appending generated document lines back to Document list in Drive.")
    await wait()
    appendLog(3, "Document generation complete.")
    setHasGenerated(true)
    setCurrentStep(4)
  }

  async function createDraft() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      4: [],
    }))

    const sessionId = draftSessionId ?? `session_${Date.now()}`
    const draftSessionRecord = createSessionRecord({
      id: sessionId,
      config,
      documents,
      draftDate,
      status: "draft",
      filesMoved: false,
    })
    const preview = buildEmailBody({
      config,
      documents: draftSessionRecord.documents,
    })

    setDraftSessionId(sessionId)
    setEmailPreview(preview)
    appendLog(4, `Building Gmail draft subject: ${createEmailSubject(draftDate)}.`)
    await wait()

    for (const document of draftSessionRecord.documents) {
      for (const fileName of document.filenames) {
        appendLog(4, `Downloading ${fileName} from Drive as base64.`)
        await wait(120)
      }
    }

    appendLog(4, "Sending payload to Gmail draft adapter.")
    await wait()
    appendLog(4, "Draft created. Verify the Gmail drafts folder if anything looks uncertain.")
    setSessions((currentSessions) => upsertSession(currentSessions, draftSessionRecord))
    setDraftReady(true)
    setCurrentStep(5)
  }

  async function markEmailSent() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      5: [],
    }))

    const submittedAt = new Date().toISOString()
    const sentRecord = createSessionRecord({
      id: draftSessionId ?? undefined,
      config,
      documents,
      draftDate,
      status: "sent",
      filesMoved: true,
      submittedAt,
    })

    appendLog(5, `Recording sent session for ${formatDisplayDate(submittedAt)}.`)
    await wait()
    appendLog(5, `Renaming folder to ${sentRecord.folderName} if the submitted date changed.`)
    await wait()
    appendLog(5, "Moving generated files back to the Documents requested root folder.")
    await wait()
    appendLog(5, "Session closed with status sent.")
    setSessions((currentSessions) => upsertSession(currentSessions, sentRecord))
    setDraftReady(true)
  }

  function startNextSession() {
    resetWorkflow(config, sessions)
  }

  function toggleExpandedHistory(sessionId: string) {
    setExpandedHistoryId((currentId) => (currentId === sessionId ? null : sessionId))
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
    goToScanStep,
    goToSetupStep: () => setCurrentStep(0),
    handleDateChange,
    hasGenerated,
    hasScanned,
    hydrated,
    logs,
    latestSession,
    markEmailSent,
    openHistory: () => setShowHistory(true),
    openSettings: () => setShowSettings(true),
    photoFiles,
    photoIndex,
    saveCaptionAndContinue,
    saveSeedReview,
    seedError,
    seedLogs,
    seedReview,
    seedSource,
    sentSessionsCount,
    sessions,
    setSeedSource,
    showHistory,
    showSettings,
    skipCurrentPhoto,
    skipPhotoStep: () => setCurrentStep(3),
    startNextSession,
    toggleExpandedHistory,
    toggleSeedReviewDocType,
    updateConfigEmail,
    updateCurrentCaption,
    runScan,
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

export function useVisaWorkflow() {
  const context = useContext(VisaWorkflowContext)

  if (!context) {
    throw new Error("useVisaWorkflow must be used within VisaWorkflowProvider")
  }

  return context
}