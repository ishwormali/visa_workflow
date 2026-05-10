import type { DocTypeConfig, EmailConfig } from "./types";

export const VISA_CONFIG_KEY = "visa_config";
export const VISA_SESSIONS_KEY = "visa_sessions";

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  toEmail: "",
  ccEmail: "",
  greeting: "Team",
  signOff: "Applicant",
};

export const DEFAULT_DOC_TYPES: DocTypeConfig[] = [
  {
    id: "doc_4_savers",
    number: 4,
    label: "Joint statements - savers account",
    category: "upload",
    dateFormat: "range",
    detection: "pdf_content",
    active: true,
    fileNamePrefix: "4 - joint statements savers account",
    matchPattern: "^4[\\s\\-].*savers",
  },
  {
    id: "doc_4_smart",
    number: 4,
    label: "Joint statements - smart account",
    category: "upload",
    dateFormat: "range",
    detection: "pdf_content",
    active: true,
    fileNamePrefix: "4 - joint statements smart account",
    matchPattern: "^4[\\s\\-].*smart",
  },
  {
    id: "doc_7_whatsapp",
    number: 7,
    label: "WhatsApp chat history",
    category: "gdoc",
    active: true,
    dateFormat: "range",
    detection: "filename",
    fileNamePrefix: "7 - WhatsApp chat history",
    docHeader: "WHATSAPP CHAT HISTORY",
    generateDoc: true,
    matchPattern: "^7[\\s\\-].*[Ww]hatsapp",
  },
  {
    id: "doc_8_photos",
    number: 8,
    label: "Photographs of relationship",
    category: "gdoc_photos",
    dateFormat: "single",
    detection: "filename",
    active: true,
    fileNamePrefix: "8 - Photographs of relationship",
    docHeader: "PHOTOGRAPHS OF RELATIONSHIP",
    generateDoc: true,
    requiresCaptions: true,
    matchPattern: "^8[\\s\\-].*[Pp]hotograph",
  },
  {
    id: "doc_43_phonebill",
    number: 43,
    label: "Applicant phone bill",
    category: "upload",
    dateFormat: "single",
    detection: "pdf_content",
    active: true,
    fileNamePrefix: "43 - Applicant phone bill",
    matchPattern: "^43[\\s\\-]",
  },
];
