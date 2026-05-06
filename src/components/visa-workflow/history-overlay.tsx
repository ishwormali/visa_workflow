import { Button } from "@/components/ui/button"
import { type VisaSessionRecord } from "@/lib/visa-workflow"

import { formatDisplayDate } from "./provider"
import { OverlayPanel, StatusBadge } from "./steps/shared"

export function HistoryOverlay({
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
