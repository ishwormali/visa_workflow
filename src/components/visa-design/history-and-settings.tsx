import { useState } from "react";

import { MOCK_DOC_TYPES, PAST_SESSIONS, type EmailConfig } from "./data";
import { DocumentList, DocumentMeta, DocumentMetaTag, DocumentRow } from "./document-list";
import {
  VisaButton,
  VisaButtonRow,
  VisaDivider,
  VisaField,
  VisaFieldGrid,
  VisaFieldLabel,
  VisaInput,
  VisaModalCard,
  VisaModalHeader,
  VisaModalOverlay,
  VisaModalTitle,
  VisaMonoText,
  VisaNotice,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "./primitives";
import { Badge, DocCategoryLabel, StepHead } from "./ui-bits";

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(PAST_SESSIONS[0].id);
  return (
    <VisaModalOverlay onClick={onClose}>
      <VisaModalCard className="max-w-180" onClick={(e) => e.stopPropagation()}>
        <VisaModalHeader>
          <div>
            <VisaModalTitle>Past submissions</VisaModalTitle>
            <VisaMonoText className="mt-0.5 block text-[11px] text-(--ink-3)">
              {PAST_SESSIONS.length} sessions · all sent · all moved
            </VisaMonoText>
          </div>
          <VisaButton onClick={onClose} size="sm" variant="ghost">
            Close ✕
          </VisaButton>
        </VisaModalHeader>
        <div className="flex flex-col">
          {PAST_SESSIONS.map((s) => (
            <div key={s.id}>
              <button
                type="button"
                className="w-full cursor-pointer border-b border-(--rule) px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-(--paper-3)"
                onClick={() => setOpen(open === s.id ? null : s.id)}
              >
                <div className="grid items-center gap-4 md:grid-cols-[100px_minmax(0,1fr)_auto_auto]">
                  <div className="font-mono text-xs text-(--ink)">
                    {s.submittedAtPretty}
                    <small className="mt-0.5 block text-[10px] tracking-[0.06em] text-(--ink-3) uppercase">
                      submitted
                    </small>
                  </div>
                  <div className="truncate text-[13px] text-(--ink)">
                    <span className="text-(--ink-4)">re:</span> {s.subject}
                  </div>
                  <Badge kind={s.status}>{s.status}</Badge>
                  <VisaMonoText className="text-[11px] text-(--ink-4)">
                    {s.filesMoved ? "✓ moved" : "✕ not moved"} · {open === s.id ? "▾" : "▸"}
                  </VisaMonoText>
                </div>
              </button>
              {open === s.id && (
                <div className="flex flex-col gap-2.5 border-t border-dashed border-(--rule) bg-(--paper) px-6 pt-3 pb-1">
                  <VisaMonoText className="text-[10px] tracking-[0.06em] text-(--ink-3) uppercase">
                    📁 {s.folderName} · {s.docs.length} documents
                  </VisaMonoText>
                  {s.docs.map((d, i) => (
                    <div
                      className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 border-b border-dashed border-(--rule) py-1.5 text-xs last:border-b-0"
                      key={i}
                    >
                      <div className="pt-0 font-mono text-[11px] text-(--ink-3)">#{d.number}</div>
                      <div>
                        <div>{d.label}</div>
                        <VisaMonoText className="text-[11px] text-(--ink-3)">
                          {d.range}
                        </VisaMonoText>
                        <div className="mt-0.5 flex flex-col gap-0.5 font-mono text-[11px] text-(--ink-3)">
                          {d.files.map((f) => (
                            <div key={f}>▤ {f}</div>
                          ))}
                        </div>
                      </div>
                      <Badge kind="ready">ok</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </VisaModalCard>
    </VisaModalOverlay>
  );
}

type SettingsProps = {
  emailConfig: EmailConfig;
  setEmailConfig: (cfg: EmailConfig) => void;
  onClose: () => void;
};

export function SettingsPanel({ emailConfig, setEmailConfig, onClose }: SettingsProps) {
  const [draft, setDraft] = useState<EmailConfig>(emailConfig);
  return (
    <VisaModalOverlay onClick={onClose}>
      <VisaModalCard className="max-w-130" onClick={(e) => e.stopPropagation()}>
        <VisaModalHeader>
          <VisaModalTitle>Settings</VisaModalTitle>
          <VisaButton onClick={onClose} size="sm" variant="ghost">
            Close ✕
          </VisaButton>
        </VisaModalHeader>
        <div className="px-6 py-4">
          <VisaField className="mb-3">
            <VisaFieldLabel>To</VisaFieldLabel>
            <VisaInput
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </VisaField>
          <VisaField className="mb-3">
            <VisaFieldLabel>CC</VisaFieldLabel>
            <VisaInput
              value={draft.cc}
              onChange={(e) => setDraft({ ...draft, cc: e.target.value })}
            />
          </VisaField>
          <VisaFieldGrid className="mb-3">
            <VisaField>
              <VisaFieldLabel>Greeting</VisaFieldLabel>
              <VisaInput
                value={draft.greeting}
                onChange={(e) => setDraft({ ...draft, greeting: e.target.value })}
              />
            </VisaField>
            <VisaField>
              <VisaFieldLabel>Sign-off</VisaFieldLabel>
              <VisaInput
                value={draft.signoff}
                onChange={(e) => setDraft({ ...draft, signoff: e.target.value })}
              />
            </VisaField>
          </VisaFieldGrid>
          <VisaDivider />
          <div className="flex items-center justify-between border-b border-(--rule) py-3">
            <div>
              <div className="text-[13px] text-(--ink)">Re-seed doc types</div>
              <div className="mt-0.5 font-mono text-[11px] text-(--ink-3)">
                Re-reads the Document list Google Doc
              </div>
            </div>
            <VisaButton size="sm">⟳ Re-seed</VisaButton>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-[13px] text-(--ink)">Clear all sessions</div>
              <div className="mt-0.5 font-mono text-[11px] text-(--ink-3)">
                {PAST_SESSIONS.length} sessions stored locally
              </div>
            </div>
            <VisaButton size="sm">Clear…</VisaButton>
          </div>
          <VisaButtonRow align="right">
            <VisaButton onClick={onClose} size="sm" variant="ghost">
              Cancel
            </VisaButton>
            <VisaButton
              onClick={() => {
                setEmailConfig(draft);
                onClose();
              }}
              size="sm"
              variant="primary"
            >
              Save
            </VisaButton>
          </VisaButtonRow>
        </div>
      </VisaModalCard>
    </VisaModalOverlay>
  );
}

export function ConfigSeed({ onComplete }: { onComplete: () => void }) {
  return (
    <>
      <StepHead
        eyebrow="First run · Seed"
        title={
          <>
            Seed from <em>Document list</em>
          </>
        }
        desc={
          <>
            We read the table from your <VisaMonoText>Document list</VisaMonoText> Google Doc. Mark
            recurring vs. one-off below.
          </>
        }
      />

      <VisaNotice icon="✦">
        <div>
          Parsed <strong>9 rows</strong> · 4 are recurring (monthly) · 5 look like one-offs.
        </div>
      </VisaNotice>

      <VisaPanel>
        <VisaPanelHeader>
          <VisaPanelTitle>Detected doc types</VisaPanelTitle>
          <VisaMonoText className="text-(--ink-3)">toggle to set active</VisaMonoText>
        </VisaPanelHeader>
        <VisaPanelBody tight>
          <DocumentList>
            {MOCK_DOC_TYPES.map((d) => (
              <DocumentRow
                badge={
                  <Badge kind={d.active ? "active" : "inactive"}>
                    {d.active ? "active" : "inactive"}
                  </Badge>
                }
                inactive={!d.active}
                key={d.id}
                label={d.label}
                meta={
                  <DocumentMeta>
                    <DocumentMetaTag>
                      <DocCategoryLabel cat={d.category} />
                    </DocumentMetaTag>
                    <DocumentMetaTag>{d.dateFormat}</DocumentMetaTag>
                    {d.matchPattern && <DocumentMetaTag>{d.matchPattern}</DocumentMetaTag>}
                  </DocumentMeta>
                }
                number={d.number}
              />
            ))}
          </DocumentList>
        </VisaPanelBody>
      </VisaPanel>

      <VisaButtonRow align="right">
        <VisaButton onClick={onComplete} variant="primary">
          Save · 4 active types
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}
