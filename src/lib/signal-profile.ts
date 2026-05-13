export type SignalModule = {
  name: string;
  description: string;
  defaultKeywords: string[];
  strongTriggerExamples: string[];
  weakSignalExamples: string[];
  priorityWeight: number;
};

export type SellerProfile = {
  companyName: string;
  pack: string;
  productsSummary: string;
  buyerPersonas: string[];
  salesMotions: string[];
  outreachSensitivityRules: string;
  modules: SignalModule[];
};

export const crowdStrikeProfile: SellerProfile = {
  companyName: "CrowdStrike",
  pack: "Cybersecurity Pack",
  productsSummary:
    "CrowdStrike sells endpoint detection and response, identity threat protection, threat intelligence, incident response, and board-level cyber risk visibility.",
  buyerPersonas: [
    "CISO",
    "CIO",
    "VP Security Operations",
    "General Counsel",
    "Risk Committee / Board Sponsor",
  ],
  salesMotions: [
    "Route to Enterprise Security AE and Security Solutions Engineer.",
    "Lead with incident readiness, threat visibility, endpoint protection, and board-level cyber risk reporting.",
  ],
  outreachSensitivityRules:
    "For breach-related filings, avoid aggressive outreach language. Use resilience, readiness, and risk governance language instead.",
  modules: [
    {
      name: "Cybersecurity Incident",
      description:
        "Concrete disclosures of unauthorized access, ransomware, data exfiltration, security incidents, and remediation costs.",
      defaultKeywords: [
        "unauthorized access",
        "cyber incident",
        "cybersecurity incident",
        "ransomware",
        "data breach",
        "data exfiltration",
        "customer data",
        "incident response",
        "remediation",
        "information security",
        "cybersecurity risks",
        "cyber threats",
      ],
      strongTriggerExamples: [
        "We experienced unauthorized access to customer data.",
        "We incurred costs related to a cybersecurity incident.",
        "A ransomware attack disrupted operations.",
      ],
      weakSignalExamples: [
        "Cybersecurity risks may affect our business.",
        "We rely on information systems and may face cyber threats.",
      ],
      priorityWeight: 1.5,
    },
    {
      name: "Board-Level Cyber Risk",
      description:
        "Disclosures that point to board, audit committee, regulatory, legal, or governance attention around cyber risk.",
      defaultKeywords: [
        "board",
        "audit committee",
        "risk committee",
        "cyber risk",
        "regulatory inquiry",
        "legal proceedings",
        "material weakness",
        "security controls",
        "internal control",
        "governance",
        "risk management",
      ],
      strongTriggerExamples: [
        "We identified a material weakness related to information security controls.",
        "The board is overseeing remediation of a cybersecurity incident.",
      ],
      weakSignalExamples: [
        "Our board oversees risk management generally.",
        "We may be subject to regulation.",
      ],
      priorityWeight: 1,
    },
    {
      name: "Identity / Access Risk",
      description:
        "Signals involving credential compromise, identity access failures, account takeover, privilege misuse, or access control remediation.",
      defaultKeywords: [
        "identity compromise",
        "credential",
        "access control",
        "account takeover",
        "privileged access",
        "multi-factor",
        "authentication",
        "unauthorized user",
        "permissions",
        "unauthorized access",
      ],
      strongTriggerExamples: [
        "Compromised credentials enabled unauthorized access.",
        "We are remediating access control deficiencies.",
      ],
      weakSignalExamples: [
        "We use authentication controls.",
        "Employees may misuse access.",
      ],
      priorityWeight: 1.2,
    },
  ],
};
