import {
  CheckCheck,
  ChevronRight,
  FolderSearch,
  History,
  Mail,
  RefreshCcw,
  Settings2,
  Sparkles,
} from "lucide-react"
import { startTransition, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: App })

type WorkflowStep = 0 | 1 | 2 | 3 | 4 | 5
type StepWithLogs = 1 | 3 | 4 | 5

type LogState = Record<StepWithLogs, string[]>

declare global {
  interface Window {
    storage?: Storage
  }
}

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

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return undefined
  }

  window.storage ??= window.localStorage

  return window.storage
}

function readStoredJson<T>(key: string, fallback: T) {
  const storage = getBrowserStorage()

  if (!storage) {
    return fallback
  }

  const rawValue = storage.getItem(key)

  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

function writeStoredJson<T>(key: string, value: T) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(value))
}

function formatDisplayDate(dateValue?: string) {
  if (!dateValue) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue))
}

function formatCaptionDate(dateValue: string) {
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

function App() {
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

  function updateConfigEmail<K extends keyof VisaConfig["email"]>(field: K, value: VisaConfig["email"][K]) {
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

  function updateCurrentCaption(field: keyof Omit<PhotoCaption, "id" | "fileName">, value: string | boolean) {
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

  if (!hydrated) {
    return (
      <main className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-6 py-12">
        <div className="panel w-full max-w-lg p-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Visa Workflow</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Preparing workspace</h1>
          <p className="mt-3 text-sm text-muted-foreground">Loading saved configuration and submission history.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-30 rounded-[2rem] border border-border/70 bg-background/88 px-4 py-4 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Visa Document Workflow</p>
            <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">Monthly support pack automation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Google Drive and Gmail API ready, with local persistent review state.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {sessions.filter((session) => session.status === "sent").length} sent
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings2 />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          {config.docTypes.length === 0 ? (
            <section className="panel p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Config</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold">First-run setup</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Seed document types from the Drive-based Document list, review which ones stay active in the recurring workflow, and save the email metadata used for drafts.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="To email">
                  <input
                    className="field"
                    value={config.email.toEmail}
                    onChange={(event) => updateConfigEmail("toEmail", event.target.value)}
                    placeholder="visa.case@example.com"
                  />
                </Field>
                <Field label="CC email">
                  <input
                    className="field"
                    value={config.email.ccEmail}
                    onChange={(event) => updateConfigEmail("ccEmail", event.target.value)}
                    placeholder="partner@example.com"
                  />
                </Field>
                <Field label="Greeting">
                  <input
                    className="field"
                    value={config.email.greeting}
                    onChange={(event) => updateConfigEmail("greeting", event.target.value)}
                  />
                </Field>
                <Field label="Sign-off">
                  <input
                    className="field"
                    value={config.email.signOff}
                    onChange={(event) => updateConfigEmail("signOff", event.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-border/70 bg-card/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Seed Step</p>
                    <h3 className="mt-1 font-heading text-xl font-semibold">Document list source</h3>
                  </div>
                  <Button onClick={runSeedReview}>
                    <FolderSearch />
                    Read from Drive
                  </Button>
                </div>
                <textarea
                  className="field mt-4 min-h-48 resize-y font-mono text-xs leading-6"
                  value={seedSource}
                  onChange={(event) => setSeedSource(event.target.value)}
                />
                {seedError ? (
                  <div className="mt-4 rounded-3xl border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
                    <p className="font-medium">{seedError}</p>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-foreground">
                      {seedSource}
                    </pre>
                  </div>
                ) : null}
                <LogPanel title="Seed log" entries={seedLogs} emptyMessage="Seed activity will appear here." className="mt-4" />
              </div>

              {seedReview.length ? (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review</p>
                      <h3 className="mt-1 font-heading text-xl font-semibold">Recurring document types</h3>
                    </div>
                    <Button onClick={saveSeedReview}>
                      <CheckCheck />
                      Save config
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    {seedReview.map((docType) => (
                      <article key={docType.id} className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                #{docType.number}
                              </span>
                              <StatusBadge status={docType.active ? "ready" : "skipped"} />
                            </div>
                            <h4 className="mt-3 font-medium">{docType.label}</h4>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              {docType.category} • {docType.dateFormat} • {docType.matchPattern}
                            </p>
                          </div>
                          <label className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={docType.active}
                              onChange={(event) => {
                                setSeedReview((currentDocTypes) =>
                                  currentDocTypes.map((currentDocType) =>
                                    currentDocType.id === docType.id
                                      ? { ...currentDocType, active: event.target.checked }
                                      : currentDocType
                                  )
                                )
                              }}
                            />
                            Include in recurring workflow
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : (
            <>
              <section className="panel overflow-hidden p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Workflow</p>
                    <h2 className="mt-2 font-heading text-3xl font-semibold">{currentStep === 0 ? "Step 0 — Setup" : STEP_ITEMS.find((step) => step.id === currentStep)?.label}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {currentStep === 0
                        ? "Each recurring document type keeps its own date history. Confirm the defaults before scanning Google Drive."
                        : "The workflow keeps draft and sent sessions in persistent local history while remaining ready for Drive and Gmail API wiring."}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/70 bg-secondary/80 px-4 py-3 text-sm text-secondary-foreground">
                    <p>Last session</p>
                    <p className="mt-1 font-medium">
                      {latestSession?.submittedAt
                        ? `${formatDisplayDate(latestSession.submittedAt)} • ${latestSession.documents.length} docs`
                        : "No previous submissions"}
                    </p>
                  </div>
                </div>

                {currentStep >= 1 ? <StepProgress currentStep={currentStep} photoStepEnabled={Boolean(photoFiles.length)} /> : null}

                {currentStep === 0 ? (
                  <div className="mt-8 space-y-4">
                    {activeDocTypes.map((docType) => {
                      const document = documents.find((currentDocument) => currentDocument.docTypeId === docType.id)

                      if (!document) {
                        return null
                      }

                      return (
                        <article key={docType.id} className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                  #{docType.number}
                                </span>
                                <StatusBadge status={document.status} />
                              </div>
                              <h3 className="mt-3 font-medium">{docType.label}</h3>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                {docType.category} • {docType.dateFormat}
                              </p>
                            </div>
                            <div className="min-w-56 rounded-[1.5rem] border border-border/70 bg-background/80 px-4 py-3 text-sm">
                              <p className="text-muted-foreground">Last used</p>
                              <p className="mt-1 font-medium">
                                {latestSession?.documents.find((item) => item.docTypeId === docType.id)?.dateLabel ?? "No prior value"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {document.dates.mode === "single" ? (
                              <Field label={docType.category === "gdoc_photos" ? "Default photo date" : "Date"}>
                                <input
                                  type="date"
                                  className="field"
                                  value={document.dates.date}
                                  onChange={(event) => handleDateChange(docType.id, "date", event.target.value)}
                                />
                              </Field>
                            ) : (
                              <>
                                <Field label="From date">
                                  <input
                                    type="date"
                                    className="field"
                                    value={document.dates.from}
                                    onChange={(event) => handleDateChange(docType.id, "from", event.target.value)}
                                  />
                                </Field>
                                <Field label="To date">
                                  <input
                                    type="date"
                                    className="field"
                                    value={document.dates.to}
                                    onChange={(event) => handleDateChange(docType.id, "to", event.target.value)}
                                  />
                                </Field>
                              </>
                            )}
                          </div>

                          {document.validationMessage ? (
                            <p className="mt-4 text-sm text-destructive">{document.validationMessage}</p>
                          ) : null}
                        </article>
                      )
                    })}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-secondary/40 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-secondary-foreground">Email config</p>
                        <p className="text-sm text-muted-foreground">
                          To {config.email.toEmail || "not set"} • CC {config.email.ccEmail || "not set"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setShowSettings(true)}>
                          <Settings2 />
                          Edit settings
                        </Button>
                        <Button onClick={goToScanStep}>
                          Continue to scan
                          <ChevronRight />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentStep === 1 ? (
                  <div className="mt-8 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                        Scan the Documents requested Drive tree, auto-match files against the seeded patterns, and confirm whether photo captioning is needed.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setCurrentStep(0)}>
                          Back to setup
                        </Button>
                        <Button onClick={runScan}>
                          <FolderSearch />
                          Scan Drive
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {activeDocTypes.map((docType) => {
                        const document = documents.find((currentDocument) => currentDocument.docTypeId === docType.id)

                        if (!document) {
                          return null
                        }

                        return (
                          <div key={docType.id} className="rounded-[1.5rem] border border-border/70 bg-card/80 px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{document.matchedFiles.length || 0} file(s) matched</p>
                              </div>
                              <StatusBadge status={document.status} />
                            </div>
                            {document.matchedFiles.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {document.matchedFiles.map((fileName) => (
                                  <span key={fileName} className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                                    {fileName}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    <LogPanel title="Drive scan log" entries={logs[1]} emptyMessage="Scan output will stream here." />
                    {hasScanned ? (
                      <div className="flex justify-end">
                        <Button onClick={continueAfterScan}>
                          {photoFiles.length ? "Continue to photo captions" : "Skip to generate documents"}
                          <ChevronRight />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="mt-8 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {photoFiles.length ? `Photo ${photoIndex + 1} of ${photoFiles.length}` : "No photos detected."}
                        </p>
                        <h3 className="mt-1 font-heading text-2xl font-semibold">{currentPhotoFile ?? "Relationship photos"}</h3>
                      </div>
                      <Button variant="outline" onClick={() => setCurrentStep(3)}>
                        Skip step
                      </Button>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${photoFiles.length ? ((photoIndex + 1) / photoFiles.length) * 100 : 0}%` }}
                      />
                    </div>

                    {currentCaption ? (
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                        <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Date">
                              <input
                                type="date"
                                className="field"
                                value={currentCaption.date}
                                onChange={(event) => updateCurrentCaption("date", event.target.value)}
                              />
                            </Field>
                            <Field label="People">
                              <input
                                className="field"
                                value={currentCaption.people}
                                onChange={(event) => updateCurrentCaption("people", event.target.value)}
                                placeholder="Names in the photo"
                              />
                            </Field>
                          </div>
                          <Field label="Occasion / description" className="mt-4">
                            <textarea
                              className="field min-h-32 resize-y"
                              value={currentCaption.description}
                              onChange={(event) => updateCurrentCaption("description", event.target.value)}
                              placeholder="Where you were, why it matters, what happened"
                            />
                          </Field>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <Button variant="outline" onClick={formatCaptionWithAi}>
                              <Sparkles />
                              AI format
                            </Button>
                            <Button variant="outline" onClick={skipCurrentPhoto}>
                              Skip photo
                            </Button>
                            <Button onClick={saveCaptionAndContinue}>
                              Save caption
                              <ChevronRight />
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-border/70 bg-secondary/40 p-5">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Preview</p>
                          <h4 className="mt-2 font-heading text-xl font-semibold">Formatted caption</h4>
                          <p className="mt-4 rounded-[1.5rem] border border-border/70 bg-background/80 p-4 text-sm leading-7 text-foreground">
                            {currentCaption.formattedCaption || "Use AI format to preview the caption text saved into the Google Doc."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 text-sm text-muted-foreground">
                        No detected photos require captions. Continue to generation.
                      </div>
                    )}
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="mt-8 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        Generate the session folder, pass through upload files, build Google Docs for dynamic content, and append the result back to the Document list.
                      </p>
                      <Button onClick={generateDocuments}>
                        <Sparkles />
                        Generate documents
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {activeDocTypes.map((docType) => {
                        const document = documents.find((currentDocument) => currentDocument.docTypeId === docType.id)

                        if (!document) {
                          return null
                        }

                        return (
                          <div key={docType.id} className="rounded-[1.5rem] border border-border/70 bg-card/80 px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{formatDateLabel(document.dates)}</p>
                              </div>
                              <StatusBadge status={document.status} />
                            </div>
                            {document.generatedFiles.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {document.generatedFiles.map((fileName) => (
                                  <span key={fileName} className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                                    {fileName}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    <LogPanel title="Generation log" entries={logs[3]} emptyMessage="Generation output will stream here." />
                    {hasGenerated ? (
                      <div className="flex justify-end">
                        <Button onClick={() => setCurrentStep(4)}>
                          Continue to email draft
                          <ChevronRight />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === 4 ? (
                  <div className="mt-8 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Subject will use the draft date while the final sent session identity uses the actual submitted date.
                        </p>
                        <h3 className="mt-1 font-heading text-2xl font-semibold">{createEmailSubject(draftDate)}</h3>
                      </div>
                      <Button onClick={createDraft} disabled={!hasGenerated}>
                        <Mail />
                        Create Gmail draft
                      </Button>
                    </div>
                    <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Email preview</p>
                      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-7 text-foreground">
                        {emailPreview || "Generate documents, then create the draft to preview the final email body and attachments."}
                      </pre>
                    </div>
                    <LogPanel title="Draft log" entries={logs[4]} emptyMessage="Draft activity will stream here." />
                    {draftReady ? (
                      <div className="flex justify-end">
                        <Button onClick={() => setCurrentStep(5)}>
                          Continue to done
                          <ChevronRight />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === 5 ? (
                  <div className="mt-8 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <SummaryTile label="Draft folder" value={draftSession?.folderName ?? createSessionFolderName(draftDate)} />
                      <SummaryTile label="Email subject" value={draftSession?.emailSubject ?? createEmailSubject(draftDate)} />
                      <SummaryTile label="Move files" value={draftSession?.filesMoved ? "Yes" : "Pending"} />
                    </div>
                    <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5">
                      <p className="text-sm leading-6 text-muted-foreground">
                        Send the Gmail draft manually, then close the session to rename the Drive folder, move generated files back to the root, and persist the final sent record.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button onClick={markEmailSent} disabled={!draftReady}>
                          <CheckCheck />
                          Email sent — move files & close session
                        </Button>
                        <Button variant="outline" onClick={startNextSession}>
                          <RefreshCcw />
                          Start next session
                        </Button>
                      </div>
                    </div>
                    <LogPanel title="Done log" entries={logs[5]} emptyMessage="Finalization activity will appear here." />
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <section className="panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
            <h2 className="mt-2 font-heading text-xl font-semibold">Current run</h2>
            <div className="mt-5 grid gap-3">
              <SummaryTile label="Configured types" value={String(activeDocTypes.length)} />
              <SummaryTile label="Draft date" value={formatDisplayDate(draftDate)} />
              <SummaryTile label="Latest submitted" value={latestSession?.submittedAt ? formatDisplayDate(latestSession.submittedAt) : "None yet"} />
            </div>
          </section>

          <section className="panel p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Integration mode</p>
            <h2 className="mt-2 font-heading text-xl font-semibold">API-ready adapters</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Google Drive: seed, scan, create folder, create Docs, download, move files.</li>
              <li>Gmail: create draft with base64 attachments and final subject.</li>
              <li>Anthropic: format relationship photo captions before doc generation.</li>
            </ul>
          </section>
        </aside>
      </section>

      {showHistory ? (
        <OverlayPanel title="Submission history" onClose={() => setShowHistory(false)}>
          {sessions.length ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <article key={session.id} className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{formatDisplayDate(session.submittedAt ?? session.draftDate)}</p>
                      <h3 className="mt-1 font-medium">{session.emailSubject}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{session.folderName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={session.status} />
                      <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                        Files moved: {session.filesMoved ? "Yes" : "No"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedHistoryId((currentId) =>
                            currentId === session.id ? null : session.id
                          )
                        }
                      >
                        {expandedHistoryId === session.id ? "Hide docs" : "Show docs"}
                      </Button>
                    </div>
                  </div>

                  {expandedHistoryId === session.id ? (
                    <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-border/70">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-secondary/60 text-secondary-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Document</th>
                            <th className="px-4 py-3 font-medium">Dates</th>
                            <th className="px-4 py-3 font-medium">Files</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.documents.map((document) => (
                            <tr key={document.docTypeId} className="border-t border-border/70 bg-background/80 align-top">
                              <td className="px-4 py-3">
                                <p className="font-medium">#{document.number} {document.label}</p>
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{document.category}</p>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{document.dateLabel}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {document.filenames.length ? document.filenames.join(", ") : "No files"}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={document.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 text-sm text-muted-foreground">
              No history yet. Drafts and sent sessions will appear here.
            </div>
          )}
        </OverlayPanel>
      ) : null}

      {showSettings ? (
        <OverlayPanel title="Settings" onClose={() => setShowSettings(false)}>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="To email">
                <input
                  className="field"
                  value={config.email.toEmail}
                  onChange={(event) => updateConfigEmail("toEmail", event.target.value)}
                />
              </Field>
              <Field label="CC email">
                <input
                  className="field"
                  value={config.email.ccEmail}
                  onChange={(event) => updateConfigEmail("ccEmail", event.target.value)}
                />
              </Field>
              <Field label="Greeting">
                <input
                  className="field"
                  value={config.email.greeting}
                  onChange={(event) => updateConfigEmail("greeting", event.target.value)}
                />
              </Field>
              <Field label="Sign-off">
                <input
                  className="field"
                  value={config.email.signOff}
                  onChange={(event) => updateConfigEmail("signOff", event.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Re-seed</p>
                  <h3 className="mt-1 font-heading text-xl font-semibold">Refresh document types from Document list</h3>
                </div>
                <Button onClick={runSeedReview}>
                  <RefreshCcw />
                  Re-seed
                </Button>
              </div>
              <textarea
                className="field mt-4 min-h-48 resize-y font-mono text-xs leading-6"
                value={seedSource}
                onChange={(event) => setSeedSource(event.target.value)}
              />
              {seedReview.length ? (
                <div className="mt-4 space-y-3">
                  {seedReview.map((docType) => (
                    <label key={docType.id} className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                      <div>
                        <p className="font-medium">#{docType.number} {docType.label}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {docType.category} • {docType.dateFormat}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={docType.active}
                        onChange={(event) =>
                          setSeedReview((currentDocTypes) =>
                            currentDocTypes.map((currentDocType) =>
                              currentDocType.id === docType.id
                                ? { ...currentDocType, active: event.target.checked }
                                : currentDocType
                            )
                          )
                        }
                      />
                    </label>
                  ))}
                  <Button onClick={saveSeedReview}>
                    <CheckCheck />
                    Save seeded types
                  </Button>
                </div>
              ) : null}
              <LogPanel title="Settings seed log" entries={seedLogs} emptyMessage="Re-seed activity will appear here." className="mt-4" />
            </div>
          </div>
        </OverlayPanel>
      ) : null}
    </main>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/80 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  )
}

function StepProgress({
  currentStep,
  photoStepEnabled,
}: {
  currentStep: WorkflowStep
  photoStepEnabled: boolean
}) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-5">
      {STEP_ITEMS.map((step) => {
        const isCurrent = currentStep === step.id
        const isComplete = currentStep > step.id
        const isSkippedPhotoStep = step.id === 2 && !photoStepEnabled && currentStep > 2

        return (
          <div
            key={step.id}
            className={cn(
              "rounded-[1.4rem] border px-4 py-3 text-sm transition-colors",
              isCurrent && "border-primary/40 bg-primary/10 text-foreground",
              isComplete && "border-emerald-500/20 bg-emerald-500/10 text-foreground",
              !isCurrent && !isComplete && "border-border/70 bg-card/80 text-muted-foreground"
            )}
          >
            <p className="text-xs uppercase tracking-[0.24em]">Step {step.id}</p>
            <p className="mt-2 font-medium">{step.label}</p>
            {isSkippedPhotoStep ? <p className="mt-1 text-xs">Skipped</p> : null}
          </div>
        )
      })}
    </div>
  )
}

function LogPanel({
  title,
  entries,
  emptyMessage,
  className,
}: {
  title: string
  entries: string[]
  emptyMessage: string
  className?: string
}) {
  return (
    <section className={cn("rounded-[1.75rem] border border-border/70 bg-card/90 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Live log</span>
      </div>
      <div className="mt-4 max-h-64 overflow-y-auto rounded-[1.25rem] border border-border/70 bg-primary/5 p-4 font-mono text-xs leading-6 text-foreground">
        {entries.length ? entries.join("\n") : emptyMessage}
      </div>
    </section>
  )
}

function OverlayPanel({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40 bg-foreground/30 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-[2rem] border border-border/70 bg-background/95 shadow-[0_30px_80px_var(--color-shadow)]">
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
          <h2 className="font-heading text-2xl font-semibold">{title}</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="h-[calc(100%-83px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status:
    | WorkflowDocumentState["status"]
    | VisaSessionRecord["status"]
}) {
  const className = {
    detected: "border-sky-500/20 bg-sky-500/10 text-sky-700",
    ready: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    pending: "border-amber-500/20 bg-amber-500/10 text-amber-700",
    skipped: "border-border/70 bg-secondary text-secondary-foreground",
    sent: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    draft: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  }[status]

  return <span className={cn("rounded-full border px-3 py-1 text-xs font-medium capitalize", className)}>{status}</span>
}
