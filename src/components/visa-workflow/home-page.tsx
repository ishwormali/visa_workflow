import { useNavigate } from "@tanstack/react-router";
import { CheckCheck, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VisaSessionRecord } from "@/lib/visa-workflow";

import { LoadingScreen } from "./loading-screen";
import { formatDisplayDate, useVisaWorkflow } from "./provider";
import { SummaryTile } from "./steps/shared";

export function VisaWorkflowHomePage() {
  const { hydrated, pendingSessionsCount, sentSessionsCount, sessions, markSessionSent } =
    useVisaWorkflow();
  const navigate = useNavigate();

  if (!hydrated) {
    return <LoadingScreen />;
  }

  const recentSessions = sessions.slice(0, 10);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-border/70 bg-background/88 px-5 py-5 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
              Visa Document Workflow
            </p>
            <h1 className="mt-1 font-heading text-3xl font-semibold">Workflow history</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review the latest 10 workflows, reopen a pending one, or start a fresh submission run.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {pendingSessionsCount} pending
            </div>
            <div className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {sentSessionsCount} sent
            </div>
            <Button onClick={() => navigate({ to: "/workflow/new" })}>
              Start workflow
              <ChevronRight />
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                Recent items
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">Previous workflows</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              Showing {recentSessions.length} of {sessions.length}
            </span>
          </div>

          {recentSessions.length ? (
            <div className="mt-6 space-y-4">
              {recentSessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {formatDisplayDate(session.submittedAt ?? session.draftDate)}
                      </p>
                      <h3 className="mt-1 font-medium">{session.emailSubject}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{session.folderName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <HistoryStatusBadge status={session.status} />
                      <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                        Step {session.currentStep}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <SummaryTile label="Created" value={formatDisplayDate(session.createdAt)} />
                    <SummaryTile label="Documents" value={String(session.documents.length)} />
                    <SummaryTile label="Updated" value={formatDisplayDate(session.updatedAt)} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: "/workflow/$workflowId/edit",
                          params: { workflowId: session.id },
                        })
                      }
                    >
                      {session.status === "draft" ? "Resume workflow" : "View workflow"}
                    </Button>
                    {session.status === "draft" ? (
                      <Button onClick={() => markSessionSent(session.id)}>
                        <CheckCheck />
                        Mark complete
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground">
              No saved workflows yet. Start a new workflow to create your first pending item.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="panel p-5">
            <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">Actions</p>
            <h2 className="mt-2 font-heading text-xl font-semibold">What you can do here</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Start a new workflow from a dedicated route.</li>
              <li>Resume any pending workflow from its edit route.</li>
              <li>Mark a pending workflow complete directly from the list.</li>
            </ul>
          </section>

          <section className="panel p-5">
            <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">Statuses</p>
            <h2 className="mt-2 font-heading text-xl font-semibold">Pending and sent</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Pending items are saved drafts that can be reopened later. Sent items are closed
              workflows that have been marked complete.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function HistoryStatusBadge({ status }: { status: VisaSessionRecord["status"] }) {
  const className =
    status === "sent"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
      : "border-amber-500/20 bg-amber-500/10 text-amber-700";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium capitalize", className)}>
      {status === "draft" ? "pending" : "sent"}
    </span>
  );
}
