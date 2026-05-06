import { cn } from "@/lib/utils"
import { type VisaSessionRecord } from "@/lib/visa-workflow"
import { type GoogleDriveFile } from "@/lib/google-drive"

import { formatDisplayDate, type WorkflowStep } from "./provider"
import { ScanStep } from "./steps/scan-step"
import { Button } from "../ui/button"
import { ChevronRight, Settings2 } from "lucide-react"

const STEP_ITEMS = [
  { id: 1, label: "Select Date Range" },
  { id: 2, label: "Visa Folder & Raw Docs" },
] as const

export function WorkflowPanel({
  currentStep,
  currentStepLabel,
  latestSession,
  logs,
  onContinueAfterScan,
  onOpenSettings,
  onRunScan,
  onCreateVisaFolder,
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
}: {
  currentStep: WorkflowStep
  currentStepLabel: string
  latestSession: VisaSessionRecord | undefined
  logs: Record<1 | 2 | 3 | 4 | 5, string[]>
  onContinueAfterScan: () => void
  onOpenSettings: () => void
  onRunScan: () => Promise<void>
  onCreateVisaFolder: () => Promise<void>
  selectedFromDate: string
  selectedToDate: string
  setSelectedFromDate: (value: string) => void
  setSelectedToDate: (value: string) => void
  rawFolderFiles: GoogleDriveFile[]
  rawFolderId: string
  rawFolderMissing: boolean
  visaFolderId: string
  visaFolderMissing: boolean
  visaFolderName: string
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
              ? "Set the workflow from and to dates first. The to date is used to build the Visa folder name lookup in the next step."
              : "Find or create the Visa folder and inspect the raw folder files. File processing rules can be added in the next phase."}
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

      <StepProgress currentStep={currentStep} />

      {currentStep === 1 ? (
        <div className="mt-8 space-y-5">
          <section className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
                  Date range
                </p>
                <h3 className="font-heading mt-1 text-xl font-semibold">
                  Choose workflow dates
                </h3>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  In settings, connect Drive and choose the root folder. Here,
                  only pick the date range for this run.
                </p>
              </div>
              <Button variant="outline" onClick={onOpenSettings}>
                <Settings2 />
                Open settings
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">From date</span>
                <input
                  type="date"
                  className="field"
                  value={selectedFromDate}
                  onChange={(event) => setSelectedFromDate(event.target.value)}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">To date</span>
                <input
                  type="date"
                  className="field"
                  value={selectedToDate}
                  onChange={(event) => setSelectedToDate(event.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={onContinueAfterScan}>
              Continue
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <ScanStep
          logs={logs[2]}
          onRunScan={onRunScan}
          onCreateVisaFolder={onCreateVisaFolder}
          rawFolderFiles={rawFolderFiles}
          rawFolderId={rawFolderId}
          rawFolderMissing={rawFolderMissing}
          visaFolderId={visaFolderId}
          visaFolderMissing={visaFolderMissing}
          visaFolderName={visaFolderName}
        />
      ) : null}
    </section>
  )
}

function StepProgress({ currentStep }: { currentStep: WorkflowStep }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {STEP_ITEMS.map((step) => {
        const isCurrent = currentStep === step.id
        const isComplete = currentStep > step.id

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
          </div>
        )
      })}
    </div>
  )
}
