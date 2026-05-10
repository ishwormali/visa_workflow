import { createSessionFolderName } from "@/lib/visa-workflow";

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
  VisaCluster,
  VisaDimText,
  VisaMonoText,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "../../visa-design/primitives";
import { Badge, Console, DocCategoryLabel, StepHead, formatRange } from "../../visa-design/ui-bits";
import { useVisaWorkflow } from "../provider";

type Props = {
  onBack: () => void;
};

export function GenerateStep({ onBack }: Props) {
  const {
    activeDocTypes,
    documents,
    draftDate,
    generateDocuments,
    getPlannedDocumentFileName,
    logs,
  } = useVisaWorkflow();
  const folderName = createSessionFolderName(draftDate);

  return (
    <>
      <StepHead
        eyebrow="Step 3 · Generate"
        title={
          <>
            Build the <em>session bundle</em>
          </>
        }
        desc={
          <>
            The workflow will create a session folder, copy or generate files using the planned
            names below, then move you to the email draft preview.
          </>
        }
      />

      <div className="space-y-3">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Session folder</VisaPanelTitle>
            <VisaMonoText className="text-ink-3">draft date: {draftDate}</VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody>
            <VisaCluster>
              <VisaDimText>📁</VisaDimText>
              <VisaMonoText>Documents requested / {folderName} /</VisaMonoText>
            </VisaCluster>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Planned outputs · {activeDocTypes.length}</VisaPanelTitle>
          </VisaPanelHeader>
          <VisaPanelBody tight>
            <DocumentList>
              {activeDocTypes.map((docType) => {
                const document = documents.find((item) => item.docTypeId === docType.id);
                if (!document) return null;
                return (
                  <DocumentRow
                    key={docType.id}
                    number={docType.number}
                    label={docType.label}
                    badge={
                      <Badge kind={document.generatedFiles.length ? "ready" : "pending"}>
                        {document.generatedFiles.length ? "generated" : "planned"}
                      </Badge>
                    }
                    meta={
                      <DocumentMeta>
                        <DocumentMetaTag>
                          <DocCategoryLabel cat={docType.category} />
                        </DocumentMetaTag>
                        {document.dates.mode === "range" && (
                          <DocumentMetaTag>
                            {formatRange(document.dates.from, document.dates.to)}
                          </DocumentMetaTag>
                        )}
                        {docType.category === "gdoc_photos" && (
                          <DocumentMetaTag>
                            {document.captions.filter((caption) => !caption.skipped).length}{" "}
                            captions
                          </DocumentMetaTag>
                        )}
                      </DocumentMeta>
                    }
                    files={
                      <DocumentFiles>
                        {(document.generatedFiles.length
                          ? document.generatedFiles
                          : [getPlannedDocumentFileName(docType.id, document.matchedFiles[0])]
                        ).map((fileName) => (
                          <DocumentFile key={fileName}>{fileName}</DocumentFile>
                        ))}
                      </DocumentFiles>
                    }
                  />
                );
              })}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <Console
        title="drive.generate"
        lines={logs[3]}
        meta={`${logs[3].length} events`}
        emptyMessage="No generation events yet."
      />

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaButton onClick={() => void generateDocuments()} variant="primary">
          Generate files →
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}
