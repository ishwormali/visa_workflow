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
} from "../../visa-design/primitives";
import { StepHead } from "../../visa-design/ui-bits";
import { useVisaWorkflow } from "../provider";

type Props = {
  onBack: () => void;
};
function buildPreviewText(date: string, people: string, description: string, formatted: string) {
  if (formatted) {
    return formatted;
  }

  return `${date || "Date"}: ${people || "People"} - ${description || "Description"}`;
}

export function PhotosStep({ onBack }: Props) {
  const {
    currentCaption,
    currentPhotoFile,
    formatCaptionWithAi,
    getMatchedFileDisplayName,
    photoFiles,
    photoIndex,
    saveCaptionAndContinue,
    selectPhotoIndex,
    skipCurrentPhoto,
    updateCurrentCaption,
  } = useVisaWorkflow();

  if (!photoFiles.length) {
    return (
      <>
        <StepHead
          eyebrow="Step 2 · Photos"
          title={
            <>
              No <em>photo files</em> selected
            </>
          }
          desc="You can go back to the docs step to assign raw photos, or continue once the photo document is not part of this run."
        />

        <VisaButtonRow align="between">
          <VisaButton onClick={onBack} size="sm" variant="ghost">
            ← Back
          </VisaButton>
        </VisaButtonRow>
      </>
    );
  }

  const progress = ((photoIndex + 1) / photoFiles.length) * 100;
  const previewText = buildPreviewText(
    currentCaption?.date ?? "",
    currentCaption?.people ?? "",
    currentCaption?.description ?? "",
    currentCaption?.formattedCaption ?? "",
  );

  return (
    <>
      <StepHead
        eyebrow={`Step 2 · Photo ${photoIndex + 1} of ${photoFiles.length}`}
        title={
          <>
            Caption the <em>photo gallery</em>
          </>
        }
        desc="Edit the date and caption metadata for each selected photo. The preview updates inline and the generated doc will use the saved caption text."
      />

      <div className="mb-3 flex justify-between font-mono text-[11px] text-ink-3">
        <span>
          {photoIndex + 1} / {photoFiles.length}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mb-4 h-0.5 overflow-hidden rounded-xs bg-rule">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Gallery</VisaPanelTitle>
          </VisaPanelHeader>
          <VisaPanelBody>
            <div className="grid gap-2">
              {photoFiles.map((fileName, index) => (
                <button
                  key={fileName}
                  type="button"
                  className={`overflow-hidden rounded-(--vd-radius) border p-2 text-left ${
                    index === photoIndex ? "border-accent bg-accent-soft" : "border-rule bg-paper"
                  }`}
                  onClick={() => selectPhotoIndex(index)}
                >
                  <div className="grid aspect-square place-items-center rounded-(--vd-radius) border border-dashed border-rule-2 bg-paper-2">
                    <span className="px-2 text-center font-mono text-[10px] text-ink-3">
                      {getMatchedFileDisplayName(fileName)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Photo details</VisaPanelTitle>
            <VisaMonoText className="text-ink-3">
              {currentPhotoFile ? getMatchedFileDisplayName(currentPhotoFile) : ""}
            </VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody>
            <div className="grid gap-4">
              <div
                className="relative grid aspect-4/3 place-items-center overflow-hidden rounded-(--vd-radius-lg) border border-rule"
                style={{
                  backgroundColor: "oklch(90% 0.02 85)",
                  backgroundImage:
                    "repeating-linear-gradient(135deg, transparent 0 18px, color-mix(in oklab, var(--ink-4) 20%, transparent) 18px 19px)",
                }}
              >
                <span className="absolute bottom-3 left-3 rounded-[3px] bg-[color-mix(in_oklab,var(--paper)_90%,transparent)] px-2 py-1 font-mono text-[10px] tracking-[0.06em] text-ink-3">
                  [ photo · {currentPhotoFile ? getMatchedFileDisplayName(currentPhotoFile) : ""} ]
                </span>
              </div>
              <VisaField>
                <VisaFieldLabel>Date taken</VisaFieldLabel>
                <VisaInput
                  type="date"
                  value={currentCaption?.date ?? ""}
                  onChange={(event) => updateCurrentCaption("date", event.target.value)}
                />
              </VisaField>
              <VisaField>
                <VisaFieldLabel>People in photo</VisaFieldLabel>
                <VisaInput
                  value={currentCaption?.people ?? ""}
                  onChange={(event) => updateCurrentCaption("people", event.target.value)}
                />
              </VisaField>
              <VisaField>
                <VisaFieldLabel>Description / occasion</VisaFieldLabel>
                <VisaTextarea
                  value={currentCaption?.description ?? ""}
                  onChange={(event) => updateCurrentCaption("description", event.target.value)}
                />
              </VisaField>

              <VisaCluster>
                <VisaButton onClick={formatCaptionWithAi} size="sm" variant="accent">
                  ✦ Format preview
                </VisaButton>
                <VisaMonoText className="text-ink-3">
                  caption saved into the generated photo doc
                </VisaMonoText>
              </VisaCluster>

              <div className="relative rounded-(--vd-radius) border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-accent-soft px-3.5 py-3 font-visa-display text-sm leading-normal text-accent-ink italic">
                <span className="absolute -top-2 left-3 bg-paper px-1.5 font-mono text-[9px] font-medium tracking-widest text-accent-ink not-italic">
                  PREVIEW
                </span>
                "{previewText}"
              </div>
            </div>
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaCluster>
          <VisaButton onClick={skipCurrentPhoto} size="sm">
            Skip this photo
          </VisaButton>
          <VisaButton onClick={saveCaptionAndContinue} variant="primary">
            {photoIndex < photoFiles.length - 1 ? "Save & next →" : "Save & continue →"}
          </VisaButton>
        </VisaCluster>
      </VisaButtonRow>
    </>
  );
}
