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
import type { ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  createEmailSubject,
  createSessionFolderName,
  formatDateLabel,
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
    goToScanStep,
    goToSetupStep,
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
    sentSessionsCount,
    sessions,
    setSeedSource,
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
              goToScanStep={goToScanStep}
              goToSetupStep={goToSetupStep}
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
              onStartNextSession={() => {
                startNextSession()
                navigate({ to: "/workflow/new" })
              }}
              onUpdateCurrentCaption={updateCurrentCaption}
              onRunScan={runScan}
              photoFiles={photoFiles}
              photoIndex={photoIndex}
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
          onToggleSeedReviewDocType={toggleSeedReviewDocType}
          onUpdateConfigEmail={updateConfigEmail}
          seedLogs={seedLogs}
          seedReview={seedReview}
          seedSource={seedSource}
        />
      ) : null}
    </main>
  )
}

function FirstRunSetup({
  seedError,
  seedLogs,
  seedReview,
  seedSource,
  onRunSeedReview,
  onSaveSeedReview,
  onSeedSourceChange,
  onToggleSeedReviewDocType,
}: {
  seedError: string
  seedLogs: string[]
  seedReview: DocTypeConfig[]
  seedSource: string
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
  goToScanStep,
  goToSetupStep,
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
  onStartNextSession,
  onUpdateCurrentCaption,
  onRunScan,
  photoFiles,
  photoIndex,
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
  goToScanStep: () => void
  goToSetupStep: () => void
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
  onStartNextSession: () => void
  onUpdateCurrentCaption: (
    field: "date" | "people" | "description" | "formattedCaption" | "skipped",
    value: string | boolean
  ) => void
  onRunScan: () => Promise<void>
  photoFiles: string[]
  photoIndex: number
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
            {currentStep === 0
              ? "Each recurring document type keeps its own date history. Confirm the defaults before scanning Google Drive."
              : "The workflow keeps draft and sent sessions in persistent local history while remaining ready for Drive and Gmail API wiring."}
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

      {currentStep >= 1 ? (
        <StepProgress
          currentStep={currentStep}
          photoStepEnabled={Boolean(photoFiles.length)}
        />
      ) : null}

      {currentStep === 0 ? (
        <SetupStep
          activeDocTypes={activeDocTypes}
          config={config}
          documents={documents}
          latestSession={latestSession}
          onContinue={goToScanStep}
          onEditSettings={onOpenSettings}
          onHandleDateChange={handleDateChange}
        />
      ) : null}

      {currentStep === 1 ? (
        <ScanStep
          activeDocTypes={activeDocTypes}
          documents={documents}
          hasScanned={hasScanned}
          logs={logs[1]}
          onBack={goToSetupStep}
          onContinue={onContinueAfterScan}
          onRunScan={onRunScan}
          photoFiles={photoFiles}
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

function SetupStep({
  activeDocTypes,
  config,
  documents,
  latestSession,
  onContinue,
  onEditSettings,
  onHandleDateChange,
}: {
  activeDocTypes: DocTypeConfig[]
  config: VisaConfig
  documents: WorkflowDocumentState[]
  latestSession: VisaSessionRecord | undefined
  onContinue: () => void
  onEditSettings: () => void
  onHandleDateChange: (
    docTypeId: string,
    key: "date" | "from" | "to",
    value: string
  ) => void
}) {
  return (
    <div className="mt-8 space-y-4">
      {activeDocTypes.map((docType) => {
        const document = documents.find(
          (currentDocument) => currentDocument.docTypeId === docType.id
        )

        if (!document) {
          return null
        }

        return (
          <article
            key={docType.id}
            className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
                    #{docType.number}
                  </span>
                  <StatusBadge status={document.status} />
                </div>
                <h3 className="mt-3 font-medium">{docType.label}</h3>
                <p className="text-muted-foreground mt-1 text-xs tracking-[0.2em] uppercase">
                  {docType.category} • {docType.dateFormat}
                </p>
              </div>
              <div className="border-border/70 bg-background/80 min-w-56 rounded-[1.5rem] border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Last used</p>
                <p className="mt-1 font-medium">
                  {latestSession?.documents.find(
                    (item) => item.docTypeId === docType.id
                  )?.dateLabel ?? "No prior value"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {document.dates.mode === "single" ? (
                <Field
                  label={
                    docType.category === "gdoc_photos"
                      ? "Default photo date"
                      : "Date"
                  }
                >
                  <input
                    type="date"
                    className="field"
                    value={document.dates.date}
                    onChange={(event) =>
                      onHandleDateChange(docType.id, "date", event.target.value)
                    }
                  />
                </Field>
              ) : (
                <>
                  <Field label="From date">
                    <input
                      type="date"
                      className="field"
                      value={document.dates.from}
                      onChange={(event) =>
                        onHandleDateChange(
                          docType.id,
                          "from",
                          event.target.value
                        )
                      }
                    />
                  </Field>
                  <Field label="To date">
                    <input
                      type="date"
                      className="field"
                      value={document.dates.to}
                      onChange={(event) =>
                        onHandleDateChange(docType.id, "to", event.target.value)
                      }
                    />
                  </Field>
                </>
              )}
            </div>

            {document.validationMessage ? (
              <p className="text-destructive mt-4 text-sm">
                {document.validationMessage}
              </p>
            ) : null}
          </article>
        )
      })}

      <div className="border-border/70 bg-secondary/40 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border px-5 py-4">
        <div>
          <p className="text-secondary-foreground text-sm font-medium">
            Email config
          </p>
          <p className="text-muted-foreground text-sm">
            To {config.email.toEmail || "not set"} • CC{" "}
            {config.email.ccEmail || "not set"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEditSettings}>
            <Settings2 />
            Edit settings
          </Button>
          <Button onClick={onContinue}>
            Continue to scan
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScanStep({
  activeDocTypes,
  documents,
  hasScanned,
  logs,
  onBack,
  onContinue,
  onRunScan,
  photoFiles,
}: {
  activeDocTypes: DocTypeConfig[]
  documents: WorkflowDocumentState[]
  hasScanned: boolean
  logs: string[]
  onBack: () => void
  onContinue: () => void
  onRunScan: () => Promise<void>
  photoFiles: string[]
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-sm leading-6">
          Scan the Documents requested Drive tree, auto-match files against the
          seeded patterns, and confirm whether photo captioning is needed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to setup
          </Button>
          <Button onClick={onRunScan}>
            <FolderSearch />
            Scan Drive
          </Button>
        </div>
      </div>
      <div className="grid gap-3">
        {activeDocTypes.map((docType) => {
          const document = documents.find(
            (currentDocument) => currentDocument.docTypeId === docType.id
          )

          if (!document) {
            return null
          }

          return (
            <div
              key={docType.id}
              className="border-border/70 bg-card/80 rounded-[1.5rem] border px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{docType.label}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {document.matchedFiles.length || 0} file(s) matched
                  </p>
                </div>
                <StatusBadge status={document.status} />
              </div>
              {document.matchedFiles.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.matchedFiles.map((fileName) => (
                    <span
                      key={fileName}
                      className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs"
                    >
                      {fileName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <LogPanel
        title="Drive scan log"
        entries={logs}
        emptyMessage="Scan output will stream here."
      />
      {hasScanned ? (
        <div className="flex justify-end">
          <Button onClick={onContinue}>
            {photoFiles.length
              ? "Continue to photo captions"
              : "Skip to generate documents"}
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function PhotoStep({
  currentCaption,
  currentPhotoFile,
  onFormatCaptionWithAi,
  onSaveCaptionAndContinue,
  onSkipCurrentPhoto,
  onSkipStep,
  onUpdateCurrentCaption,
  photoFiles,
  photoIndex,
}: {
  currentCaption:
    | {
        date: string
        people: string
        description: string
        formattedCaption: string
      }
    | undefined
  currentPhotoFile: string | undefined
  onFormatCaptionWithAi: () => void
  onSaveCaptionAndContinue: () => void
  onSkipCurrentPhoto: () => void
  onSkipStep: () => void
  onUpdateCurrentCaption: (
    field: "date" | "people" | "description" | "formattedCaption" | "skipped",
    value: string | boolean
  ) => void
  photoFiles: string[]
  photoIndex: number
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            {photoFiles.length
              ? `Photo ${photoIndex + 1} of ${photoFiles.length}`
              : "No photos detected."}
          </p>
          <h3 className="font-heading mt-1 text-2xl font-semibold">
            {currentPhotoFile ?? "Relationship photos"}
          </h3>
        </div>
        <Button variant="outline" onClick={onSkipStep}>
          Skip step
        </Button>
      </div>

      <div className="bg-secondary h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{
            width: `${photoFiles.length ? ((photoIndex + 1) / photoFiles.length) * 100 : 0}%`,
          }}
        />
      </div>

      {currentCaption ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  className="field"
                  value={currentCaption.date}
                  onChange={(event) =>
                    onUpdateCurrentCaption("date", event.target.value)
                  }
                />
              </Field>
              <Field label="People">
                <input
                  className="field"
                  value={currentCaption.people}
                  onChange={(event) =>
                    onUpdateCurrentCaption("people", event.target.value)
                  }
                  placeholder="Names in the photo"
                />
              </Field>
            </div>
            <Field label="Occasion / description" className="mt-4">
              <textarea
                className="field min-h-32 resize-y"
                value={currentCaption.description}
                onChange={(event) =>
                  onUpdateCurrentCaption("description", event.target.value)
                }
                placeholder="Where you were, why it matters, what happened"
              />
            </Field>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" onClick={onFormatCaptionWithAi}>
                <Sparkles />
                AI format
              </Button>
              <Button variant="outline" onClick={onSkipCurrentPhoto}>
                Skip photo
              </Button>
              <Button onClick={onSaveCaptionAndContinue}>
                Save caption
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="border-border/70 bg-secondary/40 rounded-[1.75rem] border p-5">
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Preview
            </p>
            <h4 className="font-heading mt-2 text-xl font-semibold">
              Formatted caption
            </h4>
            <p className="border-border/70 bg-background/80 text-foreground mt-4 rounded-[1.5rem] border p-4 text-sm leading-7">
              {currentCaption.formattedCaption ||
                "Use AI format to preview the caption text saved into the Google Doc."}
            </p>
          </div>
        </div>
      ) : (
        <div className="border-border/70 bg-card/80 text-muted-foreground rounded-[1.5rem] border p-5 text-sm">
          No detected photos require captions. Continue to generation.
        </div>
      )}
    </div>
  )
}

function GenerateStep({
  activeDocTypes,
  documents,
  hasGenerated,
  logs,
  onContinue,
  onGenerateDocuments,
}: {
  activeDocTypes: DocTypeConfig[]
  documents: WorkflowDocumentState[]
  hasGenerated: boolean
  logs: string[]
  onContinue: () => void
  onGenerateDocuments: () => Promise<void>
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Generate the session folder, pass through upload files, build Google
          Docs for dynamic content, and append the result back to the Document
          list.
        </p>
        <Button onClick={onGenerateDocuments}>
          <Sparkles />
          Generate documents
        </Button>
      </div>
      <div className="grid gap-3">
        {activeDocTypes.map((docType) => {
          const document = documents.find(
            (currentDocument) => currentDocument.docTypeId === docType.id
          )

          if (!document) {
            return null
          }

          return (
            <div
              key={docType.id}
              className="border-border/70 bg-card/80 rounded-[1.5rem] border px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{docType.label}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatDateLabel(document.dates)}
                  </p>
                </div>
                <StatusBadge status={document.status} />
              </div>
              {document.generatedFiles.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.generatedFiles.map((fileName) => (
                    <span
                      key={fileName}
                      className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs"
                    >
                      {fileName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <LogPanel
        title="Generation log"
        entries={logs}
        emptyMessage="Generation output will stream here."
      />
      {hasGenerated ? (
        <div className="flex justify-end">
          <Button onClick={onContinue}>
            Continue to email draft
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function DraftStep({
  draftDate,
  draftReady,
  emailPreview,
  hasGenerated,
  logs,
  onContinue,
  onCreateDraft,
}: {
  draftDate: string
  draftReady: boolean
  emailPreview: string
  hasGenerated: boolean
  logs: string[]
  onContinue: () => void
  onCreateDraft: () => Promise<void>
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            Subject will use the draft date while the final sent session
            identity uses the actual submitted date.
          </p>
          <h3 className="font-heading mt-1 text-2xl font-semibold">
            {createEmailSubject(draftDate)}
          </h3>
        </div>
        <Button onClick={onCreateDraft} disabled={!hasGenerated}>
          <Mail />
          Create Gmail draft
        </Button>
      </div>
      <div className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5">
        <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
          Email preview
        </p>
        <pre className="text-foreground mt-4 overflow-x-auto font-sans text-sm leading-7 whitespace-pre-wrap">
          {emailPreview ||
            "Generate documents, then create the draft to preview the final email body and attachments."}
        </pre>
      </div>
      <LogPanel
        title="Draft log"
        entries={logs}
        emptyMessage="Draft activity will stream here."
      />
      {draftReady ? (
        <div className="flex justify-end">
          <Button onClick={onContinue}>
            Continue to done
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function DoneStep({
  draftDate,
  draftReady,
  draftSession,
  logs,
  onMarkEmailSent,
  onSaveDraft,
  onStartNextSession,
}: {
  draftDate: string
  draftReady: boolean
  draftSession: VisaSessionRecord | undefined
  logs: string[]
  onMarkEmailSent: () => Promise<void>
  onSaveDraft: () => void
  onStartNextSession: () => void
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile
          label="Draft folder"
          value={draftSession?.folderName ?? createSessionFolderName(draftDate)}
        />
        <SummaryTile
          label="Email subject"
          value={draftSession?.emailSubject ?? createEmailSubject(draftDate)}
        />
        <SummaryTile
          label="Move files"
          value={draftSession?.filesMoved ? "Yes" : "Pending"}
        />
      </div>
      <div className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5">
        <p className="text-muted-foreground text-sm leading-6">
          Send the Gmail draft manually, then close the session to rename the
          Drive folder, move generated files back to the root, and persist the
          final sent record.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={onSaveDraft}>
            Save draft
          </Button>
          <Button onClick={onMarkEmailSent} disabled={!draftReady}>
            <CheckCheck />
            Email sent — move files & close session
          </Button>
          <Button variant="outline" onClick={onStartNextSession}>
            <RefreshCcw />
            Start next session
          </Button>
        </div>
      </div>
      <LogPanel
        title="Done log"
        entries={logs}
        emptyMessage="Finalization activity will appear here."
      />
    </div>
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
          API-ready adapters
        </h2>
        <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-6">
          <li>
            Google Drive: seed, scan, create folder, create Docs, download, move
            files.
          </li>
          <li>
            Gmail: create draft with base64 attachments and final subject.
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

function SettingsOverlay({
  config,
  onClose,
  onRunSeedReview,
  onSaveSeedReview,
  onSeedSourceChange,
  onToggleSeedReviewDocType,
  onUpdateConfigEmail,
  seedLogs,
  seedReview,
  seedSource,
}: {
  config: VisaConfig
  onClose: () => void
  onRunSeedReview: () => Promise<void>
  onSaveSeedReview: () => void
  onSeedSourceChange: (value: string) => void
  onToggleSeedReviewDocType: (docTypeId: string, active: boolean) => void
  onUpdateConfigEmail: <K extends keyof VisaConfig["email"]>(
    field: K,
    value: VisaConfig["email"][K]
  ) => void
  seedLogs: string[]
  seedReview: DocTypeConfig[]
  seedSource: string
}) {
  return (
    <OverlayPanel title="Settings" onClose={onClose}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="To email">
            <input
              className="field"
              value={config.email.toEmail}
              onChange={(event) =>
                onUpdateConfigEmail("toEmail", event.target.value)
              }
            />
          </Field>
          <Field label="CC email">
            <input
              className="field"
              value={config.email.ccEmail}
              onChange={(event) =>
                onUpdateConfigEmail("ccEmail", event.target.value)
              }
            />
          </Field>
          <Field label="Greeting">
            <input
              className="field"
              value={config.email.greeting}
              onChange={(event) =>
                onUpdateConfigEmail("greeting", event.target.value)
              }
            />
          </Field>
          <Field label="Sign-off">
            <input
              className="field"
              value={config.email.signOff}
              onChange={(event) =>
                onUpdateConfigEmail("signOff", event.target.value)
              }
            />
          </Field>
        </div>

        <div className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
                Re-seed
              </p>
              <h3 className="font-heading mt-1 text-xl font-semibold">
                Refresh document types from Document list
              </h3>
            </div>
            <Button onClick={onRunSeedReview}>
              <RefreshCcw />
              Re-seed
            </Button>
          </div>
          <textarea
            className="field mt-4 min-h-48 resize-y font-mono text-xs leading-6"
            value={seedSource}
            onChange={(event) => onSeedSourceChange(event.target.value)}
          />
          {seedReview.length ? (
            <div className="mt-4 space-y-3">
              {seedReview.map((docType) => (
                <label
                  key={docType.id}
                  className="border-border/70 bg-background/80 flex items-start justify-between gap-3 rounded-[1.25rem] border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      #{docType.number} {docType.label}
                    </p>
                    <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                      {docType.category} • {docType.dateFormat}
                    </p>
                  </div>
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
                </label>
              ))}
              <Button onClick={onSaveSeedReview}>
                <CheckCheck />
                Save seeded types
              </Button>
            </div>
          ) : null}
          <LogPanel
            title="Settings seed log"
            entries={seedLogs}
            emptyMessage="Re-seed activity will appear here."
            className="mt-4"
          />
        </div>
      </div>
    </OverlayPanel>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-foreground text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/70 bg-card/80 rounded-[1.5rem] border px-4 py-4">
      <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-2 text-sm leading-6 font-medium">
        {value}
      </p>
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
    <section
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-card/90 p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
          Live log
        </span>
      </div>
      <div className="border-border/70 bg-primary/5 text-foreground mt-4 max-h-64 overflow-y-auto rounded-[1.25rem] border p-4 font-mono text-xs leading-6">
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
  children: ReactNode
}) {
  return (
    <div className="bg-foreground/30 fixed inset-0 z-40 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="border-border/70 bg-background/95 mx-auto h-full max-w-4xl overflow-hidden rounded-[2rem] border shadow-[0_30px_80px_var(--color-shadow)]">
        <div className="border-border/70 flex items-center justify-between border-b px-6 py-5">
          <h2 className="font-heading text-2xl font-semibold">{title}</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="h-[calc(100%-83px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
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

function StatusBadge({
  status,
}: {
  status: WorkflowDocumentState["status"] | VisaSessionRecord["status"]
}) {
  const className = {
    detected: "border-sky-500/20 bg-sky-500/10 text-sky-700",
    ready: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    pending: "border-amber-500/20 bg-amber-500/10 text-amber-700",
    skipped: "border-border/70 bg-secondary text-secondary-foreground",
    sent: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    draft: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  }[status]

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium capitalize",
        className
      )}
    >
      {status}
    </span>
  )
}
