// src/emails/SendTeamJoinRequestReceivedEmail.ts
import resend from "@/src/lib/resend";
import { parseServerActionResponse, getBaseUrl } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function SendTeamJoinRequestReceivedEmail(params: {
  toEmail: string;
  orgSlug: string;
  eventSlug: string;
  eventName: string;
  teamName: string;
  teamSlug: string;
  requesterName: string | null;
  requesterEmail: string;
  message?: string | null;
}): Promise<ActionState> {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "BASE_URL_MISSING",
        data: null,
      }) as ActionState;
    }

    const manageUrl = `${baseUrl}/app/orgs/${params.orgSlug}/events/${params.eventSlug}/teams/${params.teamSlug}/settings`;

    const teamName = escapeHtml(params.teamName);
    const eventName = escapeHtml(params.eventName);
    const requesterName = escapeHtml(params.requesterName ?? "A participant");
    const requesterEmail = escapeHtml(params.requesterEmail);
    const safeMsg = params.message
      ? escapeHtml(params.message).replaceAll("\n", "<br />")
      : "";

    const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#070A12;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#070A12;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
        style="width:600px;max-width:600px;border:1px solid rgba(255,255,255,0.10);border-radius:14px;overflow:hidden;background:#0B1020;">
        <tr>
          <td style="padding:22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;color:#E9EEF9;">
            <h2 style="margin:0 0 10px 0;font-size:18px;line-height:1.3;font-weight:700;">
              New join request for <span style="color:#41E5FF;">${teamName}</span>
            </h2>
            <p style="margin:0 0 18px 0;color:rgba(233,238,249,0.75);font-size:14px;line-height:1.6;">
              ${requesterName} (${requesterEmail}) requested to join your team for ${eventName}.
            </p>

            ${
              safeMsg
                ? `<div style="margin:0 0 18px 0;">
                    <div style="color:rgba(233,238,249,0.70);font-size:12px;line-height:1.4;margin-bottom:8px;">Message</div>
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;color:rgba(233,238,249,0.90);font-size:14px;line-height:1.6;">
                      ${safeMsg}
                    </div>
                  </div>`
                : ""
            }

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px 0;">
              <tr>
                <td align="center" style="border-radius:14px;background:#FFFFFF;">
                  <a href="${escapeHtml(manageUrl)}" target="_blank"
                    style="display:inline-block;padding:12px 18px;font-weight:700;font-size:14px;text-decoration:none;color:#0B1020;border-radius:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;">
                    Review request
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:rgba(233,238,249,0.55);font-size:12px;line-height:1.5;">
              You can approve or deny this request on the team requests page.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = [
      `New join request for ${params.teamName} (${params.eventName})`,
      "",
      `${params.requesterName ?? "A participant"} (${params.requesterEmail}) requested to join.`,
      params.message ? `Message: ${params.message}` : "",
      "",
      `Review: ${manageUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const from =
      process.env.RESEND_FROM_EMAIL ?? "Ascend <onboarding@resend.dev>";

    const result = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject: `New join request for ${params.teamName}`,
      html,
      text,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return parseServerActionResponse({
        status: "ERROR",
        error: result.error.message,
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.data?.id ?? null,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to send join request email",
      data: null,
    }) as ActionState;
  }
}
