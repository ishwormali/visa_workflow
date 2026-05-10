import { useNavigate } from "@tanstack/react-router";
import { CheckCheck, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VisaSessionRecord } from "@/lib/visa-workflow";

import {
  DocumentList,
  DocumentMeta,
  DocumentMetaTag,
  DocumentRow,
} from "../visa-design/document-list";
import {
  VisaButton,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "../visa-design/primitives";
import { LoadingScreen } from "./loading-screen";
import { formatDisplayDate, useVisaWorkflow } from "./provider";

export function VisaWorkflowHomePage() {
  const { hydrated, sessions, markSessionSent } = useVisaWorkflow();
  const navigate = useNavigate();

  if (!hydrated) {
    return <LoadingScreen />;
  }

  const recentSessions = sessions.slice(0, 10);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-5">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Visa Document Workflow
        </p>
        <h1 className="mt-1 font-visa-display text-3xl font-semibold text-ink">
          Workflow <em className="text-accent-ink">history</em>
        </h1>
        <p className="mt-2 text-ink-2">
          List of submission history, including pending workflows that can be resumed and completed,
          and sent workflows
        </p>
      </div>

      {/* <header className="rounded-[2rem] border border-border/70 bg-background/88 px-5 py-5 shadow-[0_20px_60px_var(--color-shadow)] backdrop-blur-xl">
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
      </header> */}

      <div className="MT-4 mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Your workflow activity </VisaPanelTitle>

            <VisaButton
              variant="primary"
              size={"sm"}
              onClick={() => navigate({ to: "/workflow/new" })}
            >
              Start workflow
              <ChevronRight />
            </VisaButton>
          </VisaPanelHeader>
          <VisaPanelBody tight>
            <DocumentList>
              {recentSessions.length ? (
                recentSessions.map((session, index) => (
                  <DocumentRow
                    key={session.id}
                    number={index + 1}
                    label={session.emailSubject}
                    meta={
                      <DocumentMeta>
                        <DocumentMetaTag>
                          {formatDisplayDate(session.submittedAt ?? session.draftDate)}
                        </DocumentMetaTag>
                        <DocumentMetaTag>{session.folderName}</DocumentMetaTag>
                        <DocumentMetaTag>{session.documents.length} docs</DocumentMetaTag>
                        <DocumentMetaTag>Step {session.currentStep}</DocumentMetaTag>
                      </DocumentMeta>
                    }
                    badge={<HistoryStatusBadge status={session.status} />}
                  >
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
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
                        <Button size="sm" onClick={() => markSessionSent(session.id)}>
                          <CheckCheck />
                          Mark complete
                        </Button>
                      ) : null}
                    </div>
                  </DocumentRow>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-ink-3">
                  No saved workflows yet. Start a new workflow to create your first pending item.
                </div>
              )}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>

        <div className="flex flex-col gap-4">
          <VisaPanel>
            <VisaPanelHeader>
              <VisaPanelTitle>Actions </VisaPanelTitle>
            </VisaPanelHeader>
            <VisaPanelBody tight className="p-4">
              <span>What you can do here</span>
              <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
                <li>Start a new workflow from a dedicated route.</li>
                <li>Resume any pending workflow from its edit route.</li>
                <li>Mark a pending workflow complete directly from the list.</li>
              </ul>
            </VisaPanelBody>
          </VisaPanel>

          <VisaPanel>
            <VisaPanelHeader>
              <VisaPanelTitle>Statuses </VisaPanelTitle>
            </VisaPanelHeader>
            <VisaPanelBody tight className="p-4">
              <span>What the statuses mean</span>
              <ul className="mt-4 flex flex-col gap-2 text-muted-foreground">
                <li>
                  <strong>Pending</strong> items are saved drafts that can be reopened later.
                </li>
                <li>
                  <strong>Sent</strong> items are closed workflows that have been marked complete.
                </li>
              </ul>
            </VisaPanelBody>
          </VisaPanel>
        </div>
      </div>
    </div>
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
