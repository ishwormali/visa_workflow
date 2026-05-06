import { CheckCheck, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type DocTypeConfig, type VisaConfig } from "@/lib/visa-workflow"

import { DriveRootFolderField } from "./steps/scan-step"
import { Field, LogPanel, OverlayPanel } from "./steps/shared"

export function SettingsOverlay({
  config,
  onClose,
  onRootFolderInputChange,
  onSelectRootFolder,
  onRunSeedReview,
  onSaveSeedReview,
  onSeedSourceChange,
  onToggleSeedReviewDocType,
  onUpdateConfigEmail,
  rootFolderError,
  rootFolderInput,
  seedLogs,
  seedReview,
  seedSource,
  selectedRootFolderId,
  selectedRootFolderName,
}: {
  config: VisaConfig
  onClose: () => void
  onRootFolderInputChange: (value: string) => void
  onSelectRootFolder: () => Promise<void>
  onRunSeedReview: () => Promise<void>
  onSaveSeedReview: () => void
  onSeedSourceChange: (value: string) => void
  onToggleSeedReviewDocType: (docTypeId: string, active: boolean) => void
  onUpdateConfigEmail: <K extends keyof VisaConfig["email"]>(
    field: K,
    value: VisaConfig["email"][K]
  ) => void
  rootFolderError: string
  rootFolderInput: string
  seedLogs: string[]
  seedReview: DocTypeConfig[]
  seedSource: string
  selectedRootFolderId: string
  selectedRootFolderName?: string
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

        <DriveRootFolderField
          rootFolderError={rootFolderError}
          rootFolderInput={rootFolderInput}
          selectedRootFolderId={selectedRootFolderId}
          selectedRootFolderName={selectedRootFolderName}
          onRootFolderInputChange={onRootFolderInputChange}
          onSelectRootFolder={onSelectRootFolder}
        />

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
