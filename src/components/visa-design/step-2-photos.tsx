import { useState } from "react";

import { PHOTOS } from "./data";
import {
  VisaButton,
  VisaButtonRow,
  VisaCluster,
  VisaField,
  VisaFieldLabel,
  VisaInput,
  VisaMonoText,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
  VisaTextarea,
} from "./primitives";
import { StepHead } from "./ui-bits";

type Props = {
  onBack: () => void;
  onNext: () => void;
};

type Draft = {
  date: string;
  people: string;
  description: string;
  formatted: string;
  formatting: boolean;
};

export function Step2Photos({ onBack, onNext }: Props) {
  const [idx, setIdx] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    PHOTOS.map((p) => ({
      date: p.date,
      people: p.people,
      description: p.description,
      formatted: p.formatted,
      formatting: false,
    })),
  );

  const photo = PHOTOS[idx];
  const draft = drafts[idx];
  const progress = ((idx + 1) / PHOTOS.length) * 100;
  const update = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDrafts((arr) => arr.map((d, i) => (i === idx ? { ...d, [k]: v } : d)));

  const formatAI = () => {
    update("formatting", true);
    setTimeout(() => {
      update("formatting", false);
      update("formatted", photo.formatted);
    }, 700);
  };

  const next = () => {
    if (idx < PHOTOS.length - 1) setIdx(idx + 1);
    else onNext();
  };

  return (
    <>
      <StepHead
        eyebrow={`Step 2 · Photo ${idx + 1} of ${PHOTOS.length}`}
        title={
          <>
            Caption the <em>relationship photos</em>
          </>
        }
        desc="One at a time. AI Format turns your inputs into the visa-officer's expected format."
      />

      <div className="mb-3 flex justify-between font-mono text-[11px] text-(--ink-3)">
        <span>
          {idx + 1} / {PHOTOS.length}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mb-4 h-0.5 overflow-hidden rounded-xs bg-(--rule)">
        <div
          className="h-full bg-(--accent) transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <VisaPanel>
        <VisaPanelHeader>
          <VisaPanelTitle>{photo.label}</VisaPanelTitle>
          <VisaMonoText className="text-(--ink-3)">{photo.file}</VisaMonoText>
        </VisaPanelHeader>
        <VisaPanelBody>
          <div className="grid gap-4">
            <div
              className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-(--vd-radius-lg) border border-(--rule)"
              style={{
                backgroundColor: photo.bg,
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent 0 18px, color-mix(in oklab, var(--ink-4) 20%, transparent) 18px 19px)",
              }}
            >
              <span className="absolute bottom-3 left-3 rounded-[3px] bg-[color-mix(in_oklab,var(--paper)_90%,transparent)] px-2 py-1 font-mono text-[10px] tracking-[0.06em] text-(--ink-3)">
                [ photo · {photo.file} ]
              </span>
            </div>
            <VisaField>
              <VisaFieldLabel>Date taken</VisaFieldLabel>
              <VisaInput
                type="date"
                value={draft.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </VisaField>
            <VisaField>
              <VisaFieldLabel>People in photo</VisaFieldLabel>
              <VisaInput value={draft.people} onChange={(e) => update("people", e.target.value)} />
            </VisaField>
            <VisaField>
              <VisaFieldLabel>Description / occasion</VisaFieldLabel>
              <VisaTextarea
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </VisaField>

            <VisaCluster>
              <VisaButton onClick={formatAI} disabled={draft.formatting} size="sm" variant="accent">
                {draft.formatting ? "· · · formatting" : "✦ AI Format"}
              </VisaButton>
              <VisaMonoText className="text-(--ink-3)">claude-sonnet-4 · ~280 tokens</VisaMonoText>
            </VisaCluster>

            {draft.formatted && !draft.formatting && (
              <div className="relative rounded-(--vd-radius) border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-(--accent-soft) px-3.5 py-3 [font-family:var(--font-display)] text-sm leading-[1.5] text-(--accent-ink) italic">
                <span className="absolute top-[-8px] left-3 bg-(--paper) px-1.5 font-mono text-[9px] font-medium tracking-[0.1em] text-(--accent-ink) not-italic">
                  PREVIEW
                </span>
                "{draft.formatted}"
              </div>
            )}
          </div>
        </VisaPanelBody>
      </VisaPanel>

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaCluster>
          <VisaButton onClick={next} size="sm">
            Skip this photo
          </VisaButton>
          <VisaButton onClick={next} variant="primary">
            {idx < PHOTOS.length - 1 ? "Save & next →" : "Save & continue →"}
          </VisaButton>
        </VisaCluster>
      </VisaButtonRow>
    </>
  );
}
