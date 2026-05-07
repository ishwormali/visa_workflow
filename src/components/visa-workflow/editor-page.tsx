import { useNavigate, useLocation } from "@tanstack/react-router";
import { History, Settings2 } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import { FirstRunSetup } from "./first-run-setup";
import { HistoryOverlay } from "./history-overlay";
import { LoadingScreen } from "./loading-screen";
import { useVisaWorkflow } from "./provider";
import { SettingsOverlay } from "./settings-overlay";
import { WorkflowPanel } from "./workflow-panel";
import { WorkflowSidebar } from "./workflow-sidebar";

function readStepFromPathname(pathname: string) {
  const match = pathname.match(/\/step\/(\d+)\/?$/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);

  return Number.isNaN(parsed) ? null : parsed;
}

function createStepPath(pathname: string, step: number) {
  if (pathname.startsWith("/workflow/new")) {
    return `/workflow/new/step/${step}`;
  }

  const editMatch = pathname.match(/^\/workflow\/([^/]+)\/edit(?:\/step\/\d+)?\/?$/);

  if (!editMatch) {
    return null;
  }

  return `/workflow/${editMatch[1]}/edit/step/${step}`;
}

export function VisaWorkflowEditorPage() {
  const {
    activeDocTypes,
    closeHistory,
    closeSettings,
    config,
    continueAfterScan,
    currentStep,
    currentStepLabel,
    draftDate,
    expandedHistoryId,
    hydrated,
    logs,
    latestSession,
    missingSession,
    openHistory,
    openSettings,
    pendingSessionsCount,
    saveWorkflow,
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
    workflowId,
    toggleExpandedHistory,
    toggleSeedReviewDocType,
    updateConfigEmail,
    runScan,
    createVisaFolderFromSelectedDate,
    createRawFolderInVisaFolder,
    goToStep,
    selectedFromDate,
    selectedToDate,
    setSelectedFromDate,
    setSelectedToDate,
    rawFolderFiles,
    rawFolderId,
    rawFolderMissing,
    visaFolderId,
    visaFolderMissing,
    visaFolderName,
    runSeedReview,
  } = useVisaWorkflow();
  const navigate = useNavigate();
  const location = useLocation();
  const routeStep = readStepFromPathname(location.pathname);

  useEffect(() => {
    if (!hydrated || routeStep === null || routeStep === currentStep) {
      return;
    }

    goToStep(routeStep as 1 | 2);
  }, [currentStep, goToStep, hydrated, routeStep]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (routeStep !== null && routeStep !== currentStep) {
      return;
    }

    const nextPath = createStepPath(location.pathname, currentStep);

    if (nextPath && nextPath !== location.pathname) {
      void navigate({ to: nextPath, replace: true });
    }
  }, [currentStep, hydrated, location.pathname, navigate, routeStep]);

  function handleGoBack() {
    if (currentStep > 1) {
      goToStep((currentStep - 1) as 1 | 2);
      return;
    }

    void navigate({ to: "/" });
  }

  if (!hydrated) {
    return <LoadingScreen />;
  }

  if (missingSession) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-6 py-12">
        <div className="panel w-full p-8 text-center">
          <p className="text-sm tracking-[0.24em] text-muted-foreground uppercase">
            Workflow not found
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            This saved workflow is missing
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested workflow id was not found in local history. Return to the list and choose
            another item.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate({ to: "/" })}>Back to history</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-30 rounded-[2rem] border border-border/70 bg-background/88 px-4 py-4 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
              Visa Document Workflow
            </p>
            <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">
              Monthly support pack automation
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Workflow id {workflowId} with local draft persistence and resumable step progress.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {pendingSessionsCount} pending
            </div>
            <div className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {sentSessionsCount} sent
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
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
              currentStep={currentStep}
              currentStepLabel={currentStepLabel}
              onGoBack={handleGoBack}
              latestSession={latestSession}
              logs={logs}
              onContinueAfterScan={continueAfterScan}
              onOpenSettings={openSettings}
              onRunScan={runScan}
              onCreateVisaFolder={createVisaFolderFromSelectedDate}
              onCreateRawFolder={createRawFolderInVisaFolder}
              selectedFromDate={selectedFromDate}
              selectedToDate={selectedToDate}
              setSelectedFromDate={setSelectedFromDate}
              setSelectedToDate={setSelectedToDate}
              rawFolderFiles={rawFolderFiles}
              rawFolderId={rawFolderId}
              rawFolderMissing={rawFolderMissing}
              visaFolderId={visaFolderId}
              visaFolderMissing={visaFolderMissing}
              visaFolderName={visaFolderName}
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
  );
}
