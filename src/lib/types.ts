export type BriefStatus =
  | "New"
  | "Reviewed"
  | "Relevant"
  | "Not Relevant"
  | "Archived";

export type ScanSummary = {
  filingsScanned: number;
  candidatesFound: number;
  briefsGenerated: number;
  filingsSuppressed: number;
};

export type SalesActionBrief = {
  id: string;
  title: string;
  sellerCompany: string;
  targetCompany: string;
  ticker: string;
  filingType: string;
  filingDate: string;
  filingUrl: string;
  triggerType: string;
  urgency: string;
  confidenceScore: number;
  evidenceSnippet: string;
  whyItMatters: string;
  buyerPersonas: string[];
  suggestedSalesMotion: string;
  suggestedOutreachAngle: string;
  outreachSensitivity: string;
  recommendedNextStep: string;
  whyFlagged: string;
  status: BriefStatus;
};

export type ScanResult = {
  scanRunId: string;
  summary: ScanSummary;
  briefs: SalesActionBrief[];
  errors: string[];
};
