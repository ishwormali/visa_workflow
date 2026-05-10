import type { DocTypeConfig, DocumentDateValue, SessionDocumentRecord, VisaConfig } from "./types";

export function formatDateLabel(value: DocumentDateValue) {
  if (value.mode === "single") {
    return value.date || "Date required";
  }

  if (!value.from || !value.to) {
    return "Date range required";
  }

  return `${value.from} to ${value.to}`;
}

export function createSessionFolderName(dateIso: string) {
  const date = new Date(dateIso);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(" ", "-")
    .replace(/^(\w{3})-(\d{4})$/, "Visa-$1-$2");
}

export function createEmailSubject(dateIso: string) {
  const date = new Date(dateIso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(date);
  const year = date.getFullYear();

  return `Visa Application Documents - ${day}-${month}-${year}`;
}

function formatFileDate(dateIso: string) {
  if (!dateIso) {
    return "date-required";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(dateIso))
    .replace(/\s+/g, "-");
}

function readFileExtension(fileName?: string) {
  if (!fileName) {
    return "";
  }

  const match = fileName.match(/(\.[a-z0-9]+)$/i);

  return match?.[1] ?? "";
}

export function buildPlannedFileName(
  docType: DocTypeConfig,
  dates: DocumentDateValue,
  sourceFileName?: string,
) {
  const prefix = docType.fileNamePrefix ?? `${docType.number} - ${docType.label}`;
  const extension =
    docType.category === "upload" ? readFileExtension(sourceFileName) || ".pdf" : "";

  if (dates.mode === "range") {
    return `${prefix} ${formatFileDate(dates.from)} to ${formatFileDate(dates.to)}${extension}`;
  }

  return `${prefix} ${formatFileDate(dates.date)}${extension}`;
}

export function formatGreetingBlock(greeting: string) {
  const trimmedGreeting = greeting.trim();

  if (!trimmedGreeting) {
    return "Hi,";
  }

  if (trimmedGreeting.includes("\n")) {
    return trimmedGreeting;
  }

  return /^hi\b/i.test(trimmedGreeting) ? trimmedGreeting : `Hi ${trimmedGreeting},`;
}

export function formatSignOffBlock(signOff: string) {
  const trimmedSignOff = signOff.trim();

  if (!trimmedSignOff) {
    return "Best Regards,";
  }

  if (trimmedSignOff.includes("\n")) {
    return trimmedSignOff;
  }

  return /regards|thanks|sincerely|cheers/i.test(trimmedSignOff)
    ? trimmedSignOff
    : `Best Regards,\n${trimmedSignOff}`;
}

export function buildEmailBody(args: { config: VisaConfig; documents: SessionDocumentRecord[] }) {
  const lines = args.documents
    .filter((document) => document.status !== "skipped")
    .map((document) => `* ${document.number} - ${document.label} ${document.dateLabel}`)
    .join("\n");

  return [
    formatGreetingBlock(args.config.email.greeting),
    "",
    "Hope you guys are doing well.",
    "Please find the attachments below:",
    "",
    lines,
    "",
    "--",
    formatSignOffBlock(args.config.email.signOff),
  ].join("\n");
}
