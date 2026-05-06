import { History, Settings2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"

import { useVisaWorkflow } from "./provider"
import { LoadingScreen } from "./loading-screen"
import { FirstRunSetup } from "./first-run-setup"
import { WorkflowPanel } from "./workflow-panel"
import { WorkflowSidebar } from "./workflow-sidebar"
import { HistoryOverlay } from "./history-overlay"
import { SettingsOverlay } from "./settings-overlay"

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
