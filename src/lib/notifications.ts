import "server-only";

import type { SalesActionBrief, ScanSummary } from "@/lib/types";

export async function sendScanNotification(result: {
  summary: ScanSummary;
  briefs: SalesActionBrief[];
  notification: {
    shouldNotify: boolean;
    message: string;
  };
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || !result.notification.shouldNotify) {
    return { sent: false, reason: result.notification.message };
  }

  const briefLines = result.briefs
    .slice(0, 5)
    .map(
      (brief) =>
        `• ${brief.title} — ${brief.targetCompany} (${brief.confidenceScore}% confidence)`,
    )
    .join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `SignalLens generated ${result.summary.briefsGenerated} brief${
        result.summary.briefsGenerated === 1 ? "" : "s"
      }.\n${briefLines}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.status}`);
  }

  return { sent: true, reason: "Slack notification sent." };
}
