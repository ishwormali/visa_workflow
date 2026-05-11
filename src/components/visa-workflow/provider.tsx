import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { readStoredJson, writeStoredJson } from "@/lib/browser-storage";
import {
  copyGoogleDriveFile,
  createGoogleDocInDrive,
  createGoogleDriveFolder,
  downloadGoogleDriveFileAsBase64,
  listGoogleDriveFolders,
  listGoogleDriveFilesRecursively,
  moveGoogleDriveFile,
  readGoogleDriveDefaultRootFolderId,
  readGoogleDriveDocumentList,
  readGoogleDriveFileMetadata,
  readGoogleDrivePdfText,
  type GoogleDriveFile,
} from "@/lib/google-drive";
import {
  VISA_CONFIG_KEY,
  VISA_SESSIONS_KEY,
  analyzePdfText,
  buildPlannedFileName,
  buildEmailBody,
  compareMatchedFiles,
  createMatchedFileRef,
  createEmptyConfig,
  createDefaultDateValue,
  createEmailSubject,
  createSeededConfig,
  createSessionFolderName,
  createSessionRecord,
  createWorkflowDocumentState,
  formatDateLabel,
  inferPdfDates,
  parseDocumentList,
  readMatchedFileDisplayName,
  readMatchedFileId,
  matchesPdfAnalysis,
  type DocTypeConfig,
  type DocumentDateValue,
  type PhotoCaption,
  type PdfAnalysis,
  type VisaConfig,
  type VisaSessionRecord,
  type WorkflowDocumentState,
  type WorkflowStepValue,
} from "@/lib/visa-workflow";

export type WorkflowStep = WorkflowStepValue;
type StepWithLogs = 1 | 2 | 3 | 4 | 5;

type LogState = Record<StepWithLogs, string[]>;
type DriveFileIndex = {
  byId: Map<string, GoogleDriveFile>;
  byName: Map<string, GoogleDriveFile[]>;
};
type PdfAnalysisIndex = Map<string, PdfAnalysis>;

const STEP_ITEMS = [
  { id: 0, label: "Setup" },
  { id: 1, label: "Review Docs" },
  { id: 2, label: "Photos" },
  { id: 3, label: "Generate" },
  { id: 4, label: "Email" },
  { id: 5, label: "Done" },
] as const;

const EMPTY_CONFIG: VisaConfig = createEmptyConfig();

const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

function createEmptyDriveFileIndex(): DriveFileIndex {
  return {
    byId: new Map(),
    byName: new Map(),
  };
}

function normalizeWorkflowStep(step?: WorkflowStep) {
  if (step === undefined || step < 0) {
    return 0;
  }

  if (step > 5) {
    return 5;
  }

  return step;
}

function createInitialLogs(): LogState {
  return {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthIso() {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function createVisaFolderNameFromToDate(toDate: string) {
  const parsedDate = new Date(toDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const displayDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(parsedDate)
    .replace(/,/g, "")
    .replace(/\s+/g, "-");

  return `Visa-${displayDate}`;
}

export function formatDisplayDate(dateValue?: string) {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function wait(ms = 180) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function cloneDates(value: DocumentDateValue): DocumentDateValue {
  if (value.mode === "single") {
    return {
      mode: "single",
      date: value.date,
    };
  }

  return {
    mode: "range",
    from: value.from,
    to: value.to,
  };
}

function buildWorkflowDocuments(
  config: VisaConfig,
  sessions: VisaSessionRecord[],
): WorkflowDocumentState[] {
  const lastSession = sessions.find((session) => session.status === "sent") ?? sessions[0];
  const previousDocuments = new Map(
    lastSession?.documents.map((document) => [document.docTypeId, document]) ?? [],
  );

  return config.docTypes
    .filter((docType) => docType.active)
    .map((docType) => {
      const previous = previousDocuments.get(docType.id);

      return createWorkflowDocumentState(docType, {
        docTypeId: docType.id,
        dates: previous ? cloneDates(previous.dates) : createDefaultDateValue(docType.dateFormat),
        matchedFiles: [],
        generatedFiles: [],
        status: "pending",
        validationMessage: "",
        captions: [],
      });
    });
}

function buildWorkflowDocumentsFromSession(
  config: VisaConfig,
  session: VisaSessionRecord,
): WorkflowDocumentState[] {
  const savedDocuments = new Map(
    session.documents.map((document) => [document.docTypeId, document]),
  );

  return config.docTypes
    .filter((docType) => docType.active)
    .map((docType) => {
      const savedDocument = savedDocuments.get(docType.id);

      if (!savedDocument) {
        return createWorkflowDocumentState(docType, {
          docTypeId: docType.id,
          dates: createDefaultDateValue(docType.dateFormat),
          matchedFiles: [],
          generatedFiles: [],
          status: "pending",
          validationMessage: "",
          captions: [],
        });
      }

      return createWorkflowDocumentState(docType, {
        docTypeId: savedDocument.docTypeId,
        dates: cloneDates(savedDocument.dates),
        matchedFiles: savedDocument.matchedFiles ?? [],
        generatedFiles: savedDocument.generatedFiles ?? [],
        generatedDocId: savedDocument.generatedDocId,
        status: savedDocument.status,
        validationMessage: savedDocument.validationMessage,
        captions: savedDocument.captions,
      });
    });
}

function syncWorkflowDocuments(
  docTypes: DocTypeConfig[],
  currentDocuments: WorkflowDocumentState[],
) {
  const documentsById = new Map(currentDocuments.map((document) => [document.docTypeId, document]));

  return docTypes
    .filter((docType) => docType.active)
    .map((docType) => createWorkflowDocumentState(docType, documentsById.get(docType.id)));
}

function isNumberedDocumentFile(fileName: string, number?: number) {
  if (number === undefined) {
    return /^\d+[\s-]/.test(fileName);
  }

  return new RegExp(`^${number}[\\s\\-]`, "i").test(fileName);
}

function isImageFile(fileName: string) {
  return /\.(jpg|jpeg|heic|png)$/i.test(fileName);
}

function isPdfFile(file: Pick<GoogleDriveFile, "mimeType">) {
  return file.mimeType === "application/pdf";
}

function matchesFileNameHeuristic(docType: DocTypeConfig, file: GoogleDriveFile) {
  const fileName = file.name;

  switch (docType.id) {
    case "doc_4_savers":
      return (
        isPdfFile(file) &&
        /statement|cba|commbank|commonwealth/i.test(fileName) &&
        /saver|netbank saver/i.test(fileName) &&
        !isNumberedDocumentFile(fileName)
      );
    case "doc_4_smart":
      return (
        isPdfFile(file) &&
        /statement|cba|commbank|commonwealth/i.test(fileName) &&
        /smart|smart access/i.test(fileName) &&
        !isNumberedDocumentFile(fileName)
      );
    case "doc_7_whatsapp":
      return /^screenshot[\s_]/i.test(fileName) && /\.png$/i.test(fileName);
    case "doc_8_photos":
      return (
        isImageFile(fileName) &&
        !/^screenshot[\s_]/i.test(fileName) &&
        !isNumberedDocumentFile(fileName)
      );
    case "doc_43_phonebill":
      return (
        isPdfFile(file) &&
        /^uroj[\s_-]*phone[\s_-]*bill\b/i.test(fileName) &&
        !isNumberedDocumentFile(fileName, 43)
      );
    default:
      if (!docType.matchPattern) {
        return false;
      }

      try {
        return new RegExp(docType.matchPattern, "i").test(fileName);
      } catch {
        return false;
      }
  }
}

function matchesRawFile(docType: DocTypeConfig, file: GoogleDriveFile, pdfAnalysis?: PdfAnalysis) {
  if (docType.detection === "pdf_content" && isPdfFile(file) && pdfAnalysis) {
    return matchesPdfAnalysis(docType, pdfAnalysis) || matchesFileNameHeuristic(docType, file);
  }

  return matchesFileNameHeuristic(docType, file);
}

function buildMatchedDocuments(
  docTypes: DocTypeConfig[],
  currentDocuments: WorkflowDocumentState[],
  rawFiles: GoogleDriveFile[],
  pdfAnalyses: PdfAnalysisIndex,
): WorkflowDocumentState[] {
  const currentById = new Map(currentDocuments.map((document) => [document.docTypeId, document]));

  return docTypes
    .filter((docType) => docType.active)
    .map((docType) => {
      const currentDocument = currentById.get(docType.id) ?? createWorkflowDocumentState(docType);
      const matchedRawFiles = rawFiles.filter((file) =>
        matchesRawFile(docType, file, pdfAnalyses.get(file.id)),
      );
      const matchedFiles = matchedRawFiles
        .map((file) => createMatchedFileRef(file))
        .toSorted(compareMatchedFiles);
      const status = matchedFiles.length ? ("detected" as const) : ("pending" as const);
      let dates = currentDocument.dates;
      let validationMessage = "";

      if (matchedRawFiles.length && docType.detection === "pdf_content") {
        const matchedAnalyses = matchedRawFiles
          .map((file) => pdfAnalyses.get(file.id))
          .filter((analysis): analysis is PdfAnalysis => Boolean(analysis));

        if (!matchedAnalyses.length) {
          validationMessage =
            "Matched PDFs could not be read for date extraction. Review the dates manually.";
        } else {
          const inferred = inferPdfDates(docType, matchedAnalyses, currentDocument.dates);
          const unreadablePdfMessage =
            matchedAnalyses.length < matchedRawFiles.length
              ? "Some matched PDFs could not be read for date extraction. Review the dates manually."
              : "";

          dates = inferred.dates;
          validationMessage = inferred.validationMessage || unreadablePdfMessage;
        }
      }

      return {
        ...currentDocument,
        dates,
        matchedFiles,
        status,
        validationMessage,
      };
    });
}

function reconcileStoredDocTypes(storedDocTypes: DocTypeConfig[] | undefined) {
  if (!storedDocTypes?.length) {
    return EMPTY_CONFIG.docTypes.map((docType) => ({ ...docType }));
  }

  const defaultDocTypesById = new Map(
    EMPTY_CONFIG.docTypes.map((docType) => [docType.id, docType]),
  );

  return storedDocTypes.map((storedDocType) => {
    const defaultDocType = defaultDocTypesById.get(storedDocType.id);

    if (!defaultDocType) {
      return storedDocType;
    }

    return {
      ...defaultDocType,
      active: storedDocType.active,
    };
  });
}

function docTypesNeedRefresh(docTypes: DocTypeConfig[]) {
  const reconciledDocTypes = reconcileStoredDocTypes(docTypes);

  if (reconciledDocTypes.length !== docTypes.length) {
    return true;
  }

  return reconciledDocTypes.some((docType, index) => {
    const currentDocType = docTypes[index];

    return JSON.stringify(docType) !== JSON.stringify(currentDocType);
  });
}

function inferSetupDates(documents: WorkflowDocumentState[]) {
  const rangeDocument = documents.find((document) => document.dates.mode === "range");

  if (rangeDocument?.dates.mode === "range") {
    return {
      from: rangeDocument.dates.from,
      to: rangeDocument.dates.to,
    };
  }

  const singleDocument = documents.find((document) => document.dates.mode === "single");

  return {
    from: startOfMonthIso(),
    to: singleDocument?.dates.mode === "single" ? singleDocument.dates.date : todayIso(),
  };
}

function upsertSession(previousSessions: VisaSessionRecord[], nextSession: VisaSessionRecord) {
  const remainingSessions = previousSessions.filter((session) => session.id !== nextSession.id);

  return [nextSession, ...remainingSessions].toSorted((left, right) => {
    const leftDate = left.submittedAt ?? left.createdAt;
    const rightDate = right.submittedAt ?? right.createdAt;

    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function createCaptionId(fileName: string) {
  return `caption_${fileName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function formatCaptionDate(dateValue: string) {
  return formatDisplayDate(dateValue);
}

function createWorkflowId() {
  return `session_${Date.now()}`;
}

function normalizeGoogleDriveFolderId(rawValue: string) {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return "";
  }

  const folderPathMatch = trimmedValue.match(/\/folders\/([^/?#]+)/);

  if (folderPathMatch) {
    return decodeURIComponent(folderPathMatch[1]);
  }

  const queryIdMatch = trimmedValue.match(/[?&]id=([^&#]+)/);

  if (queryIdMatch) {
    return decodeURIComponent(queryIdMatch[1]);
  }

  return trimmedValue;
}

function createDriveFileIndex(files: GoogleDriveFile[]) {
  const index = createEmptyDriveFileIndex();

  for (const file of files) {
    const existingFiles = index.byName.get(file.name) ?? [];
    existingFiles.push(file);
    index.byId.set(file.id, file);
    index.byName.set(file.name, existingFiles);
  }

  return index;
}

function formatActionError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unexpected Google Drive error.";
}

function formatCaptionLine(caption: PhotoCaption) {
  if (caption.formattedCaption) {
    return caption.formattedCaption;
  }

  return `${formatCaptionDate(caption.date)}: ${caption.people || "Names"} + ${caption.description || "Description"}`;
}

function buildGeneratedDocumentContent(docType: DocTypeConfig, document: WorkflowDocumentState) {
  const lines = [
    `${docType.number} - ${docType.label}`,
    "",
    `Dates: ${formatDateLabel(document.dates)}`,
  ];

  if (docType.category === "gdoc_photos") {
    const captions = document.captions.filter((caption) => !caption.skipped);

    lines.push("", "Photo captions:");

    if (!captions.length) {
      lines.push("- No photo captions were captured for this session.");
      return lines.join("\n");
    }

    for (const caption of captions) {
      lines.push(`- ${formatCaptionLine(caption)}`);
    }

    return lines.join("\n");
  }

  lines.push("", "Matched Drive files:");

  if (!document.matchedFiles.length) {
    lines.push("- No Drive files matched this document type for the selected dates.");
    return lines.join("\n");
  }

  for (const fileName of document.matchedFiles) {
    lines.push(`- ${readMatchedFileDisplayName(fileName)}`);
  }

  return lines.join("\n");
}

function useVisaWorkflowState(options: { sessionId?: string } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState<VisaConfig>(EMPTY_CONFIG);
  const [sessions, setSessions] = useState<VisaSessionRecord[]>([]);
  const [documents, setDocuments] = useState<WorkflowDocumentState[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [seedSource, setSeedSource] = useState("");
  const [seedReview, setSeedReview] = useState<DocTypeConfig[]>([]);
  const [seedError, setSeedError] = useState("");
  const [seedLogs, setSeedLogs] = useState<string[]>([]);
  const [rootFolderInput, setRootFolderInput] = useState("");
  const [rootFolderError, setRootFolderError] = useState("");
  const [logs, setLogs] = useState<LogState>(createInitialLogs);
  const [draftDate, setDraftDate] = useState(todayIso());
  const [selectedFromDate, setSelectedFromDate] = useState(startOfMonthIso());
  const [selectedToDate, setSelectedToDate] = useState(todayIso());
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
  const [pendingDraftSync, setPendingDraftSync] = useState(false);
  const [emailPreview, setEmailPreview] = useState("");
  const [hasScanned, setHasScanned] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState(() => options.sessionId ?? createWorkflowId());
  const [missingSession, setMissingSession] = useState(false);
  const [visaFolderName, setVisaFolderName] = useState("");
  const [visaFolderId, setVisaFolderId] = useState("");
  const [visaFolderMissing, setVisaFolderMissing] = useState(false);
  const [rawFolderId, setRawFolderId] = useState("");
  const [rawFolderMissing, setRawFolderMissing] = useState(false);
  const [rawFolderFiles, setRawFolderFiles] = useState<GoogleDriveFile[]>([]);
  const scannedDriveFilesRef = useRef<DriveFileIndex>(createEmptyDriveFileIndex());
  const generatedDriveFilesRef = useRef<Map<string, GoogleDriveFile[]>>(new Map());
  const pdfAnalysesRef = useRef<PdfAnalysisIndex>(new Map());
  const sessionFolderRef = useRef<GoogleDriveFile | null>(null);

  const activeDocTypes = useMemo(
    () => config.docTypes.filter((docType) => docType.active),
    [config.docTypes],
  );
  const docTypesById = useMemo(
    () => new Map(activeDocTypes.map((docType) => [docType.id, docType])),
    [activeDocTypes],
  );
  const latestSession = sessions[0];
  const photoDocument = activeDocTypes.find((docType) => docType.category === "gdoc_photos");
  const photoState = photoDocument
    ? documents.find((document) => document.docTypeId === photoDocument.id)
    : undefined;
  const photoFiles = photoState?.matchedFiles ?? [];
  const currentPhotoFile = photoFiles[photoIndex];
  const currentCaption = currentPhotoFile
    ? photoState?.captions.find((caption) => caption.fileName === currentPhotoFile)
    : undefined;
  const draftSession = draftSessionId
    ? sessions.find((session) => session.id === draftSessionId)
    : undefined;
  const currentStepLabel =
    STEP_ITEMS.find((step) => step.id === normalizeWorkflowStep(currentStep))?.label ?? "Workflow";
  const sentSessionsCount = sessions.filter((session) => session.status === "sent").length;
  const pendingSessionsCount = sessions.filter((session) => session.status === "draft").length;
  const selectedRootFolderId =
    config.googleDriveRootFolderId ?? readGoogleDriveDefaultRootFolderId() ?? "";
  const selectedRootFolderName = config.googleDriveRootFolderName;

  useEffect(() => {
    const storedConfig = readStoredJson<VisaConfig>(VISA_CONFIG_KEY, EMPTY_CONFIG);
    const storedSessions = readStoredJson<VisaSessionRecord[]>(VISA_SESSIONS_KEY, []);
    const normalizedConfig: VisaConfig = {
      ...EMPTY_CONFIG,
      ...storedConfig,
      email: {
        ...EMPTY_CONFIG.email,
        ...storedConfig.email,
      },
      docTypes: reconcileStoredDocTypes(storedConfig.docTypes),
    };
    const targetSession = options.sessionId
      ? storedSessions.find((session) => session.id === options.sessionId)
      : undefined;

    const nextDocuments = targetSession
      ? buildWorkflowDocumentsFromSession(normalizedConfig, targetSession)
      : buildWorkflowDocuments(normalizedConfig, storedSessions);
    const setupDates = inferSetupDates(nextDocuments);

    const nextHasScanned = nextDocuments.some((document) => document.matchedFiles.length > 0);
    const nextHasGenerated = nextDocuments.some((document) => document.generatedFiles.length > 0);

    setConfig(normalizedConfig);
    setSessions(storedSessions);
    setDocuments(nextDocuments);
    setWorkflowId(targetSession?.id ?? options.sessionId ?? createWorkflowId());
    setMissingSession(Boolean(options.sessionId && !targetSession));
    setCurrentStep(normalizeWorkflowStep(targetSession?.currentStep));
    setDraftDate(targetSession?.draftDate ?? todayIso());
    setSelectedFromDate(setupDates.from);
    setSelectedToDate(setupDates.to);
    setDraftSessionId(targetSession?.id ?? null);
    setPendingDraftSync(false);
    setEmailPreview(
      targetSession
        ? buildEmailBody({
            config: normalizedConfig,
            documents: targetSession.documents,
          })
        : "",
    );
    setHasScanned(nextHasScanned);
    setHasGenerated(nextHasGenerated);
    setDraftReady(Boolean(targetSession?.status === "draft"));
    setPhotoIndex(0);
    setRootFolderInput(
      normalizedConfig.googleDriveRootFolderId ?? readGoogleDriveDefaultRootFolderId() ?? "",
    );
    setRootFolderError("");
    setVisaFolderName("");
    setVisaFolderId("");
    setVisaFolderMissing(false);
    setRawFolderId("");
    setRawFolderMissing(false);
    setRawFolderFiles([]);
    scannedDriveFilesRef.current = createEmptyDriveFileIndex();
    generatedDriveFilesRef.current = new Map();
    pdfAnalysesRef.current = new Map();
    sessionFolderRef.current = null;
    setHydrated(true);
  }, [options.sessionId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!docTypesNeedRefresh(config.docTypes)) {
      return;
    }

    setConfig((currentConfig) => ({
      ...currentConfig,
      docTypes: reconcileStoredDocTypes(currentConfig.docTypes),
    }));
  }, [config.docTypes, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeStoredJson(VISA_CONFIG_KEY, config);
  }, [config, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeStoredJson(VISA_SESSIONS_KEY, sessions);
  }, [hydrated, sessions]);

  useEffect(() => {
    if (!hydrated || !pendingDraftSync) {
      return;
    }

    const sessionId = draftSessionId ?? workflowId;
    const existingSession = sessions.find((session) => session.id === sessionId);
    const nextSession = createSessionRecord({
      id: sessionId,
      config,
      documents,
      draftDate,
      status: existingSession?.status === "sent" ? "sent" : "draft",
      filesMoved: existingSession?.filesMoved ?? false,
      currentStep,
      createdAt: existingSession?.createdAt,
      submittedAt: existingSession?.submittedAt,
    });

    setWorkflowId(nextSession.id);
    setDraftSessionId(nextSession.id);
    setSessions((currentSessions) => upsertSession(currentSessions, nextSession));
    setDraftReady(true);

    if (currentStep >= 4) {
      setEmailPreview(
        buildEmailBody({
          config,
          documents: nextSession.documents,
        }),
      );
    }

    setPendingDraftSync(false);
  }, [
    config,
    currentStep,
    documents,
    draftDate,
    draftSessionId,
    hydrated,
    pendingDraftSync,
    sessions,
    workflowId,
  ]);

  function appendSeedLog(message: string) {
    setSeedLogs((currentLogs) => [...currentLogs, `${new Date().toLocaleTimeString()} ${message}`]);
  }

  function appendLog(step: StepWithLogs, message: string) {
    setLogs((currentLogs) => ({
      ...currentLogs,
      [step]: [...currentLogs[step], `${new Date().toLocaleTimeString()} ${message}`],
    }));
  }

  function resolveRootFolderId(currentConfig = config) {
    const configuredRootFolderId = currentConfig.googleDriveRootFolderId?.trim();

    if (configuredRootFolderId) {
      return configuredRootFolderId;
    }

    const defaultRootFolderId = readGoogleDriveDefaultRootFolderId();

    if (defaultRootFolderId) {
      return defaultRootFolderId;
    }

    throw new Error(
      "Select a Google Drive root folder in step 1 or set VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID.",
    );
  }

  function resetWorkflow(nextConfig = config, nextSessions = sessions) {
    startTransition(() => {
      setDocuments(buildWorkflowDocuments(nextConfig, nextSessions));
      setCurrentStep(0);
      setLogs(createInitialLogs());
      setDraftDate(todayIso());
      setSelectedFromDate(startOfMonthIso());
      setSelectedToDate(todayIso());
      setDraftSessionId(null);
      setPendingDraftSync(false);
      setEmailPreview("");
      setHasScanned(false);
      setHasGenerated(false);
      setDraftReady(false);
      setPhotoIndex(0);
      setWorkflowId(createWorkflowId());
      setMissingSession(false);
      setVisaFolderName("");
      setVisaFolderId("");
      setVisaFolderMissing(false);
      setRawFolderId("");
      setRawFolderMissing(false);
      setRawFolderFiles([]);
      scannedDriveFilesRef.current = createEmptyDriveFileIndex();
      generatedDriveFilesRef.current = new Map();
      pdfAnalysesRef.current = new Map();
      sessionFolderRef.current = null;
    });
  }

  function getScannedDriveFile(fileRef: string) {
    const fileId = readMatchedFileId(fileRef);

    if (fileId) {
      return scannedDriveFilesRef.current.byId.get(fileId);
    }

    return scannedDriveFilesRef.current.byName.get(readMatchedFileDisplayName(fileRef))?.[0];
  }

  function getGeneratedDriveFile(docTypeId: string, fileName: string) {
    return generatedDriveFilesRef.current.get(docTypeId)?.find((file) => file.name === fileName);
  }

  function updateDocument(
    docTypeId: string,
    updater: (current: WorkflowDocumentState) => WorkflowDocumentState,
  ) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.docTypeId === docTypeId ? updater(document) : document,
      ),
    );
  }

  function updateConfigEmail<K extends keyof VisaConfig["email"]>(
    field: K,
    value: VisaConfig["email"][K],
  ) {
    setConfig((currentConfig) => ({
      ...currentConfig,
      email: {
        ...currentConfig.email,
        [field]: value,
      },
    }));
  }

  function toggleDocTypeActive(docTypeId: string, active: boolean) {
    setConfig((currentConfig) => {
      const nextDocTypes = currentConfig.docTypes.map((docType) =>
        docType.id === docTypeId ? { ...docType, active } : docType,
      );

      setDocuments((currentDocuments) => syncWorkflowDocuments(nextDocTypes, currentDocuments));

      return {
        ...currentConfig,
        docTypes: nextDocTypes,
      };
    });

    setPhotoIndex(0);
  }

  function handleSetupDateRange(field: "from" | "to", value: string) {
    const nextFrom = field === "from" ? value : selectedFromDate;
    const nextTo = field === "to" ? value : selectedToDate;

    if (field === "from") {
      setSelectedFromDate(value);
    } else {
      setSelectedToDate(value);
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        const docType = docTypesById.get(document.docTypeId);

        if (!docType) {
          return document;
        }

        if (document.dates.mode === "range") {
          return {
            ...document,
            dates: {
              mode: "range",
              from: nextFrom,
              to: nextTo,
            },
          };
        }

        return {
          ...document,
          dates: {
            mode: "single",
            date: nextTo,
          },
        };
      }),
    );

    setPendingDraftSync(true);
  }

  function toggleMatchedFile(docTypeId: string, file: Pick<GoogleDriveFile, "id" | "name">) {
    updateDocument(docTypeId, (document) => {
      const fileRef = createMatchedFileRef(file);
      const hasFile = document.matchedFiles.includes(fileRef);
      const matchedFiles = hasFile
        ? document.matchedFiles.filter((currentFileName) => currentFileName !== fileRef)
        : [...document.matchedFiles, fileRef].toSorted(compareMatchedFiles);
      const docType = docTypesById.get(docTypeId);
      let dates = document.dates;
      let validationMessage = "";

      if (docType?.detection === "pdf_content" && matchedFiles.length) {
        const matchedAnalyses = matchedFiles
          .map((currentFileRef) => {
            const currentFileId = readMatchedFileId(currentFileRef);

            return currentFileId ? pdfAnalysesRef.current.get(currentFileId) : undefined;
          })
          .filter((analysis): analysis is PdfAnalysis => Boolean(analysis));

        if (!matchedAnalyses.length) {
          validationMessage =
            "Matched PDFs could not be read for date extraction. Review the dates manually.";
        } else {
          const inferred = inferPdfDates(docType, matchedAnalyses, document.dates);
          const unreadablePdfMessage =
            matchedAnalyses.length < matchedFiles.length
              ? "Some matched PDFs could not be read for date extraction. Review the dates manually."
              : "";

          dates = inferred.dates;
          validationMessage = inferred.validationMessage || unreadablePdfMessage;
        }
      }

      return {
        ...document,
        dates,
        matchedFiles,
        status: matchedFiles.length ? "detected" : "pending",
        validationMessage,
      };
    });
  }

  function getPlannedDocumentFileName(docTypeId: string, sourceFileName?: string) {
    const docType = docTypesById.get(docTypeId);
    const document = documents.find((currentDocument) => currentDocument.docTypeId === docTypeId);

    if (!docType || !document) {
      return "";
    }

    return buildPlannedFileName(
      docType,
      document.dates,
      sourceFileName ? readMatchedFileDisplayName(sourceFileName) : undefined,
    );
  }

  async function selectRootFolder(folderIdOrUrl = rootFolderInput) {
    const nextRootFolderId = normalizeGoogleDriveFolderId(folderIdOrUrl);

    setRootFolderError("");

    if (!nextRootFolderId) {
      setRootFolderError("Paste a Google Drive folder URL or folder ID first.");
      return;
    }

    appendSeedLog("Verifying selected Google Drive root folder.");

    try {
      const folder = await readGoogleDriveFileMetadata(nextRootFolderId);

      if (folder.mimeType !== GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
        throw new Error("The selected Drive item is not a folder.");
      }

      const nextConfig: VisaConfig = {
        ...config,
        googleDriveRootFolderId: folder.id,
        googleDriveRootFolderName: folder.name,
      };

      setConfig(nextConfig);
      setRootFolderInput(folder.id);
      appendSeedLog(`Using ${folder.name} as the Google Drive root folder.`);

      if (folder.id !== config.googleDriveRootFolderId && config.docTypes.length) {
        resetWorkflow(nextConfig, sessions);
      }
    } catch (error) {
      const message = formatActionError(error);
      setRootFolderError(message);
      appendSeedLog(`Root folder verification failed: ${message}`);
    }
  }

  async function runSeedReview() {
    setSeedLogs([]);
    setSeedError("");
    setSeedReview([]);
    appendSeedLog("Authorizing Google Drive access.");

    let driveDocumentList = "";

    try {
      const rootFolderId = resolveRootFolderId();
      appendSeedLog("Looking for Document list under the configured Google Drive root folder.");
      driveDocumentList = await readGoogleDriveDocumentList(rootFolderId);
      setSeedSource(driveDocumentList);
      appendSeedLog("Read the latest Document list from Google Drive.");
    } catch (error) {
      const message = formatActionError(error);
      setSeedError(message);
      appendSeedLog(`Drive read failed: ${message}`);
      return;
    }

    appendSeedLog("Parsing Drive document table rows.");
    await wait();

    const parsed = parseDocumentList(driveDocumentList);

    if (!parsed.length) {
      setSeedError("Document list parse failed. Inspect the raw content below.");
      appendSeedLog("Parse failed. No valid document rows detected.");
      return;
    }

    setSeedReview(
      parsed.map((docType) => ({
        ...docType,
        active: docType.number === 4 || docType.number === 7 || docType.number === 8,
      })),
    );
    appendSeedLog(`Parsed ${parsed.length} document definitions for review.`);
  }

  function toggleSeedReviewDocType(docTypeId: string, active: boolean) {
    setSeedReview((currentDocTypes) =>
      currentDocTypes.map((currentDocType) =>
        currentDocType.id === docTypeId ? { ...currentDocType, active } : currentDocType,
      ),
    );
  }

  function saveSeedReview() {
    const nextDocTypes = seedReview.length ? seedReview : createSeededConfig(seedSource).docTypes;

    if (!nextDocTypes.length) {
      setSeedError("Read the live Document list before applying document types.");
      return;
    }

    const nextConfig: VisaConfig = {
      ...config,
      docTypes: nextDocTypes,
      seededAt: new Date().toISOString(),
    };

    setConfig(nextConfig);
    setShowSettings(false);
    resetWorkflow(nextConfig, sessions);
  }

  function handleDateChange(docTypeId: string, key: "date" | "from" | "to", value: string) {
    updateDocument(docTypeId, (document) => {
      if (document.dates.mode === "single") {
        return {
          ...document,
          dates: {
            mode: "single",
            date: value,
          },
          validationMessage: "",
        };
      }

      return {
        ...document,
        dates: {
          mode: "range",
          from: key === "from" ? value : document.dates.from,
          to: key === "to" ? value : document.dates.to,
        },
        validationMessage: "",
      };
    });

    setPendingDraftSync(true);
  }

  async function runScan() {
    if (!selectedFromDate || !selectedToDate) {
      appendLog(2, "Set both from and to dates before continuing.");
      return;
    }

    if (new Date(selectedFromDate).getTime() > new Date(selectedToDate).getTime()) {
      appendLog(2, "From date must be on or before the to date.");
      return;
    }

    setLogs((currentLogs) => ({
      ...currentLogs,
      2: [],
    }));
    setHasScanned(false);
    setVisaFolderMissing(false);
    setRawFolderMissing(false);
    setRawFolderFiles([]);
    setRawFolderId("");
    setVisaFolderId("");
    setVisaFolderName("");
    pdfAnalysesRef.current = new Map();
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => ({
        ...document,
        matchedFiles: [],
        status: "pending",
      })),
    );

    appendLog(2, "Authorizing Google Drive access.");

    let rootFolderId = "";
    const expectedFolderName = createVisaFolderNameFromToDate(selectedToDate);

    if (!expectedFolderName) {
      appendLog(2, "Selected to date is invalid. Update the date and retry.");
      return;
    }

    setVisaFolderName(expectedFolderName);

    try {
      rootFolderId = resolveRootFolderId();
      appendLog(2, `Looking for folder ${expectedFolderName} under the selected root folder.`);
      const rootFolders = await listGoogleDriveFolders(rootFolderId);
      const matchedVisaFolder = rootFolders.find(
        (folder) =>
          folder.name === expectedFolderName || folder.name.startsWith(`${expectedFolderName}-`),
      );

      if (!matchedVisaFolder) {
        setVisaFolderMissing(true);
        appendLog(2, `No matching folder found. Create ${expectedFolderName} to continue.`);
        setHasScanned(true);
        return;
      }

      setVisaFolderId(matchedVisaFolder.id);
      setVisaFolderName(matchedVisaFolder.name);
      appendLog(2, `Found folder ${matchedVisaFolder.name}. Checking for raw folder.`);

      const visaSubFolders = await listGoogleDriveFolders(matchedVisaFolder.id);
      const rawFolder = visaSubFolders.find((folder) => folder.name.trim().toLowerCase() === "raw");

      if (!rawFolder) {
        setRawFolderMissing(true);
        appendLog(2, "Raw folder not found under the Visa folder.");
        setHasScanned(true);
        return;
      }

      setRawFolderId(rawFolder.id);
      appendLog(2, "Raw folder found. Reading files recursively.");

      const rawFiles = await listGoogleDriveFilesRecursively(rawFolder.id);
      const pdfAnalyses: PdfAnalysisIndex = new Map();

      if (
        config.docTypes.some((docType) => docType.active && docType.detection === "pdf_content")
      ) {
        const pdfFiles = rawFiles.filter((file) => isPdfFile(file));

        if (pdfFiles.length) {
          appendLog(
            2,
            `Reading ${pdfFiles.length} PDF file(s) to classify statements and extract dates.`,
          );

          for (const file of pdfFiles) {
            try {
              const pdfText = await readGoogleDrivePdfText(file);
              pdfAnalyses.set(file.id, analyzePdfText(pdfText));
            } catch (error) {
              appendLog(2, `Could not inspect ${file.name}: ${formatActionError(error)}`);
            }
          }
        }
      }

      setRawFolderFiles(rawFiles);
      scannedDriveFilesRef.current = createDriveFileIndex(rawFiles);
      pdfAnalysesRef.current = pdfAnalyses;
      setDocuments((currentDocuments) =>
        buildMatchedDocuments(config.docTypes, currentDocuments, rawFiles, pdfAnalyses),
      );

      appendLog(
        2,
        rawFiles.length
          ? `Detected ${rawFiles.length} raw file(s) for later processing.`
          : "Raw folder is currently empty.",
      );
    } catch (error) {
      appendLog(2, `Drive lookup failed: ${formatActionError(error)}`);
      return;
    }

    await wait();
    appendLog(2, "Visa folder lookup complete.");
    setHasScanned(true);
  }

  async function createVisaFolderFromSelectedDate() {
    const expectedFolderName = createVisaFolderNameFromToDate(selectedToDate);

    if (!expectedFolderName) {
      appendLog(2, "Selected to date is invalid. Update the date and retry.");
      return;
    }

    try {
      const rootFolderId = resolveRootFolderId();
      appendLog(2, `Creating folder ${expectedFolderName}.`);
      const folder = await createGoogleDriveFolder(expectedFolderName, rootFolderId);
      setVisaFolderMissing(false);
      setVisaFolderName(folder.name);
      setVisaFolderId(folder.id);
      appendLog(2, `Created folder ${folder.name}.`);
    } catch (error) {
      appendLog(2, `Failed to create Visa folder: ${formatActionError(error)}`);
    }
  }

  async function createRawFolderInVisaFolder() {
    if (!visaFolderId) {
      appendLog(2, "Create the Visa folder first before adding raw.");
      return;
    }

    try {
      appendLog(2, "Creating raw folder under the Visa folder.");
      const folder = await createGoogleDriveFolder("raw", visaFolderId);
      setRawFolderMissing(false);
      setRawFolderId(folder.id);
      setRawFolderFiles([]);
      scannedDriveFilesRef.current = createDriveFileIndex([]);
      appendLog(2, `Created raw folder ${folder.name}.`);
    } catch (error) {
      appendLog(2, `Failed to create raw folder: ${formatActionError(error)}`);
    }
  }

  function continueAfterScan() {
    goToStep(2);
  }

  function goToStep(step: WorkflowStep) {
    setCurrentStep(normalizeWorkflowStep(step));
  }

  useEffect(() => {
    if (!currentPhotoFile || !photoDocument || !photoState) {
      return;
    }

    const existing = photoState.captions.find((caption) => caption.fileName === currentPhotoFile);

    if (existing) {
      return;
    }

    const defaultDate = photoState.dates.mode === "single" ? photoState.dates.date : todayIso();
    const nextCaption: PhotoCaption = {
      id: createCaptionId(currentPhotoFile),
      fileName: currentPhotoFile,
      date: defaultDate,
      people: "",
      description: "",
      formattedCaption: "",
      skipped: false,
    };

    updateDocument(photoDocument.id, (document) => ({
      ...document,
      captions: [...document.captions, nextCaption],
    }));
  }, [currentPhotoFile, photoDocument, photoState]);

  function updateCurrentCaption(
    field: keyof Omit<PhotoCaption, "id" | "fileName">,
    value: string | boolean,
  ) {
    if (!photoDocument || !currentPhotoFile) {
      return;
    }

    updateDocument(photoDocument.id, (document) => ({
      ...document,
      captions: document.captions.map((caption) =>
        caption.fileName === currentPhotoFile
          ? {
              ...caption,
              [field]: value,
            }
          : caption,
      ),
    }));

    if (field === "date") {
      setPendingDraftSync(true);
    }
  }

  function formatCaptionWithAi() {
    if (!currentCaption) {
      return;
    }

    const formattedCaption = `${formatCaptionDate(currentCaption.date)}: ${currentCaption.people || "Names"} + ${currentCaption.description || "Description"}`;
    updateCurrentCaption("formattedCaption", formattedCaption);
  }

  function saveCaptionAndContinue() {
    if (!photoDocument || !currentPhotoFile) {
      return;
    }

    updateDocument(photoDocument.id, (document) => ({
      ...document,
      status: "detected",
    }));

    if (photoIndex < photoFiles.length - 1) {
      setPhotoIndex((currentIndex) => currentIndex + 1);
      return;
    }

    setCurrentStep(3);
  }

  function skipCurrentPhoto() {
    updateCurrentCaption("skipped", true);
    saveCaptionAndContinue();
  }

  async function generateDocuments() {
    setLogs((currentLogs) => ({
      ...currentLogs,
      3: [],
    }));
    setHasGenerated(false);
    const nextDraftDate = todayIso();

    setDraftDate(nextDraftDate);
    appendLog(3, "Authorizing Google Drive access.");

    const nextFolderName = createSessionFolderName(nextDraftDate);

    try {
      const rootFolderId = resolveRootFolderId();
      appendLog(3, `Creating Drive subfolder ${nextFolderName}.`);
      const sessionFolder = await createGoogleDriveFolder(nextFolderName, rootFolderId);
      sessionFolderRef.current = sessionFolder;
      generatedDriveFilesRef.current = new Map();

      const nextDocuments: WorkflowDocumentState[] = [];

      for (const document of documents) {
        const docType = docTypesById.get(document.docTypeId);

        if (!docType) {
          nextDocuments.push(document);
          continue;
        }

        if (docType.category === "upload") {
          const sourceFiles = document.matchedFiles
            .map((fileName) => getScannedDriveFile(fileName))
            .filter((file): file is GoogleDriveFile => Boolean(file));

          if (!sourceFiles.length) {
            appendLog(3, `${docType.label}: skipped because no source files were detected.`);
            nextDocuments.push({
              ...document,
              generatedFiles: [],
              generatedDocId: undefined,
              status: "skipped",
            });
            continue;
          }

          const copiedFiles: GoogleDriveFile[] = [];

          for (const sourceFile of sourceFiles) {
            const nextFileName = buildPlannedFileName(docType, document.dates, sourceFile.name);
            const copiedFile = await copyGoogleDriveFile({
              fileId: sourceFile.id,
              name: nextFileName,
              parentId: sessionFolder.id,
            });

            copiedFiles.push(copiedFile);
          }

          generatedDriveFilesRef.current.set(docType.id, copiedFiles);
          appendLog(
            3,
            `${docType.label}: copied ${copiedFiles.length} upload attachment(s) into ${sessionFolder.name}.`,
          );
          nextDocuments.push({
            ...document,
            generatedFiles: copiedFiles.map((file) => file.name),
            generatedDocId: undefined,
            status: "ready",
          });
          continue;
        }

        if (docType.category === "gdoc_photos") {
          const usableCaptions = document.captions.filter((caption) => !caption.skipped);

          if (!usableCaptions.length) {
            appendLog(3, `${docType.label}: skipped because no photo captions were saved.`);
            nextDocuments.push({
              ...document,
              generatedFiles: [],
              generatedDocId: undefined,
              status: "skipped",
            });
            continue;
          }

          const googleDoc = await createGoogleDocInDrive({
            name: buildPlannedFileName(docType, document.dates),
            parentId: sessionFolder.id,
            content: buildGeneratedDocumentContent(docType, document),
          });

          generatedDriveFilesRef.current.set(docType.id, [googleDoc]);
          appendLog(
            3,
            `${docType.label}: generated Google Doc with ${usableCaptions.length} captions.`,
          );
          nextDocuments.push({
            ...document,
            generatedFiles: [googleDoc.name],
            generatedDocId: googleDoc.id,
            status: "ready",
          });
          continue;
        }

        const googleDoc = await createGoogleDocInDrive({
          name: buildPlannedFileName(docType, document.dates),
          parentId: sessionFolder.id,
          content: buildGeneratedDocumentContent(docType, document),
        });

        generatedDriveFilesRef.current.set(docType.id, [googleDoc]);
        appendLog(
          3,
          `${docType.label}: generated Google Doc using ${formatDateLabel(document.dates)}.`,
        );
        nextDocuments.push({
          ...document,
          generatedFiles: [googleDoc.name],
          generatedDocId: googleDoc.id,
          status: document.matchedFiles.length ? "ready" : "pending",
        });
      }

      setDocuments(nextDocuments);
      appendLog(3, "Document generation complete.");
      setHasGenerated(true);
      setCurrentStep(4);
    } catch (error) {
      appendLog(3, `Document generation failed: ${formatActionError(error)}`);
    }
  }

  async function createDraft() {
    setPendingDraftSync(false);
    setLogs((currentLogs) => ({
      ...currentLogs,
      4: [],
    }));

    const existingSession = sessions.find((session) => session.id === workflowId);
    const sessionId = draftSessionId ?? workflowId;
    const draftSessionRecord = createSessionRecord({
      id: sessionId,
      config,
      documents,
      draftDate,
      status: "draft",
      filesMoved: false,
      currentStep: 5,
      createdAt: existingSession?.createdAt,
    });
    const preview = buildEmailBody({
      config,
      documents: draftSessionRecord.documents,
    });

    setWorkflowId(sessionId);
    setDraftSessionId(sessionId);
    setEmailPreview(preview);
    appendLog(4, `Building Gmail draft subject: ${createEmailSubject(draftDate)}.`);
    await wait();

    for (const document of draftSessionRecord.documents) {
      for (const fileName of document.filenames) {
        const driveFile =
          getGeneratedDriveFile(document.docTypeId, fileName) ?? getScannedDriveFile(fileName);

        if (!driveFile) {
          appendLog(4, `Skipping ${fileName}; no matching Drive file metadata is available.`);
          continue;
        }

        try {
          await downloadGoogleDriveFileAsBase64(driveFile);
          appendLog(4, `Downloaded ${fileName} from Drive as base64.`);
        } catch (error) {
          appendLog(4, `Failed to download ${fileName} from Drive: ${formatActionError(error)}`);
        }

        await wait(120);
      }
    }

    appendLog(4, "Sending payload to Gmail draft adapter.");
    await wait();
    appendLog(4, "Draft created. Verify the Gmail drafts folder if anything looks uncertain.");
    setSessions((currentSessions) => upsertSession(currentSessions, draftSessionRecord));
    setDraftReady(true);
    setCurrentStep(5);
  }

  async function markEmailSent() {
    setPendingDraftSync(false);
    setLogs((currentLogs) => ({
      ...currentLogs,
      5: [],
    }));

    const existingSession = sessions.find((session) => session.id === workflowId);
    const submittedAt = new Date().toISOString();
    const sentRecord = createSessionRecord({
      id: draftSessionId ?? workflowId,
      config,
      documents,
      draftDate,
      status: "sent",
      filesMoved: true,
      currentStep: 5,
      createdAt: existingSession?.createdAt,
      submittedAt,
    });

    appendLog(5, `Recording sent session for ${formatDisplayDate(submittedAt)}.`);
    await wait();
    appendLog(5, `Renaming folder to ${sentRecord.folderName} if the submitted date changed.`);
    await wait();

    if (sessionFolderRef.current) {
      try {
        const rootFolderId = resolveRootFolderId();
        appendLog(5, "Moving generated files back to the configured Google Drive root folder.");

        for (const files of generatedDriveFilesRef.current.values()) {
          for (const file of files) {
            await moveGoogleDriveFile({
              fileId: file.id,
              addParentId: rootFolderId,
              removeParentIds: sessionFolderRef.current.parents?.length
                ? sessionFolderRef.current.parents
                : [sessionFolderRef.current.id],
            });
          }
        }

        await wait();
      } catch (error) {
        appendLog(5, `Drive move failed: ${formatActionError(error)}`);
      }
    } else {
      appendLog(
        5,
        "Skipping Drive move because no active session folder is attached to this browser session.",
      );
    }

    appendLog(5, "Session closed with status sent.");
    setSessions((currentSessions) => upsertSession(currentSessions, sentRecord));
    setWorkflowId(sentRecord.id);
    setDraftSessionId(sentRecord.id);
    setDraftReady(true);
    setCurrentStep(5);
  }

  function saveWorkflow() {
    setPendingDraftSync(false);
    const existingSession = sessions.find((session) => session.id === workflowId);
    const nextSession = createSessionRecord({
      id: workflowId,
      config,
      documents,
      draftDate,
      status: "draft",
      filesMoved: false,
      currentStep,
      createdAt: existingSession?.createdAt,
    });

    setSessions((currentSessions) => upsertSession(currentSessions, nextSession));
    setDraftSessionId(nextSession.id);
    setDraftReady(true);

    if (currentStep >= 4) {
      setEmailPreview(
        buildEmailBody({
          config,
          documents: nextSession.documents,
        }),
      );
    }
  }

  function markSessionSent(sessionId: string) {
    setSessions((currentSessions) => {
      const currentSession = currentSessions.find((session) => session.id === sessionId);

      if (!currentSession || currentSession.status === "sent") {
        return currentSessions;
      }

      const submittedAt = new Date().toISOString();
      const nextSession: VisaSessionRecord = {
        ...currentSession,
        updatedAt: submittedAt,
        submittedAt,
        folderName: createSessionFolderName(submittedAt),
        emailSubject: createEmailSubject(submittedAt),
        status: "sent",
        filesMoved: true,
        currentStep: 5,
      };

      return upsertSession(currentSessions, nextSession);
    });
  }

  function startNextSession() {
    resetWorkflow(config, sessions);
  }

  function toggleExpandedHistory(sessionId: string) {
    setExpandedHistoryId((currentId) => (currentId === sessionId ? null : sessionId));
  }

  return {
    activeDocTypes,
    closeHistory: () => setShowHistory(false),
    closeSettings: () => setShowSettings(false),
    config,
    continueAfterScan,
    createDraft,
    currentCaption,
    currentPhotoFile,
    currentStep,
    currentStepLabel,
    documents,
    draftDate,
    draftReady,
    draftSession,
    emailPreview,
    expandedHistoryId,
    formatCaptionWithAi,
    generateDocuments,
    getMatchedFileDisplayName: readMatchedFileDisplayName,
    goToStep,
    goToDraftStep: () => setCurrentStep(4),
    goToDoneStep: () => setCurrentStep(5),
    getPlannedDocumentFileName,
    handleDateChange,
    handleSetupDateRange,
    hasGenerated,
    hasScanned,
    hydrated,
    logs,
    selectedFromDate,
    selectedToDate,
    setSelectedFromDate,
    setSelectedToDate,
    latestSession,
    markEmailSent,
    markSessionSent,
    missingSession,
    openHistory: () => setShowHistory(true),
    openSettings: () => setShowSettings(true),
    pendingSessionsCount,
    photoFiles,
    photoIndex,
    selectPhotoIndex: setPhotoIndex,
    saveWorkflow,
    saveCaptionAndContinue,
    saveSeedReview,
    seedError,
    seedLogs,
    rootFolderError,
    visaFolderName,
    visaFolderId,
    visaFolderMissing,
    rawFolderId,
    rawFolderMissing,
    rawFolderFiles,
    rootFolderInput,
    seedReview,
    seedSource,
    sentSessionsCount,
    selectedRootFolderId,
    selectedRootFolderName,
    sessions,
    setSeedSource,
    setRootFolderInput,
    showHistory,
    showSettings,
    skipCurrentPhoto,
    skipPhotoStep: () => setCurrentStep(3),
    startNextSession,
    selectRootFolder,
    toggleDocTypeActive,
    toggleMatchedFile,
    toggleExpandedHistory,
    toggleSeedReviewDocType,
    updateConfigEmail,
    updateCurrentCaption,
    workflowId,
    runScan,
    createVisaFolderFromSelectedDate,
    createRawFolderInVisaFolder,
    runSeedReview,
  };
}

type VisaWorkflowContextValue = ReturnType<typeof useVisaWorkflowState>;

const VisaWorkflowContext = createContext<VisaWorkflowContextValue | null>(null);

export function VisaWorkflowProvider({ children }: { children: ReactNode }) {
  const value = useVisaWorkflowState();

  return <VisaWorkflowContext.Provider value={value}>{children}</VisaWorkflowContext.Provider>;
}

export function VisaWorkflowRouteProvider({
  children,
  sessionId,
}: {
  children: ReactNode;
  sessionId?: string;
}) {
  const value = useVisaWorkflowState({ sessionId });

  return <VisaWorkflowContext.Provider value={value}>{children}</VisaWorkflowContext.Provider>;
}

export function useVisaWorkflow() {
  const context = useContext(VisaWorkflowContext);

  if (!context) {
    throw new Error("useVisaWorkflow must be used within VisaWorkflowProvider");
  }

  return context;
}
