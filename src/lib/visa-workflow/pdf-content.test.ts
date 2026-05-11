import { describe, expect, it } from "vitest";

import { analyzePdfText, inferPdfDates, matchesPdfAnalysis, parsePdfDate } from "./pdf-content";
import type { DocTypeConfig, DocumentDateValue } from "./types";

const rangeFallback: DocumentDateValue = {
  mode: "range",
  from: "2026-01-01",
  to: "2026-01-31",
};

const singleFallback: DocumentDateValue = {
  mode: "single",
  date: "2026-04-01",
};

const saversDocType: DocTypeConfig = {
  id: "doc_4_savers",
  number: 4,
  label: "Joint statements - savers account",
  category: "upload",
  dateFormat: "range",
  detection: "pdf_content",
  active: true,
};

const smartDocType: DocTypeConfig = {
  ...saversDocType,
  id: "doc_4_smart",
  label: "Joint statements - smart account",
};

const phoneBillDocType: DocTypeConfig = {
  id: "doc_43_phonebill",
  number: 43,
  label: "Uroj phone bill",
  category: "upload",
  dateFormat: "single",
  detection: "pdf_content",
  active: true,
};

describe("parsePdfDate", () => {
  it("normalizes common PDF date formats into ISO", () => {
    expect(parsePdfDate("01 Apr 2026")).toBe("2026-04-01");
    expect(parsePdfDate("Apr 30, 2026")).toBe("2026-04-30");
    expect(parsePdfDate("30/04/2026")).toBe("2026-04-30");
  });
});

describe("analyzePdfText", () => {
  it("detects savers statements and extracts their date range", () => {
    const analysis = analyzePdfText(`
      Commonwealth Bank NetBank Saver
      Statement period 01 Jan 2026 to 31 Jan 2026
    `);

    expect(analysis.accountType).toBe("savers");
    expect(analysis.statementRange).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(matchesPdfAnalysis(saversDocType, analysis)).toBe(true);
  });

  it("detects smart access statements independently of filename", () => {
    const analysis = analyzePdfText(`
      Commonwealth Bank Smart Access Account
      Period from 01 Feb 2026 to 28 Feb 2026
    `);

    expect(analysis.accountType).toBe("smart");
    expect(matchesPdfAnalysis(smartDocType, analysis)).toBe(true);
  });

  it("detects Uroj phone bills and extracts the bill date", () => {
    const analysis = analyzePdfText(`
      Optus bill summary
      Uroj Example
      Bill date: 14 Apr 2026
    `);

    expect(analysis.isPhoneBill).toBe(true);
    expect(analysis.billDate).toBe("2026-04-14");
    expect(matchesPdfAnalysis(phoneBillDocType, analysis)).toBe(true);
  });
});

describe("inferPdfDates", () => {
  it("aggregates the min and max statement dates across multiple matched PDFs", () => {
    const dates = inferPdfDates(
      saversDocType,
      [
        analyzePdfText("NetBank Saver statement period 01 Jan 2026 to 31 Jan 2026"),
        analyzePdfText("NetBank Saver statement period 01 Feb 2026 to 28 Feb 2026"),
      ],
      rangeFallback,
    );

    expect(dates.dates).toEqual({
      mode: "range",
      from: "2026-01-01",
      to: "2026-02-28",
    });
    expect(dates.validationMessage).toBe("");
  });

  it("keeps the existing single date when matched PDFs disagree", () => {
    const dates = inferPdfDates(
      phoneBillDocType,
      [
        analyzePdfText("Optus bill summary Uroj Bill date: 14 Apr 2026"),
        analyzePdfText("Optus bill summary Uroj Bill date: 15 Apr 2026"),
      ],
      singleFallback,
    );

    expect(dates.dates).toEqual(singleFallback);
    expect(dates.validationMessage).toContain("multiple bill dates");
  });
});
