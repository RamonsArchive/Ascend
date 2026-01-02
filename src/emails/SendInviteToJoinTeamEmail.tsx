// src/emails/SendInviteToJoinTeamEmail.ts
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

function formatExpires(expiresAt: Date | null | undefined) {
  if (!expiresAt) return null;
  return expiresAt.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildHtml(params: {
  baseUrl: string;
  orgSlug: string;
  eventSlug: string;
  teamName: string;
  eventName: string;
  invitedEmail: string;
  inviterName?: string | null;
  token: string;
  message?: string | null;
  expiresAt?: Date | null;
}) {
  const teamName = escapeHtml(params.teamName);
  const eventName = escapeHtml(params.eventName);
  const inviter = escapeHtml(params.inviterName ?? "A team leader");
  const invitedEmail = escapeHtml(params.invitedEmail);

  const acceptUrlRaw = `${params.baseUrl}/app/orgs/${params.orgSlug}/events/${params.eventSlug}/team-invites/${params.token}`;
  const acceptUrl = escapeHtml(acceptUrlRaw);

  const safeMsg = params.message
    ? escapeHtml(params.message).replaceAll("\n", "<br />")
    : "";

  const expiresLabel = formatExpires(params.expiresAt);
  const expires = expiresLabel ? escapeHtml(expiresLabel) : "";

  const logoUrl = `${params.baseUrl}/Logos/Transparent/ascend_logo_white_t.png`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>You're invited to join ${teamName}</title>
</head>
<body style="margin:0;padding:0;background:#070A12;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Invitation to join ${teamName} for ${eventName} on Ascend
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#070A12;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
          style="width:600px;max-width:600px;border:1px solid rgba(255,255,255,0.10);border-radius:14px;overflow:hidden;background:#0B1020;">
          <tr>
            <td style="padding:18px 22px;background:radial-gradient(1200px circle at 25% 0%, rgba(65,229,255,0.18) 0%, rgba(11,16,32,0) 42%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));border-bottom:1px solid rgba(255,255,255,0.08);">
              <img src="${logoUrl}" alt="Ascend" width="140" height="32" style="display:block;outline:none;border:none;text-decoration:none;" />
            </td>
          </tr>

          <tr>
            <td style="padding:24px 22px 26px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;color:#E9EEF9;">
              <h2 style="margin:0 0 10px 0;font-size:18px;line-height:1.3;font-weight:700;">
                You’re invited to join <span style="color:#41E5FF;">${teamName}</span>
              </h2>

              <p style="margin:0 0 18px 0;color:rgba(233,238,249,0.75);font-size:14px;line-height:1.6;">
                ${inviter} invited <strong>${invitedEmail}</strong> to join this team for ${eventName} on Ascend.
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
                    <a href="${acceptUrl}" target="_blank"
                      style="display:inline-block;padding:12px 18px;font-weight:700;font-size:14px;text-decoration:none;color:#0B1020;border-radius:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;">
                      Join team
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px 0;color:rgba(233,238,249,0.60);font-size:12px;line-height:1.5;">
                Or copy and paste: <span style="color:rgba(233,238,249,0.85);word-break:break-all;">${acceptUrl}</span>
              </p>

              ${
                expires
                  ? `<p style="margin:0 0 18px 0;color:rgba(233,238,249,0.60);font-size:12px;line-height:1.5;">
                      This invite expires ${expires}.
                    </p>`
                  : ""
              }

              <hr style="margin:18px 0;border:none;border-top:1px solid rgba(255,255,255,0.08);" />
              <p style="margin:0;color:rgba(233,238,249,0.55);font-size:12px;line-height:1.5;">
                If you didn’t expect this invite, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(params: {
  baseUrl: string;
  orgSlug: string;
  eventSlug: string;
  teamName: string;
  eventName: string;
  invitedEmail: string;
  inviterName?: string | null;
  token: string;
  message?: string | null;
  expiresAt?: Date | null;
}) {
  const inviter = params.inviterName ?? "A team leader";
  const acceptUrl = `${params.baseUrl}/app/orgs/${params.orgSlug}/events/${params.eventSlug}/team-invites/${params.token}`;
  const expires = formatExpires(params.expiresAt);

  return [
    `You're invited to join ${params.teamName} for ${params.eventName} on Ascend`,
    "",
    `${inviter} invited ${params.invitedEmail} to join.`,
    params.message ? `Message: ${params.message}` : "",
    "",
    `Join team: ${acceptUrl}`,
    expires ? `Expires: ${expires}` : "",
    "",
    "If you didn’t expect this invite, ignore this email.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function SendInviteToJoinTeamEmail(params: {
  toEmail: string;
  orgSlug: string;
  eventSlug: string;
  teamName: string;
  eventName: string;
  inviterName?: string | null;
  token: string; // TeamInvite.token
  message?: string | null;
  expiresAt?: Date | null;
}): Promise<ActionState> {
  try {
    const baseUrl = getBaseUrl(); // use your helper, and make it hard-fail there if needed
    if (!baseUrl) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "BASE_URL_MISSING",
        data: null,
      }) as ActionState;
    }

    const from =
      process.env.RESEND_FROM_EMAIL ?? "Ascend <onboarding@resend.dev>";

    const html = buildHtml({
      baseUrl,
      invitedEmail: params.toEmail,
      ...params,
    });
    const text = buildText({
      baseUrl,
      invitedEmail: params.toEmail,
      ...params,
    });

    const result = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject: `Invite to join ${params.teamName} on Ascend`,
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
      error: "Failed to send invite email",
      data: null,
    }) as ActionState;
  }
}
