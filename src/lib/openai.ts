import "server-only";

import { crowdStrikeProfile, type SignalModule } from "@/lib/signal-profile";
import type { SalesActionBrief } from "@/lib/types";

export type ClassificationResult = {
  classification:
    | "No Signal"
    | "Weak Signal"
    | "Actionable Signal"
    | "High-Urgency Signal";
  signal_module: string;
  confidence: number;
  is_boilerplate: boolean;
  evidence_snippet: string;
  rationale: string;
  should_generate_brief: boolean;
};

export type GeneratedBrief = Omit<
  SalesActionBrief,
  "id" | "status" | "sellerCompany" | "targetCompany" | "ticker" | "filingUrl"
>;

const classificationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "classification",
    "signal_module",
    "confidence",
    "is_boilerplate",
    "evidence_snippet",
    "rationale",
    "should_generate_brief",
  ],
  properties: {
    classification: {
      type: "string",
      enum: [
        "No Signal",
        "Weak Signal",
        "Actionable Signal",
        "High-Urgency Signal",
      ],
    },
    signal_module: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    is_boilerplate: { type: "boolean" },
    evidence_snippet: { type: "string" },
    rationale: { type: "string" },
    should_generate_brief: { type: "boolean" },
  },
};

const briefSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "filingType",
    "filingDate",
    "triggerType",
    "urgency",
    "confidenceScore",
    "evidenceSnippet",
    "whyItMatters",
    "buyerPersonas",
    "suggestedSalesMotion",
    "suggestedOutreachAngle",
    "outreachSensitivity",
    "recommendedNextStep",
    "whyFlagged",
  ],
  properties: {
    title: { type: "string" },
    filingType: { type: "string" },
    filingDate: { type: "string" },
    triggerType: { type: "string" },
    urgency: { type: "string" },
    confidenceScore: { type: "number", minimum: 0, maximum: 100 },
    evidenceSnippet: { type: "string" },
    whyItMatters: { type: "string" },
    buyerPersonas: { type: "array", items: { type: "string" } },
    suggestedSalesMotion: { type: "string" },
    suggestedOutreachAngle: { type: "string" },
    outreachSensitivity: { type: "string" },
    recommendedNextStep: { type: "string" },
    whyFlagged: { type: "string" },
  },
};

function openAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-5.5",
  };
}

async function structuredResponse<T>(input: string, schemaName: string, schema: object) {
  const { apiKey, model } = openAiConfig();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { output_text?: string };
  if (!data.output_text) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  return JSON.parse(data.output_text) as T;
}

function profilePrompt(module: SignalModule) {
  return `Selected seller company: ${crowdStrikeProfile.companyName}
Products: ${crowdStrikeProfile.productsSummary}
Allowed buyer personas: ${crowdStrikeProfile.buyerPersonas.join(", ")}
Sensitivity rules: ${crowdStrikeProfile.outreachSensitivityRules}
Signal module: ${module.name}
Module description: ${module.description}
Strong trigger examples: ${module.strongTriggerExamples.join(" | ")}
Weak/noise examples: ${module.weakSignalExamples.join(" | ")}`;
}

export async function classifyCandidate(input: {
  module: SignalModule;
  chunkText: string;
}) {
  return structuredResponse<ClassificationResult>(
    `You are classifying an official SEC filing chunk for SignalLens AI.
Use only the filing text and selected seller profile. Do not invent relevance.
Distinguish boilerplate risk language from concrete events, direct operational changes, financial impact, strategic initiatives, or governance activity.
Return No Signal or Weak Signal unless the evidence creates a real CrowdStrike sales action.

${profilePrompt(input.module)}

Filing text:
${input.chunkText}`,
    "signal_classification",
    classificationSchema,
  );
}

export async function generateBrief(input: {
  module: SignalModule;
  classification: ClassificationResult;
  targetCompany: string;
  ticker: string;
  filingType: string;
  filingDate: string;
  filingUrl: string;
  chunkText: string;
}) {
  return structuredResponse<GeneratedBrief>(
    `Generate a practical Sales Action Brief for the selected seller company.
Use only the evidence and profile below. Avoid exaggeration and avoid fear-based language.
The brief must be seller-specific and useful to a sales team.

${profilePrompt(input.module)}

Target company: ${input.targetCompany}
Ticker: ${input.ticker}
Filing type: ${input.filingType}
Filing date: ${input.filingDate}
Filing URL: ${input.filingUrl}
Classifier result: ${JSON.stringify(input.classification)}

Filing text:
${input.chunkText}`,
    "sales_action_brief",
    briefSchema,
  );
}
