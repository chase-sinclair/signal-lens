export const BRIEF_CONFIDENCE_THRESHOLD = 0.75;

export function activeModelName() {
  return process.env.OPENAI_MODEL || "gpt-5.5";
}
