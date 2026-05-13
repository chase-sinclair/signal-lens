import { crowdStrikeProfile, type SignalModule } from "@/lib/signal-profile";

export type PrefilterMatch = {
  moduleName: string;
  keywordMatches: string[];
  isBoilerplate: boolean;
  rationale: string;
};

const concreteEventPatterns = [
  /\bexperienced\b/i,
  /\bdisclosed\b/i,
  /\bidentified\b/i,
  /\bdetected\b/i,
  /\bunauthorized access\b/i,
  /\bransomware\b/i,
  /\bdata (breach|exfiltration|exposure)\b/i,
  /\bcustomer data\b/i,
  /\bremediation\b/i,
  /\bmaterial weakness\b/i,
  /\bcompromised credentials?\b/i,
  /\bincurred costs?\b/i,
  /\binvestigation\b/i,
];

const boilerplatePatterns = [
  /\bmay\b.{0,40}\b(cyber|security|information systems|threats?)\b/i,
  /\bcould\b.{0,40}\b(affect|impact|harm)\b/i,
  /\brisk factors?\b/i,
  /\bwe rely on information systems\b/i,
  /\bthere can be no assurance\b/i,
];

function normalize(value: string) {
  return value.toLowerCase();
}

function keywordMatches(text: string, module: SignalModule) {
  const normalizedText = normalize(text);
  return module.defaultKeywords.filter((keyword) =>
    normalizedText.includes(normalize(keyword)),
  );
}

export function classifyBoilerplate(text: string, matches: string[]) {
  const hasConcreteEvent = concreteEventPatterns.some((pattern) =>
    pattern.test(text),
  );
  const hasBoilerplate = boilerplatePatterns.some((pattern) =>
    pattern.test(text),
  );

  return matches.length > 0 && hasBoilerplate && !hasConcreteEvent;
}

export function prefilterChunk(text: string): PrefilterMatch[] {
  return crowdStrikeProfile.modules
    .map((module) => {
      const matches = keywordMatches(text, module);
      if (matches.length === 0) return null;

      const isBoilerplate = classifyBoilerplate(text, matches);
      return {
        moduleName: module.name,
        keywordMatches: matches,
        isBoilerplate,
        rationale: isBoilerplate
          ? "Matched CrowdStrike keywords, but language appears to be generic risk disclosure without a concrete event."
          : `Matched ${matches.length} CrowdStrike keyword${
              matches.length === 1 ? "" : "s"
            } with concrete or potentially actionable filing language.`,
      };
    })
    .filter((match): match is PrefilterMatch => Boolean(match));
}
