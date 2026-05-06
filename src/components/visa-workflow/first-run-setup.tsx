import { CheckCheck, FolderSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type DocTypeConfig } from "@/lib/visa-workflow"

import { DriveRootFolderField } from "./steps/scan-step"
import { LogPanel, StatusBadge } from "./steps/shared"

export function FirstRunSetup({
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
