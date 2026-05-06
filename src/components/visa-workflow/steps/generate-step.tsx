import { ChevronRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatDateLabel,
  type DocTypeConfig,
  type WorkflowDocumentState,
} from "@/lib/visa-workflow"

import { LogPanel, StatusBadge } from "./shared"

export function GenerateStep({
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
