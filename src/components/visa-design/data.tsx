import type { ReactNode } from "react";

import { VisaAccentText, VisaDimText, VisaMonoFileText } from "./primitives";

export type DocCategory = "upload" | "gdoc" | "gdoc_photos";
export type DateFormat = "single" | "range";

export type DocType = {
  id: string;
  number: number;
  label: string;
  category: DocCategory;
  dateFormat: DateFormat;
  active: boolean;
  matchPattern?: string;
  note?: string;
};

export const MOCK_DOC_TYPES: DocType[] = [
  {
    id: "doc_1_upload",
    number: 1,
    label: "Marriage certificate",
    category: "upload",
    dateFormat: "single",
    active: false,
    note: "static",
  },
  {
    id: "doc_2_upload",
    number: 2,
    label: "Passport copies (both)",
    category: "upload",
    dateFormat: "single",
    active: false,
    note: "static",
  },
  {
    id: "doc_3_upload",
    number: 3,
    label: "Visa application form (DS-160)",
    category: "upload",
    dateFormat: "single",
    active: false,
    note: "one-off",
  },
  {
    id: "doc_4_upload_savers",
    number: 4,
    label: "Joint statements — savers account",
    category: "upload",
    dateFormat: "range",
    active: true,
    matchPattern: "^4[\\s\\-].*savers",
  },
  {
    id: "doc_4_upload_smart",
    number: 4,
    label: "Joint statements — smart account",
    category: "upload",
    dateFormat: "range",
    active: true,
    matchPattern: "^4[\\s\\-].*smart",
  },
  {
    id: "doc_5_upload",
    number: 5,
    label: "Tenancy agreement",
    category: "upload",
    dateFormat: "single",
    active: false,
    note: "static",
  },
  {
    id: "doc_6_upload",
    number: 6,
    label: "Employer letter",
    category: "upload",
    dateFormat: "single",
    active: false,
    note: "one-off",
  },
  {
    id: "doc_7_gdoc",
    number: 7,
    label: "WhatsApp chat history",
    category: "gdoc",
    dateFormat: "range",
    active: true,
    matchPattern: "^7[\\s\\-].*[Ww]hatsapp",
  },
  {
    id: "doc_8_gdoc_photos",
    number: 8,
    label: "Photographs of relationship",
    category: "gdoc_photos",
    dateFormat: "single",
    active: true,
    matchPattern: "^8[\\s\\-].*[Pp]hotograph",
  },
];

export const ACTIVE_DOCS = MOCK_DOC_TYPES.filter((d) => d.active);

export type DateValue = { from?: string; to?: string; single?: string };
export type DocDates = Record<string, DateValue>;

export const LAST_DATES: DocDates = {
  doc_4_upload_savers: { from: "2026-01-01", to: "2026-04-30" },
  doc_4_upload_smart: { from: "2026-01-01", to: "2026-04-30" },
  doc_7_gdoc: { from: "2026-01-01", to: "2026-04-30" },
  doc_8_gdoc_photos: { single: "2026-04-22" },
};

export type ScannedFile = {
  name: string;
  size: string;
  matchedTo: string;
  detectedAt: number;
};

export const SCANNED_FILES: ScannedFile[] = [
  {
    name: "4 - savers - Apr 2026.pdf",
    size: "184 KB",
    matchedTo: "doc_4_upload_savers",
    detectedAt: 1,
  },
  {
    name: "4 - smart account - Apr 2026.pdf",
    size: "212 KB",
    matchedTo: "doc_4_upload_smart",
    detectedAt: 2,
  },
  {
    name: "7 - whatsapp jan-apr.txt",
    size: "1.8 MB",
    matchedTo: "doc_7_gdoc",
    detectedAt: 3,
  },
  {
    name: "8 - photograph - dinner.jpg",
    size: "2.4 MB",
    matchedTo: "doc_8_gdoc_photos",
    detectedAt: 4,
  },
  {
    name: "8 - photograph - hike.jpg",
    size: "3.1 MB",
    matchedTo: "doc_8_gdoc_photos",
    detectedAt: 5,
  },
  {
    name: "8 - photograph - diwali.jpg",
    size: "2.8 MB",
    matchedTo: "doc_8_gdoc_photos",
    detectedAt: 6,
  },
  {
    name: "8 - photograph - parents.jpg",
    size: "2.1 MB",
    matchedTo: "doc_8_gdoc_photos",
    detectedAt: 7,
  },
];

export type Photo = {
  id: string;
  file: string;
  label: string;
  date: string;
  people: string;
  description: string;
  formatted: string;
  bg: string;
};

export const PHOTOS: Photo[] = [
  {
    id: "p1",
    file: "8 - photograph - dinner.jpg",
    label: "Anniversary dinner",
    date: "2026-02-14",
    people: "Aman, Priya",
    description: "Anniversary dinner at Dishoom, Covent Garden",
    formatted:
      "14-February-2026: Aman & Priya at our 2nd anniversary dinner at Dishoom Covent Garden",
    bg: "oklch(72% 0.06 30)",
  },
  {
    id: "p2",
    file: "8 - photograph - hike.jpg",
    label: "Lake District hike",
    date: "2026-03-08",
    people: "Aman, Priya, Rohan",
    description: "Hiking Helvellyn with our friend Rohan",
    formatted: "08-March-2026: Aman, Priya, and Rohan hiking Helvellyn in the Lake District",
    bg: "oklch(72% 0.06 150)",
  },
  {
    id: "p3",
    file: "8 - photograph - diwali.jpg",
    label: "Diwali at home",
    date: "2026-04-10",
    people: "Aman, Priya, Mum, Dad, Neha",
    description: "Diwali dinner at our flat with my parents and sister",
    formatted:
      "10-April-2026: Aman, Priya, Mum, Dad and Neha celebrating Diwali at our flat in London",
    bg: "oklch(72% 0.07 60)",
  },
  {
    id: "p4",
    file: "8 - photograph - parents.jpg",
    label: "Priya's parents visit",
    date: "2026-04-22",
    people: "Priya, Aman, Priya's parents",
    description: "Priya's parents visiting us from Pune",
    formatted: "22-April-2026: Priya, Aman and Priya's parents during their visit from Pune",
    bg: "oklch(72% 0.05 240)",
  },
];

export type SessionDoc = {
  number: number;
  label: string;
  range: string;
  files: string[];
};

export type PastSession = {
  id: string;
  submittedAt: string;
  submittedAtPretty: string;
  folderName: string;
  subject: string;
  status: "sent" | "draft";
  filesMoved: boolean;
  docs: SessionDoc[];
};

export const PAST_SESSIONS: PastSession[] = [
  {
    id: "s-2026-04",
    submittedAt: "2026-04-26",
    submittedAtPretty: "26-Apr-2026",
    folderName: "Visa-Apr-2026",
    subject: "Visa Application Documents - 26-April-2026",
    status: "sent",
    filesMoved: true,
    docs: [
      {
        number: 4,
        label: "Joint statements — savers account",
        range: "01-Jan to 31-Mar 2026",
        files: ["4 - savers - Mar 2026.pdf"],
      },
      {
        number: 4,
        label: "Joint statements — smart account",
        range: "01-Jan to 31-Mar 2026",
        files: ["4 - smart account - Mar 2026.pdf"],
      },
      {
        number: 7,
        label: "WhatsApp chat history",
        range: "01-Jan to 31-Mar 2026",
        files: ["7-whatsapp-history.gdoc"],
      },
      {
        number: 8,
        label: "Photographs of relationship",
        range: "4 photos",
        files: ["8-photographs.gdoc"],
      },
    ],
  },
  {
    id: "s-2026-03",
    submittedAt: "2026-03-24",
    submittedAtPretty: "24-Mar-2026",
    folderName: "Visa-Mar-2026",
    subject: "Visa Application Documents - 24-March-2026",
    status: "sent",
    filesMoved: true,
    docs: [
      {
        number: 4,
        label: "Joint statements — savers account",
        range: "01-Dec-2025 to 28-Feb-2026",
        files: ["4 - savers - Feb 2026.pdf"],
      },
      {
        number: 4,
        label: "Joint statements — smart account",
        range: "01-Dec-2025 to 28-Feb-2026",
        files: ["4 - smart account - Feb 2026.pdf"],
      },
      {
        number: 7,
        label: "WhatsApp chat history",
        range: "01-Dec-2025 to 28-Feb-2026",
        files: ["7-whatsapp-history.gdoc"],
      },
      {
        number: 8,
        label: "Photographs of relationship",
        range: "3 photos",
        files: ["8-photographs.gdoc"],
      },
    ],
  },
  {
    id: "s-2026-02",
    submittedAt: "2026-02-22",
    submittedAtPretty: "22-Feb-2026",
    folderName: "Visa-Feb-2026",
    subject: "Visa Application Documents - 22-February-2026",
    status: "sent",
    filesMoved: true,
    docs: [
      {
        number: 4,
        label: "Joint statements — savers account",
        range: "01-Nov-2025 to 31-Jan-2026",
        files: ["4 - savers - Jan 2026.pdf"],
      },
      {
        number: 4,
        label: "Joint statements — smart account",
        range: "01-Nov-2025 to 31-Jan-2026",
        files: ["4 - smart account - Jan 2026.pdf"],
      },
      {
        number: 7,
        label: "WhatsApp chat history",
        range: "01-Nov-2025 to 31-Jan-2026",
        files: ["7-whatsapp-history.gdoc"],
      },
      {
        number: 8,
        label: "Photographs of relationship",
        range: "5 photos",
        files: ["8-photographs.gdoc"],
      },
    ],
  },
];

export type EmailConfig = {
  to: string;
  cc: string;
  greeting: string;
  signoff: string;
};

export const EMAIL_CONFIG: EmailConfig = {
  to: "documents@visa-coordinator.example",
  cc: "priya.sharma@example.com",
  greeting: "team",
  signoff: "Aman & Priya",
};

export type LogMark = "ok" | "warn" | "err" | "api" | "·";
export type LogLine = { t: string; m: LogMark; text: ReactNode };

export const SCAN_LOG: LogLine[] = [
  {
    t: "14:02:11",
    m: "api",
    text: 'GET /drive/files?q=root_folder("Documents requested")',
  },
  {
    t: "14:02:11",
    m: "ok",
    text: (
      <>
        Found root folder <VisaMonoFileText>Documents requested</VisaMonoFileText>{" "}
        <VisaDimText>(id: 1aB2c…fghi)</VisaDimText>
      </>
    ),
  },
  {
    t: "14:02:12",
    m: "api",
    text: 'GET /drive/files?q=parents("1aB2c...")&recursive=true',
  },
  {
    t: "14:02:13",
    m: "ok",
    text: (
      <>
        Listed <VisaAccentText>7 files</VisaAccentText> across{" "}
        <VisaAccentText>3 subfolders</VisaAccentText>
      </>
    ),
  },
  {
    t: "14:02:13",
    m: "·",
    text: <VisaDimText>Auto-matching against 4 active doc types…</VisaDimText>,
  },
  {
    t: "14:02:13",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>4 - savers - Apr 2026.pdf</VisaMonoFileText> → doc 4 savers
      </>
    ),
  },
  {
    t: "14:02:13",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>4 - smart account - Apr 2026.pdf</VisaMonoFileText> → doc 4 smart
      </>
    ),
  },
  {
    t: "14:02:13",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>7 - whatsapp jan-apr.txt</VisaMonoFileText> → doc 7 chat history
      </>
    ),
  },
  {
    t: "14:02:13",
    m: "ok",
    text: <>4 photos → doc 8 relationship photos</>,
  },
  {
    t: "14:02:14",
    m: "·",
    text: (
      <>
        <VisaAccentText>Scan complete.</VisaAccentText> 4/4 active types matched.
      </>
    ),
  },
];

export const GENERATE_LOG: LogLine[] = [
  {
    t: "14:11:02",
    m: "api",
    text: 'POST /drive/folders { name: "Visa-May-2026" }',
  },
  {
    t: "14:11:03",
    m: "ok",
    text: (
      <>
        Created session folder <VisaMonoFileText>Visa-May-2026</VisaMonoFileText>
      </>
    ),
  },
  {
    t: "14:11:04",
    m: "·",
    text: <VisaDimText>Processing doc 4 (savers, upload)…</VisaDimText>,
  },
  {
    t: "14:11:04",
    m: "ok",
    text: (
      <>
        Renamed <VisaMonoFileText>4 - savers - Apr 2026.pdf</VisaMonoFileText>
      </>
    ),
  },
  {
    t: "14:11:05",
    m: "·",
    text: <VisaDimText>Processing doc 4 (smart, upload)…</VisaDimText>,
  },
  {
    t: "14:11:05",
    m: "ok",
    text: (
      <>
        Renamed <VisaMonoFileText>4 - smart account - Apr 2026.pdf</VisaMonoFileText>
      </>
    ),
  },
  {
    t: "14:11:06",
    m: "api",
    text: "POST /drive/files (gdoc) — WhatsApp chat history",
  },
  {
    t: "14:11:08",
    m: "ok",
    text: (
      <>
        Generated <VisaMonoFileText>7-whatsapp-history.gdoc</VisaMonoFileText>{" "}
        <VisaDimText>(2,118 lines, Jan 1 → Apr 30)</VisaDimText>
      </>
    ),
  },
  {
    t: "14:11:09",
    m: "api",
    text: "POST /drive/files (gdoc) — Photographs of relationship",
  },
  {
    t: "14:11:11",
    m: "ok",
    text: (
      <>
        Generated <VisaMonoFileText>8-photographs.gdoc</VisaMonoFileText>{" "}
        <VisaDimText>(4 photos with captions)</VisaDimText>
      </>
    ),
  },
  {
    t: "14:11:12",
    m: "api",
    text: "PATCH Document list — appending session entries",
  },
  {
    t: "14:11:12",
    m: "ok",
    text: (
      <>
        <VisaAccentText>Done.</VisaAccentText> 4 documents ready for email.
      </>
    ),
  },
];

export const EMAIL_LOG: LogLine[] = [
  {
    t: "14:14:01",
    m: "·",
    text: <VisaDimText>Downloading 4 attachments from Drive…</VisaDimText>,
  },
  {
    t: "14:14:02",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>4 - savers - Apr 2026.pdf</VisaMonoFileText>{" "}
        <VisaDimText>184 KB → b64</VisaDimText>
      </>
    ),
  },
  {
    t: "14:14:03",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>4 - smart account - Apr 2026.pdf</VisaMonoFileText>{" "}
        <VisaDimText>212 KB → b64</VisaDimText>
      </>
    ),
  },
  {
    t: "14:14:04",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>7-whatsapp-history.gdoc</VisaMonoFileText>{" "}
        <VisaDimText>96 KB → b64</VisaDimText>
      </>
    ),
  },
  {
    t: "14:14:05",
    m: "ok",
    text: (
      <>
        <VisaMonoFileText>8-photographs.gdoc</VisaMonoFileText>{" "}
        <VisaDimText>10.4 MB → b64</VisaDimText>
      </>
    ),
  },
  {
    t: "14:14:06",
    m: "api",
    text: "POST /gmail/drafts { subject, body, attachments[4] }",
  },
  {
    t: "14:14:08",
    m: "ok",
    text: (
      <>
        Draft created. <VisaDimText>id: r-3f9b2…</VisaDimText>
      </>
    ),
  },
  {
    t: "14:14:08",
    m: "·",
    text: (
      <>
        <VisaAccentText>Open Gmail → Drafts</VisaAccentText> to review and send.
      </>
    ),
  },
];

export const DONE_LOG: LogLine[] = [
  {
    t: "14:22:14",
    m: "·",
    text: <VisaDimText>"Email sent" confirmed by user.</VisaDimText>,
  },
  {
    t: "14:22:14",
    m: "ok",
    text: (
      <>
        Recorded <VisaAccentText>submittedAt = 2026-05-05 14:22</VisaAccentText>
      </>
    ),
  },
  {
    t: "14:22:14",
    m: "api",
    text: 'PATCH /drive/folders/{id} { name: "Visa-May-2026" }',
  },
  {
    t: "14:22:15",
    m: "·",
    text: <VisaDimText>Moving 4 files from session folder → Documents requested…</VisaDimText>,
  },
  {
    t: "14:22:16",
    m: "ok",
    text: (
      <>
        Moved 4/4 files <VisaDimText>(folder kept, now empty)</VisaDimText>
      </>
    ),
  },
  {
    t: "14:22:16",
    m: "ok",
    text: (
      <>
        Saved session to <VisaMonoFileText>visa_sessions[]</VisaMonoFileText>{" "}
        <VisaDimText>(now 4 total)</VisaDimText>
      </>
    ),
  },
];
