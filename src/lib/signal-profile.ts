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

export const sellerProfiles: SellerProfile[] = [
  crowdStrikeProfile,
  {
    companyName: "Datadog",
    pack: "DevOps / Cloud Pack",
    productsSummary:
      "Datadog sells observability, cloud infrastructure monitoring, application performance monitoring, log management, and SRE enablement.",
    buyerPersonas: [
      "CTO",
      "VP Engineering",
      "Head of SRE",
      "VP Infrastructure",
      "CIO",
      "Platform Engineering Lead",
    ],
    salesMotions: [
      "Route to Enterprise AE and Solutions Engineer for reliability or cloud visibility review.",
      "Lead with full-stack observability, incident response visibility, cloud cost visibility, and SRE enablement.",
    ],
    outreachSensitivityRules:
      "For outages or reliability incidents, avoid blame language. Use operational resilience and visibility language.",
    modules: [
      {
        name: "Reliability / Outage Risk",
        description:
          "Concrete customer-facing outages, service disruptions, platform reliability concerns, and incident response needs.",
        defaultKeywords: [
          "service disruption",
          "outage",
          "reliability",
          "operational resilience",
          "incident response",
          "platform availability",
          "downtime",
        ],
        strongTriggerExamples: [
          "Our platform experienced service disruptions.",
          "We are investing in reliability and operational resilience.",
        ],
        weakSignalExamples: [
          "System failures may impact us.",
          "We depend on technology infrastructure.",
        ],
        priorityWeight: 1.4,
      },
      {
        name: "Cloud Cost Pressure",
        description:
          "Material cloud infrastructure cost increases, cloud migration complexity, and infrastructure spend visibility needs.",
        defaultKeywords: [
          "cloud infrastructure costs",
          "infrastructure costs",
          "cloud migration",
          "cloud spend",
          "workloads",
        ],
        strongTriggerExamples: [
          "Infrastructure costs increased materially.",
          "We are migrating workloads to cloud infrastructure.",
        ],
        weakSignalExamples: ["We use cloud infrastructure."],
        priorityWeight: 1.2,
      },
    ],
  },
  {
    companyName: "Workday",
    pack: "HR / Workforce Pack",
    productsSummary:
      "Workday sells HCM, finance, workforce planning, payroll, talent management, and HR/finance transformation software.",
    buyerPersonas: [
      "CHRO",
      "CFO",
      "VP People Operations",
      "HRIS Leader",
      "Controller",
      "CIO",
    ],
    salesMotions: [
      "Route to HCM/Finance AE for workforce or finance transformation review.",
      "Lead with workforce planning, HRIS modernization, finance/HCM alignment, and payroll scalability.",
    ],
    outreachSensitivityRules:
      "For layoffs or restructuring, avoid opportunistic language. Use planning, compliance, and workforce resilience language.",
    modules: [
      {
        name: "Workforce Restructuring",
        description:
          "Concrete workforce reductions, restructuring programs, headcount changes, and organizational redesign.",
        defaultKeywords: [
          "restructuring",
          "workforce reduction",
          "headcount",
          "severance",
          "realignment",
          "cost reduction",
        ],
        strongTriggerExamples: [
          "We are restructuring our workforce.",
          "We plan to increase headcount.",
        ],
        weakSignalExamples: ["Employee retention is important to our business."],
        priorityWeight: 1.3,
      },
      {
        name: "HR Modernization",
        description:
          "HR, finance, payroll, talent, and workforce systems modernization initiatives.",
        defaultKeywords: [
          "HR transformation",
          "finance transformation",
          "payroll",
          "talent management",
          "workforce planning",
        ],
        strongTriggerExamples: [
          "We are investing in finance and HR transformation.",
        ],
        weakSignalExamples: ["We may hire employees in the future."],
        priorityWeight: 1.1,
      },
    ],
  },
  {
    companyName: "Snowflake",
    pack: "Data / AI Pack",
    productsSummary:
      "Snowflake sells cloud data platform, governed analytics, AI-ready data infrastructure, secure data sharing, and data consolidation.",
    buyerPersonas: ["CIO", "CDO", "VP Data", "VP Analytics", "CTO", "AI/ML Platform Lead"],
    salesMotions: [
      "Route to Data Platform AE and Sales Engineer for modernization assessment.",
      "Lead with governed AI-ready data, analytics modernization, secure sharing, and data consolidation.",
    ],
    outreachSensitivityRules:
      "For governance or regulatory signals, use accuracy, control, and readiness language.",
    modules: [
      {
        name: "AI / Data Infrastructure Investment",
        description:
          "Concrete AI infrastructure, analytics modernization, data platform, and scalable data investment signals.",
        defaultKeywords: [
          "AI infrastructure",
          "data infrastructure",
          "analytics",
          "data platform",
          "data modernization",
          "machine learning",
        ],
        strongTriggerExamples: [
          "We are investing in AI and data infrastructure.",
          "We are modernizing our data platform.",
        ],
        weakSignalExamples: ["Data is important to our business."],
        priorityWeight: 1.3,
      },
      {
        name: "Data Governance / Analytics Modernization",
        description:
          "Data governance, reporting pressure, fragmented analytics systems, and consolidation needs.",
        defaultKeywords: [
          "data governance",
          "regulatory reporting",
          "analytics systems",
          "data consolidation",
          "reporting",
        ],
        strongTriggerExamples: [
          "We face challenges with data governance and reporting.",
          "We are consolidating analytics systems.",
        ],
        weakSignalExamples: ["We use information systems."],
        priorityWeight: 1.2,
      },
    ],
  },
  {
    companyName: "ServiceNow",
    pack: "Data / AI Pack",
    productsSummary:
      "ServiceNow sells enterprise workflow automation, ITSM, customer service workflows, internal productivity, and AI-enabled service operations.",
    buyerPersonas: [
      "CIO",
      "COO",
      "VP Operations",
      "Head of Shared Services",
      "ITSM Leader",
      "Customer Operations Leader",
    ],
    salesMotions: [
      "Route to Enterprise Workflow AE for operational efficiency and service modernization review.",
      "Lead with workflow automation, ITSM modernization, customer service workflows, and internal productivity.",
    ],
    outreachSensitivityRules:
      "For cost reduction signals, avoid implying layoffs are the opportunity. Use productivity and workflow resilience language.",
    modules: [
      {
        name: "Operational Efficiency / Cost Reduction",
        description:
          "Concrete operational efficiency initiatives, cost programs, productivity efforts, and manual-process reduction.",
        defaultKeywords: [
          "operational efficiency",
          "cost reduction",
          "productivity",
          "automation",
          "manual processes",
          "shared services",
        ],
        strongTriggerExamples: [
          "We are focused on operational efficiency.",
          "We are investing in automation.",
        ],
        weakSignalExamples: ["We seek to operate efficiently."],
        priorityWeight: 1.3,
      },
      {
        name: "Customer Support / Workflow Automation",
        description:
          "Customer service modernization, internal workflow fragmentation, ITSM modernization, and service operations needs.",
        defaultKeywords: [
          "customer service",
          "workflow",
          "IT service management",
          "legacy system",
          "service operations",
        ],
        strongTriggerExamples: [
          "We are modernizing internal workflows.",
          "We are reducing manual processes.",
        ],
        weakSignalExamples: ["We may experience operational challenges."],
        priorityWeight: 1.2,
      },
    ],
  },
];

export function getSellerProfile(companyName: string) {
  return (
    sellerProfiles.find((profile) => profile.companyName === companyName) ??
    crowdStrikeProfile
  );
}
