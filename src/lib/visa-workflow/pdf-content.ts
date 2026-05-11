import type { DocTypeConfig, DocumentDateValue } from "./types";

export type PdfAccountType = "savers" | "smart";

export type PdfAnalysis = {
  accountType?: PdfAccountType;
  billDate?: string;
  isPhoneBill: boolean;
  normalizedText: string;
  statementRange?: {
    from: string;
    to: string;
  };
};

type InferredDates = {
  dates: DocumentDateValue;
  validationMessage: string;
};

const MONTH_INDEX = new Map<string, number>([
  ["jan", 0],
  ["january", 0],
  ["feb", 1],
  ["february", 1],
  ["mar", 2],
  ["march", 2],
  ["apr", 3],
  ["april", 3],
  ["may", 4],
  ["jun", 5],
  ["june", 5],
  ["jul", 6],
  ["july", 6],
  ["aug", 7],
  ["august", 7],
  ["sep", 8],
  ["sept", 8],
  ["september", 8],
  ["oct", 9],
  ["october", 9],
  ["nov", 10],
  ["november", 10],
  ["dec", 11],
  ["december", 11],
]);

const MONTH_NAME_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE_PATTERN = `(?:\\d{4}[/-]\\d{1,2}[/-]\\d{1,2}|\\d{1,2}(?:st|nd|rd|th)?[\\s./-]+${MONTH_NAME_PATTERN}[\\s,./-]+\\d{2,4}|${MONTH_NAME_PATTERN}[\\s]+\\d{1,2},?[\\s]+\\d{2,4}|\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4})`;

const RANGE_PATTERNS = [
  new RegExp(`statement\\s+period\\s*:?\\s*(${DATE_PATTERN})\\s*(?:to|through|until|[-–])\\s*(${DATE_PATTERN})`, "i"),
  new RegExp(`(?:billing|bill)\\s+period\\s*:?\\s*(${DATE_PATTERN})\\s*(?:to|through|until|[-–])\\s*(${DATE_PATTERN})`, "i"),
  new RegExp(`period\\s+(?:from\\s+)?(${DATE_PATTERN})\\s*(?:to|through|until|[-–])\\s*(${DATE_PATTERN})`, "i"),
  new RegExp(`from\\s+(${DATE_PATTERN})\\s*(?:to|through|until|[-–])\\s*(${DATE_PATTERN})`, "i"),
];

const SINGLE_DATE_PATTERNS = [
  new RegExp(`(?:bill(?:ing)?\\s+date|invoice\\s+date|issue\\s+date|date\\s+of\\s+issue|statement\\s+date|tax\\s+invoice\\s+date)\\s*:?\\s*(${DATE_PATTERN})`, "i"),
  new RegExp(`(?:period\\s+ending|bill\\s+period\\s+ending)\\s*:?\\s*(${DATE_PATTERN})`, "i"),
];

function normalizePdfText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDate(year: number, monthIndex: number, day: number) {
  const date = new Date(Date.UTC(year, monthIndex, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return `${year}-${padDatePart(monthIndex + 1)}-${padDatePart(day)}`;
}

export function parsePdfDate(rawValue: string) {
  const value = rawValue
    .trim()
    .replace(/,/g, " ")
    .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1")
    .replace(/\s+/g, " ");

  const isoMatch = value.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);

  if (isoMatch) {
    return toIsoDate(
      Number.parseInt(isoMatch[1], 10),
      Number.parseInt(isoMatch[2], 10) - 1,
      Number.parseInt(isoMatch[3], 10),
    );
  }

  const dayFirstMonthNameMatch = value.match(
    new RegExp(`^(\\d{1,2})[\\s./-]+(${MONTH_NAME_PATTERN})[\\s./-]+(\\d{2,4})$`, "i"),
  );

  if (dayFirstMonthNameMatch) {
    const monthIndex = MONTH_INDEX.get(dayFirstMonthNameMatch[2].toLowerCase());
    const rawYear = Number.parseInt(dayFirstMonthNameMatch[3], 10);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    if (monthIndex !== undefined) {
      return toIsoDate(year, monthIndex, Number.parseInt(dayFirstMonthNameMatch[1], 10));
    }
  }

  const monthFirstMatch = value.match(
    new RegExp(`^(${MONTH_NAME_PATTERN})\\s+(\\d{1,2})\\s+(\\d{2,4})$`, "i"),
  );

  if (monthFirstMatch) {
    const monthIndex = MONTH_INDEX.get(monthFirstMatch[1].toLowerCase());
    const rawYear = Number.parseInt(monthFirstMatch[3], 10);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    if (monthIndex !== undefined) {
      return toIsoDate(year, monthIndex, Number.parseInt(monthFirstMatch[2], 10));
    }
  }

  const numericMatch = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);

  if (numericMatch) {
    const rawYear = Number.parseInt(numericMatch[3], 10);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    return toIsoDate(
      year,
      Number.parseInt(numericMatch[2], 10) - 1,
      Number.parseInt(numericMatch[1], 10),
    );
  }

  return undefined;
}

function detectAccountType(normalizedText: string): PdfAccountType | undefined {
  if (/netbank\s+saver|savers?\s+account|goal\s+saver/i.test(normalizedText)) {
    return "savers";
  }

  if (/smart\s+access|smart\s+account|smartaccess/i.test(normalizedText)) {
    return "smart";
  }

  return undefined;
}

function extractStatementRange(normalizedText: string) {
  for (const pattern of RANGE_PATTERNS) {
    const match = normalizedText.match(pattern);

    if (!match) {
      continue;
    }

    const from = parsePdfDate(match[1]);
    const to = parsePdfDate(match[2]);

    if (from && to) {
      return { from, to };
    }
  }

  return undefined;
}

function extractBillDate(normalizedText: string) {
  for (const pattern of SINGLE_DATE_PATTERNS) {
    const match = normalizedText.match(pattern);

    if (!match) {
      continue;
    }

    const date = parsePdfDate(match[1]);

    if (date) {
      return date;
    }
  }

  const allDates = [...normalizedText.matchAll(new RegExp(DATE_PATTERN, "gi"))]
    .map((match) => parsePdfDate(match[0]))
    .filter((date): date is string => Boolean(date));
  const uniqueDates = [...new Set(allDates)];

  return uniqueDates.length === 1 ? uniqueDates[0] : undefined;
}

export function analyzePdfText(text: string): PdfAnalysis {
  const normalizedText = normalizePdfText(text);

  return {
    accountType: detectAccountType(normalizedText),
    billDate: extractBillDate(normalizedText),
    isPhoneBill:
      /uroj/i.test(normalizedText) &&
      /(optus|phone\s+bill|bill\s+summary|mobile\s+service|account\s+charges)/i.test(
        normalizedText,
      ),
    normalizedText,
    statementRange: extractStatementRange(normalizedText),
  };
}

export function matchesPdfAnalysis(docType: DocTypeConfig, analysis: PdfAnalysis) {
  switch (docType.id) {
    case "doc_4_savers":
      return analysis.accountType === "savers";
    case "doc_4_smart":
      return analysis.accountType === "smart";
    case "doc_43_phonebill":
      return analysis.isPhoneBill;
    default:
      return false;
  }
}

export function inferPdfDates(
  docType: DocTypeConfig,
  analyses: PdfAnalysis[],
  currentDates: DocumentDateValue,
): InferredDates {
  if (docType.dateFormat === "range") {
    const ranges = analyses
      .map((analysis) => analysis.statementRange)
      .filter(
        (range): range is NonNullable<PdfAnalysis["statementRange"]> => Boolean(range),
      );

    if (!ranges.length) {
      return {
        dates: currentDates,
        validationMessage: analyses.length
          ? "Matched PDFs did not expose a statement period. Review the dates manually."
          : "",
      };
    }

    const from = ranges
      .map((range) => range.from)
      .toSorted((left, right) => left.localeCompare(right))[0];
    const to = ranges
      .map((range) => range.to)
      .toSorted((left, right) => right.localeCompare(left))[0];

    return {
      dates: {
        mode: "range",
        from,
        to,
      },
      validationMessage:
        ranges.length === analyses.length
          ? ""
          : "Some matched PDFs did not expose a statement period. Review the dates manually.",
    };
  }

  const uniqueDates = [
    ...new Set(
      analyses
        .map((analysis) => analysis.billDate)
        .filter((date): date is string => Boolean(date)),
    ),
  ];

  if (!uniqueDates.length) {
    return {
      dates: currentDates,
      validationMessage: analyses.length
        ? "Matched PDFs did not expose a bill date. Review the date manually."
        : "",
    };
  }

  if (uniqueDates.length > 1) {
    return {
      dates: currentDates,
      validationMessage: "Matched PDFs expose multiple bill dates. Review the date manually.",
    };
  }

  return {
    dates: {
      mode: "single",
      date: uniqueDates[0],
    },
    validationMessage:
      analyses.every((analysis) => analysis.billDate === uniqueDates[0])
        ? ""
        : "Some matched PDFs did not expose a bill date. Review the date manually.",
  };
}