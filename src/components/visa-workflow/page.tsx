import {
  CheckCheck,
  ChevronRight,
  FolderSearch,
  History,
  Settings2,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  type DocTypeConfig,
  type VisaConfig,
  type VisaSessionRecord,
  type WorkflowDocumentState,
} from "@/lib/visa-workflow"

import {
  formatDisplayDate,
  type WorkflowStep,
  useVisaWorkflow,
} from "./provider"
import { DoneStep } from "./steps/done-step"
import { DraftStep } from "./steps/draft-step"
import { GenerateStep } from "./steps/generate-step"
import { SettingsOverlay } from "./settings-overlay"
import { PhotoStep } from "./steps/photo-step"
import { DriveRootFolderField, ScanStep } from "./steps/scan-step"
import {
  LogPanel,
  OverlayPanel,
  StatusBadge,
  SummaryTile,
} from "./steps/shared"

const STEP_ITEMS = [
  { id: 1, label: "Scan Drive" },
  { id: 2, label: "Photo Captions" },
  { id: 3, label: "Generate Docs" },
  { id: 4, label: "Email Draft" },
  { id: 5, label: "Done" },
] as const

function LoadingScreen() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-6 py-12">
      <div className="panel w-full max-w-lg p-8 text-center">
        <p className="text-muted-foreground text-sm tracking-[0.24em] uppercase">
          Visa Workflow
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold">
          Preparing workspace
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Loading saved configuration and submission history.
        </p>
      </div>
    </main>
  )
}

export function VisaWorkflowHomePage() {
  const {
    hydrated,
    pendingSessionsCount,
    sentSessionsCount,
    sessions,
    markSessionSent,
  } = useVisaWorkflow()
  const navigate = useNavigate()

  if (!hydrated) {
    return <LoadingScreen />
  }

  const recentSessions = sessions.slice(0, 10)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-border/70 bg-background/88 rounded-[2rem] border px-5 py-5 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Visa Document Workflow
            </p>
            <h1 className="font-heading mt-1 text-3xl font-semibold">
              Workflow history
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Review the latest 10 workflows, reopen a pending one, or start a
              fresh submission run.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border/70 bg-secondary text-secondary-foreground rounded-full border px-4 py-2 text-sm">
              {pendingSessionsCount} pending
            </div>
            <div className="border-border/70 bg-secondary text-secondary-foreground rounded-full border px-4 py-2 text-sm">
              {sentSessionsCount} sent
            </div>
            <Button onClick={() => navigate({ to: "/workflow/new" })}>
              Start workflow
              <ChevronRight />
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
                Recent items
              </p>
              <h2 className="font-heading mt-2 text-2xl font-semibold">
                Previous workflows
              </h2>
            </div>
            <span className="text-muted-foreground text-sm">
              Showing {recentSessions.length} of {sessions.length}
            </span>
          </div>

          {recentSessions.length ? (
            <div className="mt-6 space-y-4">
              {recentSessions.map((session) => (
                <article
                  key={session.id}
                  className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">
                        {formatDisplayDate(
                          session.submittedAt ?? session.draftDate
                        )}
                      </p>
                      <h3 className="mt-1 font-medium">
                        {session.emailSubject}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {session.folderName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <HistoryStatusBadge status={session.status} />
                      <span className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs">
                        Step {session.currentStep}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <SummaryTile
                      label="Created"
                      value={formatDisplayDate(session.createdAt)}
                    />
                    <SummaryTile
                      label="Documents"
                      value={String(session.documents.length)}
                    />
                    <SummaryTile
                      label="Updated"
                      value={formatDisplayDate(session.updatedAt)}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: "/workflow/$workflowId/edit",
                          params: { workflowId: session.id },
                        })
                      }
                    >
                      {session.status === "draft"
                        ? "Resume workflow"
                        : "View workflow"}
                    </Button>
                    {session.status === "draft" ? (
                      <Button onClick={() => markSessionSent(session.id)}>
                        <CheckCheck />
                        Mark complete
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-border/70 bg-card/80 text-muted-foreground mt-6 rounded-[1.75rem] border p-6 text-sm">
              No saved workflows yet. Start a new workflow to create your first
              pending item.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="panel p-5">
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Actions
            </p>
            <h2 className="font-heading mt-2 text-xl font-semibold">
              What you can do here
            </h2>
            <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-6">
              <li>Start a new workflow from a dedicated route.</li>
              <li>Resume any pending workflow from its edit route.</li>
              <li>Mark a pending workflow complete directly from the list.</li>
            </ul>
          </section>

          <section className="panel p-5">
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Statuses
            </p>
            <h2 className="font-heading mt-2 text-xl font-semibold">
              Pending and sent
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-6">
              Pending items are saved drafts that can be reopened later. Sent
              items are closed workflows that have been marked complete.
            </p>
          </section>
        </aside>
      </section>
    </main>
  )
}

export function VisaWorkflowEditorPage() {
  const {
    activeDocTypes,
    closeHistory,
    closeSettings,
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
    goToDraftStep,
    goToDoneStep,
    handleDateChange,
    hasGenerated,
    hasScanned,
    hydrated,
    logs,
    latestSession,
    markEmailSent,
    missingSession,
    openHistory,
    openSettings,
    pendingSessionsCount,
    photoFiles,
    photoIndex,
    saveWorkflow,
    saveCaptionAndContinue,
    saveSeedReview,
    seedError,
    seedLogs,
    seedReview,
    seedSource,
    rootFolderError,
    rootFolderInput,
    sentSessionsCount,
    selectedRootFolderId,
    selectedRootFolderName,
    sessions,
    selectRootFolder,
    setSeedSource,
    setRootFolderInput,
    showHistory,
    showSettings,
    skipCurrentPhoto,
    skipPhotoStep,
    startNextSession,
    workflowId,
    toggleExpandedHistory,
    toggleSeedReviewDocType,
    updateConfigEmail,
    updateCurrentCaption,
    runScan,
    runSeedReview,
  } = useVisaWorkflow()
  const navigate = useNavigate()

  if (!hydrated) {
    return <LoadingScreen />
  }

  if (missingSession) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-6 py-12">
        <div className="panel w-full p-8 text-center">
          <p className="text-muted-foreground text-sm tracking-[0.24em] uppercase">
            Workflow not found
          </p>
          <h1 className="font-heading mt-3 text-3xl font-semibold">
            This saved workflow is missing
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            The requested workflow id was not found in local history. Return to
            the list and choose another item.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate({ to: "/" })}>
              Back to history
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-border/70 bg-background/88 sticky top-4 z-30 rounded-[2rem] border px-4 py-4 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Visa Document Workflow
            </p>
            <h1 className="font-heading mt-1 text-2xl font-semibold sm:text-3xl">
              Monthly support pack automation
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Workflow id {workflowId} with local draft persistence and
              resumable step progress.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border/70 bg-secondary text-secondary-foreground rounded-full border px-4 py-2 text-sm">
              {pendingSessionsCount} pending
            </div>
            <div className="border-border/70 bg-secondary text-secondary-foreground rounded-full border px-4 py-2 text-sm">
              {sentSessionsCount} sent
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/" })}
            >
              Back to list
            </Button>
            <Button variant="outline" size="sm" onClick={saveWorkflow}>
              Save draft
            </Button>
            <Button variant="outline" size="sm" onClick={openHistory}>
              <History />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={openSettings}>
              <Settings2 />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          {config.docTypes.length === 0 ? (
            <FirstRunSetup
              seedError={seedError}
              seedLogs={seedLogs}
              seedReview={seedReview}
              seedSource={seedSource}
              rootFolderError={rootFolderError}
              rootFolderInput={rootFolderInput}
              selectedRootFolderId={selectedRootFolderId}
              selectedRootFolderName={selectedRootFolderName}
              onRootFolderInputChange={setRootFolderInput}
              onSelectRootFolder={selectRootFolder}
              onRunSeedReview={runSeedReview}
              onSaveSeedReview={saveSeedReview}
              onSeedSourceChange={setSeedSource}
              onToggleSeedReviewDocType={toggleSeedReviewDocType}
            />
          ) : (
            <WorkflowPanel
              activeDocTypes={activeDocTypes}
              config={config}
              currentCaption={currentCaption}
              currentPhotoFile={currentPhotoFile}
              currentStep={currentStep}
              currentStepLabel={currentStepLabel}
              documents={documents}
              draftDate={draftDate}
              draftReady={draftReady}
              draftSession={draftSession}
              emailPreview={emailPreview}
              goToDoneStep={goToDoneStep}
              goToDraftStep={goToDraftStep}
              handleDateChange={handleDateChange}
              hasGenerated={hasGenerated}
              hasScanned={hasScanned}
              latestSession={latestSession}
              logs={logs}
              onContinueAfterScan={continueAfterScan}
              onCreateDraft={createDraft}
              onFormatCaptionWithAi={formatCaptionWithAi}
              onGenerateDocuments={generateDocuments}
              onMarkEmailSent={markEmailSent}
              onOpenSettings={openSettings}
              onSaveDraft={saveWorkflow}
              onSaveCaptionAndContinue={saveCaptionAndContinue}
              onSkipCurrentPhoto={skipCurrentPhoto}
              onSkipPhotoStep={skipPhotoStep}
              onSelectRootFolder={selectRootFolder}
              onStartNextSession={() => {
                startNextSession()
                navigate({ to: "/workflow/new" })
              }}
              onUpdateCurrentCaption={updateCurrentCaption}
              onRunScan={runScan}
              photoFiles={photoFiles}
              photoIndex={photoIndex}
              rootFolderError={rootFolderError}
              rootFolderInput={rootFolderInput}
              selectedRootFolderId={selectedRootFolderId}
              selectedRootFolderName={selectedRootFolderName}
              setRootFolderInput={setRootFolderInput}
            />
          )}
        </div>

        <WorkflowSidebar
          activeDocTypesCount={activeDocTypes.length}
          draftDate={draftDate}
          latestSession={latestSession}
        />
      </section>

      {showHistory ? (
        <HistoryOverlay
          expandedHistoryId={expandedHistoryId}
          onClose={closeHistory}
          onToggleExpandedHistory={toggleExpandedHistory}
          sessions={sessions}
        />
      ) : null}

      {showSettings ? (
        <SettingsOverlay
          config={config}
          onClose={closeSettings}
          onRunSeedReview={runSeedReview}
          onSaveSeedReview={saveSeedReview}
          onSeedSourceChange={setSeedSource}
          onRootFolderInputChange={setRootFolderInput}
          onSelectRootFolder={selectRootFolder}
          onToggleSeedReviewDocType={toggleSeedReviewDocType}
          onUpdateConfigEmail={updateConfigEmail}
          rootFolderError={rootFolderError}
          rootFolderInput={rootFolderInput}
          seedLogs={seedLogs}
          seedReview={seedReview}
          seedSource={seedSource}
          selectedRootFolderId={selectedRootFolderId}
          selectedRootFolderName={selectedRootFolderName}
        />
      ) : null}
    </main>
  )
}

function FirstRunSetup({
  rootFolderError,
  rootFolderInput,
  seedError,
  seedLogs,
  seedReview,
  seedSource,
  selectedRootFolderId,
  selectedRootFolderName,
  onRootFolderInputChange,
  onSelectRootFolder,
  onRunSeedReview,
  onSaveSeedReview,
  onSeedSourceChange,
  onToggleSeedReviewDocType,
}: {
  rootFolderError: string
  rootFolderInput: string
  seedError: string
  seedLogs: string[]
  seedReview: DocTypeConfig[]
  seedSource: string
  selectedRootFolderId: string
  selectedRootFolderName?: string
  onRootFolderInputChange: (value: string) => void
  onSelectRootFolder: () => Promise<void>
  onRunSeedReview: () => Promise<void>
  onSaveSeedReview: () => void
  onSeedSourceChange: (value: string) => void
  onToggleSeedReviewDocType: (docTypeId: string, active: boolean) => void
}) {
  return (
    <section className="panel p-6 sm:p-8">
      <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
        Config
      </p>
      <h2 className="font-heading mt-3 text-3xl font-semibold">
        First-run setup
      </h2>
      <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6">
        Pull the latest Document list, parse the recurring document definitions,
        and keep only the ones you want automated each month.
      </p>

      <DriveRootFolderField
        rootFolderError={rootFolderError}
        rootFolderInput={rootFolderInput}
        selectedRootFolderId={selectedRootFolderId}
        selectedRootFolderName={selectedRootFolderName}
        onRootFolderInputChange={onRootFolderInputChange}
        onSelectRootFolder={onSelectRootFolder}
        className="mt-8"
      />

      <div className="border-border/70 bg-card/80 mt-8 rounded-[1.75rem] border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Seed
            </p>
            <h3 className="font-heading mt-1 text-xl font-semibold">
              Document list source
            </h3>
          </div>
          <Button onClick={onRunSeedReview}>
            <FolderSearch />
            Read from Drive
          </Button>
        </div>
        <textarea
          className="field mt-4 min-h-48 resize-y font-mono text-xs leading-6"
          value={seedSource}
          onChange={(event) => onSeedSourceChange(event.target.value)}
        />
        {seedError ? (
          <div className="border-destructive/20 bg-destructive/8 text-destructive mt-4 rounded-3xl border p-4 text-sm">
            <p className="font-medium">{seedError}</p>
            <pre className="text-foreground mt-3 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
              {seedSource}
            </pre>
          </div>
        ) : null}
        <LogPanel
          title="Seed log"
          entries={seedLogs}
          emptyMessage="Seed activity will appear here."
          className="mt-4"
        />
      </div>

      {seedReview.length ? (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
                Review
              </p>
              <h3 className="font-heading mt-1 text-xl font-semibold">
                Recurring document types
              </h3>
            </div>
            <Button onClick={onSaveSeedReview}>
              <CheckCheck />
              Save config
            </Button>
          </div>
          <div className="grid gap-3">
            {seedReview.map((docType) => (
              <article
                key={docType.id}
                className="border-border/70 bg-card/80 rounded-[1.5rem] border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
                        #{docType.number}
                      </span>
                      <StatusBadge
                        status={docType.active ? "ready" : "skipped"}
                      />
                    </div>
                    <h4 className="mt-3 font-medium">{docType.label}</h4>
                    <p className="text-muted-foreground mt-1 text-xs tracking-[0.2em] uppercase">
                      {docType.category} • {docType.dateFormat} •{" "}
                      {docType.matchPattern}
                    </p>
                  </div>
                  <label className="border-border/70 bg-background inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={docType.active}
                      onChange={(event) =>
                        onToggleSeedReviewDocType(
                          docType.id,
                          event.target.checked
                        )
                      }
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
  )
}

function WorkflowPanel({
  activeDocTypes,
  config,
  currentCaption,
  currentPhotoFile,
  currentStep,
  currentStepLabel,
  documents,
  draftDate,
  draftReady,
  draftSession,
  emailPreview,
  goToDoneStep,
  goToDraftStep,
  handleDateChange,
  hasGenerated,
  hasScanned,
  latestSession,
  logs,
  onContinueAfterScan,
  onCreateDraft,
  onFormatCaptionWithAi,
  onGenerateDocuments,
  onMarkEmailSent,
  onOpenSettings,
  onSaveDraft,
  onSaveCaptionAndContinue,
  onSkipCurrentPhoto,
  onSkipPhotoStep,
  onSelectRootFolder,
  onStartNextSession,
  onUpdateCurrentCaption,
  onRunScan,
  photoFiles,
  photoIndex,
  rootFolderError,
  rootFolderInput,
  selectedRootFolderId,
  selectedRootFolderName,
  setRootFolderInput,
}: {
  activeDocTypes: DocTypeConfig[]
  config: VisaConfig
  currentCaption:
    | {
        date: string
        people: string
        description: string
        formattedCaption: string
      }
    | undefined
  currentPhotoFile: string | undefined
  currentStep: WorkflowStep
  currentStepLabel: string
  documents: WorkflowDocumentState[]
  draftDate: string
  draftReady: boolean
  draftSession: VisaSessionRecord | undefined
  emailPreview: string
  goToDoneStep: () => void
  goToDraftStep: () => void
  handleDateChange: (
    docTypeId: string,
    key: "date" | "from" | "to",
    value: string
  ) => void
  hasGenerated: boolean
  hasScanned: boolean
  latestSession: VisaSessionRecord | undefined
  logs: Record<1 | 3 | 4 | 5, string[]>
  onContinueAfterScan: () => void
  onCreateDraft: () => Promise<void>
  onFormatCaptionWithAi: () => void
  onGenerateDocuments: () => Promise<void>
  onMarkEmailSent: () => Promise<void>
  onOpenSettings: () => void
  onSaveDraft: () => void
  onSaveCaptionAndContinue: () => void
  onSkipCurrentPhoto: () => void
  onSkipPhotoStep: () => void
  onSelectRootFolder: (folderIdOrUrl?: string) => Promise<void>
  onStartNextSession: () => void
  onUpdateCurrentCaption: (
    field: "date" | "people" | "description" | "formattedCaption" | "skipped",
    value: string | boolean
  ) => void
  onRunScan: () => Promise<void>
  photoFiles: string[]
  photoIndex: number
  rootFolderError: string
  rootFolderInput: string
  selectedRootFolderId: string
  selectedRootFolderName?: string
  setRootFolderInput: (value: string) => void
}) {
  return (
    <section className="panel overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
            Workflow
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold">
            {currentStepLabel}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            {currentStep === 1
              ? "Connect Google Drive if needed, choose the root folder, confirm the date defaults, and then run the scan."
              : "The workflow now uses live Google Drive data while still keeping draft and sent sessions in persistent local history."}
          </p>
        </div>
        <div className="border-border/70 bg-secondary/80 text-secondary-foreground rounded-[1.5rem] border px-4 py-3 text-sm">
          <p>Last session</p>
          <p className="mt-1 font-medium">
            {latestSession?.submittedAt
              ? `${formatDisplayDate(latestSession.submittedAt)} • ${latestSession.documents.length} docs`
              : "No previous submissions"}
          </p>
        </div>
      </div>

      <StepProgress
        currentStep={currentStep}
        photoStepEnabled={Boolean(photoFiles.length)}
      />

      {currentStep === 1 ? (
        <ScanStep
          activeDocTypes={activeDocTypes}
          config={config}
          documents={documents}
          hasScanned={hasScanned}
          latestSession={latestSession}
          logs={logs[1]}
          onContinue={onContinueAfterScan}
          onEditSettings={onOpenSettings}
          onHandleDateChange={handleDateChange}
          onRunScan={onRunScan}
          onSelectRootFolder={onSelectRootFolder}
          photoFiles={photoFiles}
          rootFolderError={rootFolderError}
          rootFolderInput={rootFolderInput}
          selectedRootFolderId={selectedRootFolderId}
          selectedRootFolderName={selectedRootFolderName}
          setRootFolderInput={setRootFolderInput}
        />
      ) : null}

      {currentStep === 2 ? (
        <PhotoStep
          currentCaption={currentCaption}
          currentPhotoFile={currentPhotoFile}
          onFormatCaptionWithAi={onFormatCaptionWithAi}
          onSaveCaptionAndContinue={onSaveCaptionAndContinue}
          onSkipCurrentPhoto={onSkipCurrentPhoto}
          onSkipStep={onSkipPhotoStep}
          onUpdateCurrentCaption={onUpdateCurrentCaption}
          photoFiles={photoFiles}
          photoIndex={photoIndex}
        />
      ) : null}

      {currentStep === 3 ? (
        <GenerateStep
          activeDocTypes={activeDocTypes}
          documents={documents}
          hasGenerated={hasGenerated}
          logs={logs[3]}
          onContinue={goToDraftStep}
          onGenerateDocuments={onGenerateDocuments}
        />
      ) : null}

      {currentStep === 4 ? (
        <DraftStep
          draftDate={draftDate}
          draftReady={draftReady}
          emailPreview={emailPreview}
          hasGenerated={hasGenerated}
          logs={logs[4]}
          onContinue={goToDoneStep}
          onCreateDraft={onCreateDraft}
        />
      ) : null}

      {currentStep === 5 ? (
        <DoneStep
          draftDate={draftDate}
          draftReady={draftReady}
          draftSession={draftSession}
          logs={logs[5]}
          onMarkEmailSent={onMarkEmailSent}
          onSaveDraft={onSaveDraft}
          onStartNextSession={onStartNextSession}
        />
      ) : null}
    </section>
  )
}

function WorkflowSidebar({
  activeDocTypesCount,
  draftDate,
  latestSession,
}: {
  activeDocTypesCount: number
  draftDate: string
  latestSession: VisaSessionRecord | undefined
}) {
  return (
    <aside className="space-y-6">
      <section className="panel p-5">
        <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
          Status
        </p>
        <h2 className="font-heading mt-2 text-xl font-semibold">Current run</h2>
        <div className="mt-5 grid gap-3">
          <SummaryTile
            label="Configured types"
            value={String(activeDocTypesCount)}
          />
          <SummaryTile
            label="Draft date"
            value={formatDisplayDate(draftDate)}
          />
          <SummaryTile
            label="Latest submitted"
            value={
              latestSession?.submittedAt
                ? formatDisplayDate(latestSession.submittedAt)
                : "None yet"
            }
          />
        </div>
      </section>

      <section className="panel p-5">
        <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
          Integration mode
        </p>
        <h2 className="font-heading mt-2 text-xl font-semibold">
          Live integrations
        </h2>
        <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-6">
          <li>
            Google Drive: seed, scan, create folder, create Docs, download, move
            files.
          </li>
          <li>
            Gmail: local draft stub remains in place after Drive downloads.
          </li>
          <li>
            Anthropic: format relationship photo captions before doc generation.
          </li>
        </ul>
      </section>
    </aside>
  )
}

function HistoryOverlay({
  expandedHistoryId,
  onClose,
  onToggleExpandedHistory,
  sessions,
}: {
  expandedHistoryId: string | null
  onClose: () => void
  onToggleExpandedHistory: (sessionId: string) => void
  sessions: VisaSessionRecord[]
}) {
  return (
    <OverlayPanel title="Submission history" onClose={onClose}>
      {sessions.length ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="border-border/70 bg-card/80 rounded-[1.5rem] border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {formatDisplayDate(
                      session.submittedAt ?? session.draftDate
                    )}
                  </p>
                  <h3 className="mt-1 font-medium">{session.emailSubject}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {session.folderName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={session.status} />
                  <span className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs">
                    Files moved: {session.filesMoved ? "Yes" : "No"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleExpandedHistory(session.id)}
                  >
                    {expandedHistoryId === session.id
                      ? "Hide docs"
                      : "Show docs"}
                  </Button>
                </div>
              </div>

              {expandedHistoryId === session.id ? (
                <div className="border-border/70 mt-4 overflow-hidden rounded-[1.25rem] border">
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
                        <tr
                          key={document.docTypeId}
                          className="border-border/70 bg-background/80 border-t align-top"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium">
                              #{document.number} {document.label}
                            </p>
                            <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                              {document.category}
                            </p>
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {document.dateLabel}
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {document.filenames.length
                              ? document.filenames.join(", ")
                              : "No files"}
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
        <div className="border-border/70 bg-card/80 text-muted-foreground rounded-[1.5rem] border p-5 text-sm">
          No history yet. Drafts and sent sessions will appear here.
        </div>
      )}
    </OverlayPanel>
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
        const isSkippedPhotoStep =
          step.id === 2 && !photoStepEnabled && currentStep > 2

        return (
          <div
            key={step.id}
            className={cn(
              "rounded-[1.4rem] border px-4 py-3 text-sm transition-colors",
              isCurrent && "border-primary/40 bg-primary/10 text-foreground",
              isComplete &&
                "border-emerald-500/20 bg-emerald-500/10 text-foreground",
              !isCurrent &&
                !isComplete &&
                "border-border/70 bg-card/80 text-muted-foreground"
            )}
          >
            <p className="text-xs tracking-[0.24em] uppercase">
              Step {step.id}
            </p>
            <p className="mt-2 font-medium">{step.label}</p>
            {isSkippedPhotoStep ? (
              <p className="mt-1 text-xs">Skipped</p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function HistoryStatusBadge({
  status,
}: {
  status: VisaSessionRecord["status"]
}) {
  const className =
    status === "sent"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
      : "border-amber-500/20 bg-amber-500/10 text-amber-700"

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium capitalize",
        className
      )}
    >
      {status === "draft" ? "pending" : "sent"}
    </span>
  )
}
