import {
  ACTIVE_DOCS,
  SCAN_LOG,
  SCANNED_FILES,
  type DocDates,
  type ScannedFile,
} from "../../visa-design/data";
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
  VisaMonoText,
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

type Props = {
  docDates: DocDates;
  onBack: () => void;
  onNext: () => void;
};

export function ScanStep({ docDates, onBack, onNext }: Props) {
  const detectedByDoc: Record<string, ScannedFile[]> = {};
  SCANNED_FILES.forEach((f) => {
    detectedByDoc[f.matchedTo] = detectedByDoc[f.matchedTo] || [];
    detectedByDoc[f.matchedTo].push(f);
  });

  return (
    <>
      <StepHead
        eyebrow="Step 1 · Scan"
        title={
          <>
            Reading <em>Drive</em>
          </>
        }
        desc={
          <>
            Searching <VisaMonoText>Documents requested</VisaMonoText> recursively and matching
            files to active doc types via regex.
          </>
        }
      />

      <VisaPanel>
        <VisaPanelHeader>
          <VisaPanelTitle>Detected — {SCANNED_FILES.length} files</VisaPanelTitle>
          <VisaMonoText className="text-(--ink-3)">4/4 doc types matched</VisaMonoText>
        </VisaPanelHeader>
        <VisaPanelBody tight>
          <DocumentList>
            {ACTIVE_DOCS.map((d) => {
              const files = detectedByDoc[d.id] || [];
              const v = docDates[d.id] || {};
              return (
                <DocumentRow
                  key={d.id}
                  number={d.number}
                  label={d.label}
                  badge={
                    <Badge kind={files.length ? "detected" : "pending"}>
                      {files.length
                        ? `${files.length} ${files.length === 1 ? "file" : "files"}`
                        : "pending"}
                    </Badge>
                  }
                  meta={
                    <DocumentMeta>
                      <DocumentMetaTag>
                        <DocCategoryLabel cat={d.category} />
                      </DocumentMetaTag>
                      {d.dateFormat === "range" && v.from && (
                        <DocumentMetaTag>{formatRange(v.from, v.to)}</DocumentMetaTag>
                      )}
                      {d.dateFormat === "single" && v.single && (
                        <DocumentMetaTag>{formatDate(v.single)}</DocumentMetaTag>
                      )}
                      {d.category === "gdoc_photos" && (
                        <DocumentMetaTag>dates per-photo</DocumentMetaTag>
                      )}
                    </DocumentMeta>
                  }
                  files={
                    files.length > 0 ? (
                      <DocumentFiles>
                        {files.map((f) => (
                          <DocumentFile key={f.name} trailing={f.size}>
                            {f.name}
                          </DocumentFile>
                        ))}
                      </DocumentFiles>
                    ) : null
                  }
                />
              );
            })}
          </DocumentList>
        </VisaPanelBody>
      </VisaPanel>

      <Console title="drive.scan" lines={SCAN_LOG} meta="completed in 2.4s" />

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaButton onClick={onNext} variant="primary">
          4 photos detected → Caption them
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}
