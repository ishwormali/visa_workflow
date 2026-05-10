import {
  ACTIVE_DOCS,
  PAST_SESSIONS,
  type DocDates,
  type EmailConfig,
} from "../../visa-design/data";
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
  VisaDimText,
  VisaInput,
  VisaMonoText,
  VisaMutedText,
  VisaNotice,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "../../visa-design/primitives";
import { Badge, DocCategoryLabel, StepHead, formatDate, formatRange } from "../../visa-design/ui-bits";

type Props = {
  docDates: DocDates;
  setDocDates: React.Dispatch<React.SetStateAction<DocDates>>;
  emailConfig: EmailConfig;
  onNext: () => void;
  onEditEmail: () => void;
};

export function SetupStep({ docDates, setDocDates, emailConfig, onNext, onEditEmail }: Props) {
  const lastSession = PAST_SESSIONS[0];

  const updateDate = (id: string, key: "from" | "to" | "single", val: string) => {
    setDocDates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: val },
    }));
  };

  const allValid = ACTIVE_DOCS.every((d) => {
    const v = docDates[d.id] || {};
    if (d.category === "gdoc_photos") return true;
    if (d.dateFormat === "range") return v.from && v.to;
    return v.single;
  });

  return (
    <>
      <StepHead
        eyebrow="Step 0 · Monthly setup"
        title={
          <>
            This month's <em>submission</em>
          </>
        }
        desc="Confirm the date ranges for each document. Defaults are pulled from your last submission."
      />

      <VisaNotice icon="↩">
        <div>
          Last submitted on <strong>{lastSession.submittedAtPretty}</strong> with{" "}
          <strong>{lastSession.docs.length} documents</strong>. That's <strong>9 days ago</strong>.
        </div>
      </VisaNotice>

      <div className="space-y-3">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Email config</VisaPanelTitle>
            <VisaButton onClick={onEditEmail} size="sm" variant="ghost">
              Edit ↗
            </VisaButton>
          </VisaPanelHeader>
          <VisaPanelBody>
            <VisaCluster className="gap-y-1.5">
              <VisaMutedText>
                <VisaMonoText>to:</VisaMonoText>
              </VisaMutedText>
              <span>{emailConfig.to}</span>
              <VisaDimText>·</VisaDimText>
              <VisaMutedText>
                <VisaMonoText>cc:</VisaMonoText>
              </VisaMutedText>
              <span>{emailConfig.cc}</span>
              <VisaDimText>·</VisaDimText>
              <VisaMutedText>
                <VisaMonoText>sign-off:</VisaMonoText>
              </VisaMutedText>
              <span>{emailConfig.signoff}</span>
            </VisaCluster>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Active doc types · {ACTIVE_DOCS.length}</VisaPanelTitle>
            <VisaMonoText className="text-(--ink-3)">edit dates inline</VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody tight>
            <DocumentList>
              {ACTIVE_DOCS.map((d) => {
                const v = docDates[d.id] || {};
                return (
                  <DocumentRow
                    key={d.id}
                    number={d.number}
                    label={d.label}
                    badge={
                      <Badge kind={d.category === "gdoc_photos" ? "active" : "pending"}>
                        {d.category === "gdoc_photos" ? "auto" : "needs dates"}
                      </Badge>
                    }
                    meta={
                      <DocumentMeta>
                        <DocumentMetaTag>
                          <DocCategoryLabel cat={d.category} />
                        </DocumentMetaTag>
                        {d.matchPattern && <DocumentMetaTag>{d.matchPattern}</DocumentMetaTag>}
                        {d.dateFormat === "range" && v.from && v.to && (
                          <DocumentMetaTag>{formatRange(v.from, v.to)}</DocumentMetaTag>
                        )}
                        {d.dateFormat === "single" && v.single && (
                          <DocumentMetaTag>{formatDate(v.single)}</DocumentMetaTag>
                        )}
                      </DocumentMeta>
                    }
                  >
                    {d.category !== "gdoc_photos" && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {d.dateFormat === "range" ? (
                          <>
                            <VisaInput
                              type="date"
                              className="max-w-44"
                              value={v.from || ""}
                              onChange={(e) => updateDate(d.id, "from", e.target.value)}
                            />
                            <VisaDimText>→</VisaDimText>
                            <VisaInput
                              type="date"
                              className="max-w-44"
                              value={v.to || ""}
                              onChange={(e) => updateDate(d.id, "to", e.target.value)}
                            />
                          </>
                        ) : (
                          <VisaInput
                            type="date"
                            className="max-w-44"
                            value={v.single || ""}
                            onChange={(e) => updateDate(d.id, "single", e.target.value)}
                          />
                        )}
                      </div>
                    )}
                  </DocumentRow>
                );
              })}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <VisaButtonRow align="right">
        <VisaButton onClick={onNext} variant="primary" disabled={!allValid}>
          Scan Drive →
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}
