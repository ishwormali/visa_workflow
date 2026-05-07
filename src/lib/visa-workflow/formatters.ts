import type {
  DocumentDateValue,
  SessionDocumentRecord,
  VisaConfig,
} from "./types"

export function formatDateLabel(value: DocumentDateValue) {
  if (value.mode === "single") {
    return value.date || "Date required"
  }

  if (!value.from || !value.to) {
    return "Date range required"
  }

  return `${value.from} to ${value.to}`
}

export function createSessionFolderName(dateIso: string) {
  const date = new Date(dateIso)

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(" ", "-")
    .replace(/^(\w{3})-(\d{4})$/, "Visa-$1-$2")
}

export function createEmailSubject(dateIso: string) {
  const date = new Date(dateIso)
  const day = String(date.getDate()).padStart(2, "0")
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(date)
  const year = date.getFullYear()

  return `Visa Application Documents - ${day}-${month}-${year}`
}

export function buildEmailBody(args: {
  config: VisaConfig
  documents: SessionDocumentRecord[]
}) {
  const lines = args.documents
    .filter((document) => document.status !== "skipped")
    .map(
      (document) =>
        `* ${document.number} - ${document.label} ${document.dateLabel}`
    )
    .join("\n")

  return [
    `Hi ${args.config.email.greeting},`,
    "",
    "Hope you guys are doing well.",
    "Please find the attachments below:",
    "",
    lines,
    "",
    "--",
    "Best Regards,",
    args.config.email.signOff,
  ].join("\n")
}
