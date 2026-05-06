import { cn } from "@/lib/utils"
import {
  type DocTypeConfig,
  type VisaConfig,
  type VisaSessionRecord,
  type WorkflowDocumentState,
} from "@/lib/visa-workflow"

import { formatDisplayDate, type WorkflowStep } from "./provider"
import { DoneStep } from "./steps/done-step"
import { DraftStep } from "./steps/draft-step"
import { GenerateStep } from "./steps/generate-step"
import { PhotoStep } from "./steps/photo-step"
import { ScanStep } from "./steps/scan-step"

const STEP_ITEMS = [
  { id: 1, label: "Scan Drive" },
  { id: 2, label: "Photo Captions" },
  { id: 3, label: "Generate Docs" },
  { id: 4, label: "Email Draft" },
  { id: 5, label: "Done" },
] as const

export function WorkflowPanel({
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
