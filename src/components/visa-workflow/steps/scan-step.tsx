import { useEffect, useMemo, useState } from "react";

import {
  DocumentFile,
  DocumentFiles,
  DocumentList,
  DocumentMeta,
  DocumentMetaTag,
  DocumentRow,
} from "../../visa-design/document-list";
import {
  VisaButton,
  VisaButtonRow,
  VisaInput,
  VisaMonoText,
  VisaNotice,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "../../visa-design/primitives";
import {
  Badge,
  Console,
  DocCategoryLabel,
  StepHead,
  formatDate,
  formatRange,
} from "../../visa-design/ui-bits";
import { useVisaWorkflow } from "../provider";

type Props = {
  onBack: () => void;
  onNext: () => void;
};

function readCandidateFiles(docTypeId: string, rawFileNames: string[]) {
  switch (docTypeId) {
    case "doc_4_savers":
    case "doc_4_smart":
    case "doc_43_phonebill":
      return rawFileNames.filter((fileName) => /\.pdf$/i.test(fileName));
    case "doc_7_whatsapp":
      return rawFileNames.filter((fileName) => /^screenshot[\s_]/i.test(fileName));
    case "doc_8_photos":
      return rawFileNames.filter(
        (fileName) =>
          /\.(jpg|jpeg|heic|png)$/i.test(fileName) && !/^screenshot[\s_]/i.test(fileName),
      );
    default:
      return rawFileNames;
  }
}

export function ScanStep({ onBack, onNext }: Props) {
  const {
    activeDocTypes,
    createRawFolderInVisaFolder,
    createVisaFolderFromSelectedDate,
    documents,
    getPlannedDocumentFileName,
    handleDateChange,
    logs,
    rawFolderFiles,
    rawFolderId,
    rawFolderMissing,
    rootFolderError,
    rootFolderInput,
    runScan,
    selectRootFolder,
    selectedRootFolderId,
    selectedRootFolderName,
    toggleMatchedFile,
    setRootFolderInput,
    visaFolderId,
    visaFolderMissing,
    visaFolderName,
  } = useVisaWorkflow();
  const [selectedDocId, setSelectedDocId] = useState(activeDocTypes[0]?.id ?? "");

  useEffect(() => {
    if (!activeDocTypes.length) {
      setSelectedDocId("");
      return;
    }

    if (!activeDocTypes.some((docType) => docType.id === selectedDocId)) {
      setSelectedDocId(activeDocTypes[0]?.id ?? "");
    }
  }, [activeDocTypes, selectedDocId]);

  const selectedDocType = activeDocTypes.find((docType) => docType.id === selectedDocId);
  const selectedDocument = documents.find((document) => document.docTypeId === selectedDocId);
  const rawFileNames = rawFolderFiles.map((file) => file.name);
  const candidateFiles = useMemo(
    () => (selectedDocType ? readCandidateFiles(selectedDocType.id, rawFileNames) : rawFileNames),
    [rawFileNames, selectedDocType],
  );
  const canContinue = activeDocTypes.length > 0;

  return (
    <>
      <StepHead
        eyebrow="Step 1 · Review docs"
        title={
          <>
            Match <em>raw files</em> to docs
          </>
        }
        desc={
          <>
            Select the Drive root, scan the raw folder, then review each selected doc type. The
            filename preview updates from the current dates and selected raw file.
          </>
        }
      />

      {rootFolderError ? (
        <VisaNotice kind="warn" icon="!">
          <div>{rootFolderError}</div>
        </VisaNotice>
      ) : null}

      <div className="space-y-3">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Drive source</VisaPanelTitle>
            <VisaButton size="sm" variant="primary" onClick={() => void runScan()}>
              Scan raw files
            </VisaButton>
          </VisaPanelHeader>
          <VisaPanelBody>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <VisaInput
                value={rootFolderInput}
                onChange={(event) => setRootFolderInput(event.target.value)}
                placeholder="Paste Drive folder URL or ID"
              />
              <VisaButton size="sm" onClick={() => void selectRootFolder()}>
                Use folder
              </VisaButton>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-ink-3">
              <VisaMonoText>{selectedRootFolderName || "No root folder selected"}</VisaMonoText>
              {selectedRootFolderId ? (
                <VisaMonoText>id: {selectedRootFolderId}</VisaMonoText>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {visaFolderMissing ? (
                <VisaButton size="sm" onClick={() => void createVisaFolderFromSelectedDate()}>
                  Create visa folder
                </VisaButton>
              ) : null}
              {visaFolderId ? (
                <VisaMonoText>Visa folder: {visaFolderName || visaFolderId}</VisaMonoText>
              ) : null}
              {rawFolderMissing ? (
                <VisaButton size="sm" onClick={() => void createRawFolderInVisaFolder()}>
                  Create raw folder
                </VisaButton>
              ) : null}
              {rawFolderId ? <VisaMonoText>Raw folder ready</VisaMonoText> : null}
            </div>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Selected documents</VisaPanelTitle>
            <VisaMonoText className="text-ink-3">
              {rawFolderFiles.length} raw files found
            </VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody>
            <div className="mb-4 flex flex-wrap gap-2">
              {activeDocTypes.map((docType) => {
                const document = documents.find((item) => item.docTypeId === docType.id);
                const matchCount = document?.matchedFiles.length ?? 0;
                return (
                  <VisaButton
                    key={docType.id}
                    size="sm"
                    variant={selectedDocId === docType.id ? "primary" : "ghost"}
                    onClick={() => setSelectedDocId(docType.id)}
                  >
                    {docType.number}. {docType.label}
                    <span className="font-mono text-[10px] text-current/70">{matchCount}</span>
                  </VisaButton>
                );
              })}
            </div>

            {selectedDocType && selectedDocument ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-4">
                  <div className="rounded-(--vd-radius) border border-rule bg-paper p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-ink">{selectedDocType.label}</div>
                        <div className="mt-1 flex flex-wrap gap-2 font-mono text-[11px] text-ink-3">
                          <span>
                            <DocCategoryLabel cat={selectedDocType.category} />
                          </span>
                          <span>{selectedDocType.detection}</span>
                        </div>
                      </div>
                      <Badge kind={selectedDocument.matchedFiles.length ? "detected" : "pending"}>
                        {selectedDocument.matchedFiles.length
                          ? `${selectedDocument.matchedFiles.length} selected`
                          : "awaiting raw files"}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedDocument.dates.mode === "range" ? (
                        <>
                          <label
                            className="flex flex-col gap-1"
                            htmlFor={`${selectedDocType.id}-from`}
                          >
                            <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                              From
                            </span>
                            <VisaInput
                              id={`${selectedDocType.id}-from`}
                              type="date"
                              value={selectedDocument.dates.from}
                              onChange={(event) =>
                                handleDateChange(selectedDocType.id, "from", event.target.value)
                              }
                            />
                          </label>
                          <label
                            className="flex flex-col gap-1"
                            htmlFor={`${selectedDocType.id}-to`}
                          >
                            <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                              To
                            </span>
                            <VisaInput
                              id={`${selectedDocType.id}-to`}
                              type="date"
                              value={selectedDocument.dates.to}
                              onChange={(event) =>
                                handleDateChange(selectedDocType.id, "to", event.target.value)
                              }
                            />
                          </label>
                        </>
                      ) : (
                        <label
                          className="flex flex-col gap-1 sm:col-span-2"
                          htmlFor={`${selectedDocType.id}-date`}
                        >
                          <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                            Date
                          </span>
                          <VisaInput
                            id={`${selectedDocType.id}-date`}
                            type="date"
                            value={selectedDocument.dates.date}
                            onChange={(event) =>
                              handleDateChange(selectedDocType.id, "date", event.target.value)
                            }
                          />
                        </label>
                      )}
                    </div>

                    <div className="mt-4 rounded-(--vd-radius) border border-dashed border-rule-2 bg-paper-2 p-3">
                      <div className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                        Planned output name
                      </div>
                      <div className="mt-1 text-sm text-ink">
                        {getPlannedDocumentFileName(
                          selectedDocType.id,
                          selectedDocument.matchedFiles[0],
                        )}
                      </div>
                      <div className="mt-2 font-mono text-[11px] text-ink-3">
                        {selectedDocument.dates.mode === "range"
                          ? formatRange(selectedDocument.dates.from, selectedDocument.dates.to)
                          : formatDate(selectedDocument.dates.date)}
                      </div>
                    </div>

                    {selectedDocument.matchedFiles.length ? (
                      <DocumentFiles>
                        {selectedDocument.matchedFiles.map((fileName) => (
                          <DocumentFile key={fileName}>{fileName}</DocumentFile>
                        ))}
                      </DocumentFiles>
                    ) : null}
                  </div>

                  <div className="rounded-(--vd-radius) border border-rule bg-paper p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-ink">Raw files</div>
                      <VisaMonoText className="text-ink-3">
                        {candidateFiles.length} candidates
                      </VisaMonoText>
                    </div>

                    {candidateFiles.length ? (
                      <DocumentList>
                        {candidateFiles.map((fileName) => {
                          const file = rawFolderFiles.find((item) => item.name === fileName);
                          const selected = selectedDocument.matchedFiles.includes(fileName);
                          return (
                            <DocumentRow
                              key={fileName}
                              number={selectedDocType.number}
                              label={fileName}
                              badge={
                                <Badge kind={selected ? "active" : "inactive"}>
                                  {selected ? "selected" : "raw"}
                                </Badge>
                              }
                              meta={
                                <DocumentMeta>
                                  <DocumentMetaTag>{file?.mimeType ?? "file"}</DocumentMetaTag>
                                  <DocumentMetaTag>
                                    {selected ? "included in this doc" : "click to include"}
                                  </DocumentMetaTag>
                                </DocumentMeta>
                              }
                            >
                              <div className="mt-2">
                                <VisaButton
                                  size="sm"
                                  variant={selected ? "primary" : "ghost"}
                                  onClick={() => toggleMatchedFile(selectedDocType.id, fileName)}
                                >
                                  {selected ? "Remove" : "Use this file"}
                                </VisaButton>
                              </div>
                            </DocumentRow>
                          );
                        })}
                      </DocumentList>
                    ) : (
                      <div className="text-sm text-ink-3">
                        No raw files match this document type yet. Scan the raw folder again or add
                        files into the Drive raw folder.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-(--vd-radius) border border-rule bg-paper p-4">
                  <div className="text-sm font-medium text-ink">Run summary</div>
                  <div className="mt-3 space-y-3 font-mono text-[11px] text-ink-2">
                    <div>
                      <div className="text-ink-3">Selected docs</div>
                      <div>{activeDocTypes.length}</div>
                    </div>
                    <div>
                      <div className="text-ink-3">Visa folder</div>
                      <div>{visaFolderName || (visaFolderMissing ? "missing" : "not scanned")}</div>
                    </div>
                    <div>
                      <div className="text-ink-3">Raw folder</div>
                      <div>{rawFolderId || (rawFolderMissing ? "missing" : "not scanned")}</div>
                    </div>
                    <div>
                      <div className="text-ink-3">Selected for this doc</div>
                      <div>{selectedDocument.matchedFiles.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-ink-3">
                Select at least one document type in setup to review raw files here.
              </div>
            )}
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <Console
        title="drive.scan"
        lines={logs[2]}
        meta={`${logs[2].length} events`}
        emptyMessage="No scan events yet."
      />

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaButton onClick={onNext} variant="primary" disabled={!canContinue}>
          Continue →
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}
