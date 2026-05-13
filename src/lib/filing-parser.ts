import "server-only";

export type FilingChunk = {
  chunkIndex: number;
  sectionLabel: string;
  text: string;
  sourceUrl: string;
};

function decodeEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<ix:[^>]+>/gi, " ")
      .replace(/<\/(div|p|tr|table|section|article|br|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function sectionLabelFor(text: string) {
  const itemMatch = text.match(/Item\s+\d+\.\d{2}[^.\n]{0,90}/i);
  if (itemMatch) return itemMatch[0].trim();
  if (/exhibit\s+99\.1/i.test(text)) return "Exhibit 99.1";
  return "Primary document";
}

export function chunkFilingText(text: string, sourceUrl: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 80);

  const chunks: FilingChunk[] = [];
  let buffer = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (next.length > 3500 && buffer) {
      chunks.push({
        chunkIndex,
        sectionLabel: sectionLabelFor(buffer),
        text: buffer,
        sourceUrl,
      });
      chunkIndex += 1;
      buffer = paragraph;
    } else {
      buffer = next;
    }
  }

  if (buffer) {
    chunks.push({
      chunkIndex,
      sectionLabel: sectionLabelFor(buffer),
      text: buffer,
      sourceUrl,
    });
  }

  return chunks;
}
