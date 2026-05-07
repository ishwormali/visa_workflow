import type { DocTypeConfig, WorkflowDocumentState } from "./types"

export function validateDocumentDates(
  docType: DocTypeConfig,
  documentState: WorkflowDocumentState
) {
  if (docType.category === "gdoc_photos") {
    return ""
  }

  if (documentState.dates.mode === "single") {
    return documentState.dates.date ? "" : `Set a date for ${docType.label}.`
  }

  if (documentState.dates.from && documentState.dates.to) {
    return ""
  }

  return `Set a date range for ${docType.label}.`
}
