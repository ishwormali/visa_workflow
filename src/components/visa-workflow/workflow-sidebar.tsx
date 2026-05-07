import { type VisaSessionRecord } from "@/lib/visa-workflow";

import { formatDisplayDate } from "./provider";
import { SummaryTile } from "./steps/shared";

export function WorkflowSidebar({
  activeDocTypesCount,
  draftDate,
  latestSession,
}: {
  activeDocTypesCount: number;
  draftDate: string;
  latestSession: VisaSessionRecord | undefined;
}) {
  return (
    <aside className="space-y-6">
      <section className="panel p-5">
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">Status</p>
        <h2 className="mt-2 font-heading text-xl font-semibold">Current run</h2>
        <div className="mt-5 grid gap-3">
          <SummaryTile label="Configured types" value={String(activeDocTypesCount)} />
          <SummaryTile label="Draft date" value={formatDisplayDate(draftDate)} />
          <SummaryTile
            label="Latest submitted"
            value={
              latestSession?.submittedAt ? formatDisplayDate(latestSession.submittedAt) : "None yet"
            }
          />
        </div>
      </section>

      <section className="panel p-5">
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Integration mode
        </p>
        <h2 className="mt-2 font-heading text-xl font-semibold">Live integrations</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>Google Drive: seed, scan, create folder, create Docs, download, move files.</li>
          <li>Gmail: local draft stub remains in place after Drive downloads.</li>
          <li>Anthropic: format relationship photo captions before doc generation.</li>
        </ul>
      </section>
    </aside>
  );
}
