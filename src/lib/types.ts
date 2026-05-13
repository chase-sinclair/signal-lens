export type BriefStatus =
  | "New"
  | "Reviewed"
  | "Relevant"
  | "Not Relevant"
  | "Archived";

export type ScanSummary = {
  filingsScanned: number;
  newFilingsProcessed: number;
  filingsSkipped: number;
  candidatesFound: number;
  briefsGenerated: number;
  filingsSuppressed: number;
};

export type ScanMode = "new" | "reprocess";

export type ScanEvent = {
  id?: string;
  type:
    | "filing_processed"
    | "filing_skipped"
    | "filing_suppressed"
    | "candidate_found"
    | "candidate_rejected"
    | "brief_generated"
    | "scan_error";
  ticker?: string;
  targetCompany?: string;
  accessionNumber?: string;
  filingDate?: string;
  filingUrl?: string;
  sectionLabel?: string;
  signalModule?: string;
  keywordMatches?: string[];
  classification?: string;
  confidence?: number;
  rationale: string;
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
  mode?: ScanMode;
  summary: ScanSummary;
  briefs: SalesActionBrief[];
  events: ScanEvent[];
  notification: {
    shouldNotify: boolean;
    channel: "none" | "brief_created";
    message: string;
  };
  errors: string[];
};
