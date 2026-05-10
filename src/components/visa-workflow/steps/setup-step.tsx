import {
  DocumentList,
  DocumentMeta,
  DocumentMetaTag,
  DocumentRow,
} from "../../visa-design/document-list";
import {
  VisaButton,
  VisaButtonRow,
  VisaCluster,
  VisaInput,
  VisaMonoText,
  VisaNotice,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "../../visa-design/primitives";
import { Badge, DocCategoryLabel, StepHead, formatRange } from "../../visa-design/ui-bits";
import { useVisaWorkflow } from "../provider";

type Props = {
  onNext: () => void;
};

function formatDetectionLabel(mode: string) {
  return mode === "pdf_content" ? "PDF content" : "Filename";
}

export function SetupStep({ onNext }: Props) {
  const {
    activeDocTypes,
    config,
    handleSetupDateRange,
    latestSession,
    openSettings,
    selectedFromDate,
    selectedToDate,
    toggleDocTypeActive,
  } = useVisaWorkflow();

  const allValid =
    activeDocTypes.length > 0 &&
    Boolean(selectedFromDate) &&
    Boolean(selectedToDate) &&
    new Date(selectedFromDate).getTime() <= new Date(selectedToDate).getTime();

  return (
    <>
      <StepHead
        eyebrow="Step 0 · Setup"
        title={
          <>
            Select the <em>submission window</em>
          </>
        }
        desc="Pick the date range for this run and the document types you want to include. The next step will let you review raw files and preview final names for each selected document."
      />

      {latestSession ? (
        <VisaNotice icon="↩">
          <div>
            Last saved session <strong>{latestSession.folderName}</strong> on{" "}
            <strong>{latestSession.submittedAt ?? latestSession.draftDate}</strong> with{" "}
            <strong>{latestSession.documents.length} documents</strong>.
          </div>
        </VisaNotice>
      ) : null}

      <div className="space-y-3">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Submission window</VisaPanelTitle>
            <VisaMonoText className="text-ink-3">{activeDocTypes.length} selected</VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1" htmlFor="setup-from-date">
                <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                  From
                </span>
                <VisaInput
                  id="setup-from-date"
                  type="date"
                  value={selectedFromDate}
                  onChange={(event) => handleSetupDateRange("from", event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1" htmlFor="setup-to-date">
                <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                  To
                </span>
                <VisaInput
                  id="setup-to-date"
                  type="date"
                  value={selectedToDate}
                  onChange={(event) => handleSetupDateRange("to", event.target.value)}
                />
              </label>
            </div>
            <VisaCluster className="mt-3 text-ink-3">
              <VisaMonoText>{formatRange(selectedFromDate, selectedToDate)}</VisaMonoText>
              <span>will be applied as the default range for selected document types.</span>
            </VisaCluster>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Document types</VisaPanelTitle>
            <VisaMonoText className="text-ink-3">toggle what this run should generate</VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody tight>
            {!config.docTypes.length ? (
              <VisaNotice icon="i">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Load document types from Google Drive before starting this workflow.</span>
                  <VisaButton size="sm" variant="primary" onClick={openSettings}>
                    Open settings
                  </VisaButton>
                </div>
              </VisaNotice>
            ) : null}
            <DocumentList>
              {config.docTypes
                .toSorted(
                  (left, right) =>
                    left.number - right.number || left.label.localeCompare(right.label),
                )
                .map((docType) => {
                  return (
                    <DocumentRow
                      key={docType.id}
                      number={docType.number}
                      label={docType.label}
                      inactive={!docType.active}
                      badge={
                        <Badge kind={docType.active ? "active" : "inactive"}>
                          {docType.active ? "selected" : "inactive"}
                        </Badge>
                      }
                      meta={
                        <DocumentMeta>
                          <DocumentMetaTag>
                            <DocCategoryLabel cat={docType.category} />
                          </DocumentMetaTag>
                          <DocumentMetaTag>{docType.dateFormat}</DocumentMetaTag>
                          <DocumentMetaTag>
                            {formatDetectionLabel(docType.detection)}
                          </DocumentMetaTag>
                          {docType.requiresCaptions ? (
                            <DocumentMetaTag>captions required</DocumentMetaTag>
                          ) : null}
                        </DocumentMeta>
                      }
                    >
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <VisaButton
                          size="sm"
                          variant={docType.active ? "primary" : "ghost"}
                          onClick={() => toggleDocTypeActive(docType.id, !docType.active)}
                        >
                          {docType.active ? "Remove from run" : "Use in this run"}
                        </VisaButton>
                        {docType.fileNamePrefix ? (
                          <VisaMonoText className="text-ink-3">
                            {docType.fileNamePrefix}
                          </VisaMonoText>
                        ) : null}
                      </div>
                    </DocumentRow>
                  );
                })}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <VisaButtonRow align="right">
        <VisaButton onClick={onNext} variant="primary" disabled={!allValid}>
          Review selected docs →
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}
