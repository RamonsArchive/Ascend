import resend from "@/src/lib/resend";
import { getBaseUrl, parseServerActionResponse } from "@/src/lib/utils";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEventStaffInviteEmailHtml(params: {
  baseUrl: string;
  orgName: string;
  eventName: string;
  inviterName?: string | null;
  invitedEmail: string;
  role: string;
  joinUrl: string;
  message?: string | null;
  expiresAtLabel?: string | null;
}) {
  const orgName = escapeHtml(params.orgName);
  const eventName = escapeHtml(params.eventName);
  const inviter = escapeHtml(params.inviterName ?? "An admin");
  const invitedEmail = escapeHtml(params.invitedEmail);
  const role = escapeHtml(params.role);
  const joinUrl = params.joinUrl;

  const safeMsg = params.message
    ? escapeHtml(params.message).replaceAll("\n", "<br />")
    : "";

  const expires = params.expiresAtLabel
    ? escapeHtml(params.expiresAtLabel)
    : "";

  const logoUrl = params.baseUrl
    ? `${params.baseUrl}/Logos/Transparent/ascend_logo_white_t.png`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>You're invited to join ${eventName} staff</title>
</head>
<body style="margin:0;padding:0;background:#070A12;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Staff invitation for ${eventName} on Ascend
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#070A12;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
          style="width:600px;max-width:600px;border:1px solid rgba(255,255,255,0.10);border-radius:14px;overflow:hidden;background:#0B1020;">
          <tr>
            <td style="padding:18px 22px;background:radial-gradient(1200px circle at 25% 0%, rgba(255,61,138,0.18) 0%, rgba(11,16,32,0) 42%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));border-bottom:1px solid rgba(255,255,255,0.08);">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="Ascend" width="140" height="32" style="display:block;outline:none;border:none;text-decoration:none;" />`
                  : `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;font-weight:700;letter-spacing:0.08em;font-size:12px;color:rgba(233,238,249,0.85);">ASCEND</div>`
              }
            </td>
          </tr>

          <tr>
            <td style="padding:24px 22px 26px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;color:#E9EEF9;">
              <h2 style="margin:0 0 10px 0;font-size:18px;line-height:1.3;font-weight:700;">
                You’re invited to join <span style="color:#FF3D8A;">${eventName}</span> as staff
              </h2>

              <p style="margin:0 0 18px 0;color:rgba(233,238,249,0.75);font-size:14px;line-height:1.6;">
                ${inviter} invited <strong>${invitedEmail}</strong> to join
                <strong>${orgName}</strong> • <strong>${eventName}</strong> as
                <span style="color:rgba(233,238,249,0.90);font-weight:700;">${role}</span>.
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
                    <a href="${joinUrl}" target="_blank"
                      style="display:inline-block;padding:12px 18px;font-weight:700;font-size:14px;text-decoration:none;color:#0B1020;border-radius:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,system-ui,sans-serif;">
                      Join staff
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px 0;color:rgba(233,238,249,0.60);font-size:12px;line-height:1.5;">
                Or copy and paste:
                <span style="color:rgba(233,238,249,0.85);word-break:break-all;">${joinUrl}</span>
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

export async function SendEventStaffEmailInvite(params: {
  toEmail: string;
  inviterName?: string | null;
  orgName: string;
  eventName: string;
  role: string;
  joinUrl: string;
  message?: string | null;
  expiresAt?: Date | null;
}) {
  const baseUrl = getBaseUrl();

  const expiresAtLabel = params.expiresAt
    ? params.expiresAt.toLocaleString("en-US")
    : null;

  const html = buildEventStaffInviteEmailHtml({
    baseUrl,
    orgName: params.orgName,
    eventName: params.eventName,
    inviterName: params.inviterName,
    invitedEmail: params.toEmail,
    role: params.role,
    joinUrl: params.joinUrl,
    message: params.message ?? null,
    expiresAtLabel,
  });

  try {
    const from =
      process.env.RESEND_FROM_EMAIL ?? "Ascend <onboarding@resend.dev>";

    const result = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject: `Staff invite: ${params.eventName} (${params.role}) on Ascend`,
      html,
      text: `You were invited to join ${params.eventName} as ${params.role}. Join: ${params.joinUrl}`,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      throw new Error(result.error.message);
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.data?.id ?? null,
    });
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to send staff invite email",
      data: null,
    });
  }
}
