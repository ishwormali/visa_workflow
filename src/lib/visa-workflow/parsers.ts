import { SAMPLE_DOCUMENT_LIST } from "./constants"
import type { DateFormat, DocCategory, DocTypeConfig } from "./types"

const RANGE_DESCRIPTION_PATTERN = /from .+ to|till today|to current/i
const PHOTO_PATTERN = /photo|photograph/i
const CHAT_PATTERN = /whatsapp|chat|history/i

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function parseDocumentList(
  plainText = SAMPLE_DOCUMENT_LIST
): DocTypeConfig[] {
  const rows = plainText.split("\n")
  const docTypes: DocTypeConfig[] = []

  for (const row of rows) {
    const match = row.match(
      /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/
    )

    if (!match) {
      continue
    }

    const [, rawNumber, rawDescription, , rawAttachments] = match
    const number = Number.parseInt(rawNumber, 10)

    if (Number.isNaN(number)) {
      continue
    }

    const description = rawDescription.trim()
    const attachments = rawAttachments.trim()
    const category: DocCategory = PHOTO_PATTERN.test(description)
      ? "gdoc_photos"
      : CHAT_PATTERN.test(description)
        ? "gdoc"
        : "upload"
    const dateFormat: DateFormat = RANGE_DESCRIPTION_PATTERN.test(description)
      ? "range"
      : "single"
    const subTypes: Array<"savers" | "smart"> = []

    if (/savers/i.test(attachments)) {
      subTypes.push("savers")
    }

    if (/smart/i.test(attachments)) {
      subTypes.push("smart")
    }

    if (subTypes.length > 0) {
      for (const subType of subTypes) {
        docTypes.push({
          id: `doc_${number}_${category}_${slugify(subType)}`,
          number,
          label: `${description} - ${subType} account`,
          category,
          dateFormat,
          matchPattern: `^${number}[\\s\\-].*${subType}`,
          active: true,
        })
      }

      continue
    }

    let matchPattern = `^${number}[\\s\\-]`

    if (category === "gdoc") {
      matchPattern = `^${number}[\\s\\-].*[Ww]hatsapp`
    }

    if (category === "gdoc_photos") {
      matchPattern = `^${number}[\\s\\-].*[Pp]hotograph`
    }

    docTypes.push({
      id: `doc_${number}_${category}`,
      number,
      label: description,
      category,
      dateFormat,
      matchPattern,
      active: true,
    })
  }

  return docTypes
}

export function matchesDocType(fileName: string, docType: DocTypeConfig) {
  try {
    return new RegExp(docType.matchPattern, "i").test(fileName)
  } catch {
    return false
  }
}
