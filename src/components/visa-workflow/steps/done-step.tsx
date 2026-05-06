import { CheckCheck, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  createEmailSubject,
  createSessionFolderName,
  type VisaSessionRecord,
} from "@/lib/visa-workflow"

import { LogPanel, SummaryTile } from "./shared"

export function DoneStep({
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
