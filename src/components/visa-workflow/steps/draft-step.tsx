import { ChevronRight, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createEmailSubject } from "@/lib/visa-workflow"

import { LogPanel } from "./shared"

export function DraftStep({
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
