import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Dialog, DialogFooter, DialogTrigger } from "../ui/dialog";
import {
  DocumentList,
  DocumentMeta,
  DocumentMetaTag,
  DocumentRow,
} from "../visa-design/document-list";
import {
  VisaButton,
  VisaDivider,
  VisaField,
  VisaFieldGrid,
  VisaFieldLabel,
  VisaInput,
  VisaModalHeader,
  VisaModalTitle,
  VisaMonoText,
  VisaNotice,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
  VisaTextarea,
} from "../visa-design/primitives";
import { Badge, Console, DocCategoryLabel } from "../visa-design/ui-bits";
import { WorkflowDialogContent } from "./components/workflow-dialog";
import { useVisaWorkflow } from "./provider";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

function formatDetectionLabel(mode: string) {
  return mode === "pdf_content" ? "PDF content" : "Filename";
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const {
    config,
    rootFolderError,
    rootFolderInput,
    runSeedReview,
    saveSeedReview,
    seedError,
    seedLogs,
    seedReview,
    selectRootFolder,
    selectedRootFolderId,
    selectedRootFolderName,
    setRootFolderInput,
    toggleDocTypeActive,
    toggleSeedReviewDocType,
    updateConfigEmail,
  } = useVisaWorkflow();
  const [draft, setDraft] = useState(() => ({
    email: { ...config.email },
    docTypes: config.docTypes.map((docType) => ({ ...docType })),
  }));
  const [refreshingSeed, setRefreshingSeed] = useState(false);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft({
        email: { ...config.email },
        docTypes: config.docTypes.map((docType) => ({ ...docType })),
      });
    }

    wasOpenRef.current = open;
  }, [config, open]);

  async function handleRefreshDocumentList() {
    setRefreshingSeed(true);

    try {
      await runSeedReview();
    } finally {
      setRefreshingSeed(false);
    }
  }

  function handleApplyDocumentList() {
    if (!seedReview.length) {
      return;
    }

    saveSeedReview();
    setDraft((currentDraft) => ({
      ...currentDraft,
      docTypes: seedReview.map((docType) => ({ ...docType })),
    }));
  }

  function handleSave() {
    if (draft.email.toEmail !== config.email.toEmail) {
      updateConfigEmail("toEmail", draft.email.toEmail);
    }

    if (draft.email.ccEmail !== config.email.ccEmail) {
      updateConfigEmail("ccEmail", draft.email.ccEmail);
    }

    if (draft.email.greeting !== config.email.greeting) {
      updateConfigEmail("greeting", draft.email.greeting);
    }

    if (draft.email.signOff !== config.email.signOff) {
      updateConfigEmail("signOff", draft.email.signOff);
    }

    for (const docType of draft.docTypes) {
      const currentDocType = config.docTypes.find((item) => item.id === docType.id);

      if (currentDocType && currentDocType.active !== docType.active) {
        toggleDocTypeActive(docType.id, docType.active);
      }
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<VisaButton variant="ghost" size={"sm"} />}>
        <Settings size={14} />
        Settings
      </DialogTrigger>

      <WorkflowDialogContent
        className={"max-h-[calc(100vh-4rem)] max-w-130 overflow-auto"}
        showCloseButton={true}
      >
        <VisaModalHeader>
          <VisaModalTitle>Settings</VisaModalTitle>
        </VisaModalHeader>

        <div className="overflow-y-auto px-6 pb-6">
          <VisaField className="mb-3">
            <VisaFieldLabel>To</VisaFieldLabel>
            <VisaInput
              value={draft.email.toEmail}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  email: {
                    ...currentDraft.email,
                    toEmail: event.target.value,
                  },
                }))
              }
            />
          </VisaField>
          <VisaField className="mb-3">
            <VisaFieldLabel>CC</VisaFieldLabel>
            <VisaInput
              value={draft.email.ccEmail}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  email: {
                    ...currentDraft.email,
                    ccEmail: event.target.value,
                  },
                }))
              }
            />
          </VisaField>
          <VisaFieldGrid className="mb-3">
            <VisaField>
              <VisaFieldLabel>Greeting</VisaFieldLabel>
              <VisaTextarea
                rows={4}
                value={draft.email.greeting}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    email: {
                      ...currentDraft.email,
                      greeting: event.target.value,
                    },
                  }))
                }
              />
            </VisaField>
            <VisaField>
              <VisaFieldLabel>Sign-off</VisaFieldLabel>
              <VisaTextarea
                rows={4}
                value={draft.email.signOff}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    email: {
                      ...currentDraft.email,
                      signOff: event.target.value,
                    },
                  }))
                }
              />
            </VisaField>
          </VisaFieldGrid>
          <VisaDivider />
          <VisaPanel className="mb-4">
            <VisaPanelHeader>
              <div>
                <VisaPanelTitle>Drive root folder</VisaPanelTitle>
                <VisaMonoText className="mt-0.5 block text-ink-3">
                  Select the base Google Drive folder used for scans and Document list lookup.
                </VisaMonoText>
              </div>
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

              {rootFolderError ? (
                <VisaNotice className="mt-3" kind="warn" icon="!">
                  <div>{rootFolderError}</div>
                </VisaNotice>
              ) : null}
            </VisaPanelBody>
          </VisaPanel>
          <VisaPanel className="mb-4">
            <VisaPanelHeader>
              <div>
                <VisaPanelTitle>Document list</VisaPanelTitle>
                <VisaMonoText className="mt-0.5 block text-ink-3">
                  Read the live Google Drive document list from the selected root folder and apply
                  the parsed document types.
                </VisaMonoText>
              </div>
              <VisaButton
                size="sm"
                variant="primary"
                onClick={() => void handleRefreshDocumentList()}
                disabled={refreshingSeed}
              >
                {refreshingSeed ? "Refreshing..." : "Refresh from Drive"}
              </VisaButton>
            </VisaPanelHeader>
            <VisaPanelBody>
              {config.seededAt ? (
                <VisaMonoText className="text-ink-3">
                  Last synced {new Date(config.seededAt).toLocaleString()}
                </VisaMonoText>
              ) : (
                <VisaMonoText className="text-ink-3">
                  No document list sync has been run yet. Default document types are active.
                </VisaMonoText>
              )}

              {seedError ? (
                <VisaNotice className="mt-3" kind="warn" icon="!">
                  <div>{seedError}</div>
                </VisaNotice>
              ) : null}

              <Console
                title="Document list sync"
                lines={seedLogs}
                emptyMessage="Run a refresh to load the latest document list from Google Drive."
              />

              {seedReview.length ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-[13px] text-ink">Review parsed document types</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-3">
                      Toggle which document types should stay active before applying them.
                    </div>
                  </div>
                  <div className="rounded-(--vd-radius) border border-rule">
                    <DocumentList>
                      {seedReview
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
                                </DocumentMeta>
                              }
                            >
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <VisaButton
                                  size="sm"
                                  variant={docType.active ? "primary" : "ghost"}
                                  onClick={() =>
                                    toggleSeedReviewDocType(docType.id, !docType.active)
                                  }
                                >
                                  {docType.active ? "Remove from run" : "Use in this run"}
                                </VisaButton>
                              </div>
                            </DocumentRow>
                          );
                        })}
                    </DocumentList>
                  </div>
                  <div className="flex justify-end">
                    <VisaButton size="sm" variant="primary" onClick={handleApplyDocumentList}>
                      Apply document list
                    </VisaButton>
                  </div>
                </div>
              ) : null}
            </VisaPanelBody>
          </VisaPanel>
          <div className="mb-3">
            <div className="text-[13px] text-ink">Document types</div>
            <div className="mt-0.5 font-mono text-[11px] text-ink-3">
              Toggle which document types stay active for this workflow.
            </div>
          </div>
          {!draft.docTypes.length ? (
            <VisaNotice className="mb-3" icon="i">
              <div>Refresh the document list above to load document types from Google Drive.</div>
            </VisaNotice>
          ) : null}
          <div className="rounded-(--vd-radius) border border-rule">
            <DocumentList>
              {draft.docTypes
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
                        </DocumentMeta>
                      }
                    >
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <VisaButton
                          size="sm"
                          variant={docType.active ? "primary" : "ghost"}
                          onClick={() =>
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              docTypes: currentDraft.docTypes.map((currentDocType) =>
                                currentDocType.id === docType.id
                                  ? { ...currentDocType, active: !currentDocType.active }
                                  : currentDocType,
                              ),
                            }))
                          }
                        >
                          {docType.active ? "Remove from run" : "Use in this run"}
                        </VisaButton>
                      </div>
                    </DocumentRow>
                  );
                })}
            </DocumentList>
          </div>
          <DialogFooter>
            <VisaButton size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </VisaButton>
            <VisaButton onClick={handleSave} size="sm" variant="primary">
              Save
            </VisaButton>
          </DialogFooter>
        </div>
      </WorkflowDialogContent>
    </Dialog>
  );
};
