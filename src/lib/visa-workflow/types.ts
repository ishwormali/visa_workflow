export type DocCategory = "upload" | "gdoc" | "gdoc_photos";
export type DateFormat = "single" | "range";
export type DocDetection = "filename" | "pdf_content";
export type SessionStatus = "draft" | "sent";
export type DocProgressStatus = "detected" | "pending" | "ready" | "skipped" | "sent" | "draft";

export type EmailConfig = {
  toEmail: string;
  ccEmail: string;
  greeting: string;
  signOff: string;
};

export type DocTypeConfig = {
  id: string;
  number: number;
  label: string;
  category: DocCategory;
  dateFormat: DateFormat;
  detection: DocDetection;
  active: boolean;
  matchPattern?: string;
  fileNamePrefix?: string;
  docHeader?: string;
  generateDoc?: boolean;
  requiresCaptions?: boolean;
};

export type DocumentDateValue =
  | {
      mode: "single";
      date: string;
    }
  | {
      mode: "range";
      from: string;
      to: string;
    };

export type PhotoCaption = {
  id: string;
  fileName: string;
  date: string;
  people: string;
  description: string;
  formattedCaption: string;
  skipped: boolean;
};

export type WorkflowStepValue = 0 | 1 | 2 | 3 | 4 | 5;

export type WorkflowDocumentState = {
  docTypeId: string;
  dates: DocumentDateValue;
  matchedFiles: string[];
  generatedFiles: string[];
  generatedDocId?: string;
  status: DocProgressStatus;
  validationMessage?: string;
  captions: PhotoCaption[];
};

export type SessionDocumentRecord = {
  docTypeId: string;
  number: number;
  label: string;
  category: DocCategory;
  dateFormat: DateFormat;
  dates: DocumentDateValue;
  dateLabel: string;
  filenames: string[];
  matchedFiles: string[];
  generatedFiles: string[];
  generatedDocId?: string;
  status: DocProgressStatus;
  validationMessage?: string;
  captions: PhotoCaption[];
};

export type VisaSessionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  draftDate: string;
  folderName: string;
  emailSubject: string;
  status: SessionStatus;
  filesMoved: boolean;
  currentStep: WorkflowStepValue;
  documents: SessionDocumentRecord[];
};

export type VisaConfig = {
  email: EmailConfig;
  docTypes: DocTypeConfig[];
  googleDriveRootFolderId?: string;
  googleDriveRootFolderName?: string;
  seededAt?: string;
};
