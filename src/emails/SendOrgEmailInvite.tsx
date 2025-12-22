import resend from "@/src/lib/resend";
import { parseServerActionResponse } from "@/src/lib/utils";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildOrgInviteEmailHtml(params: {
  baseUrl: string;
  orgName: string;
  orgSlug: string;
  inviterName?: string | null;
  invitedEmail: string;
  acceptUrl: string;
  message?: string | null;
  expiresAtLabel?: string | null;
}) {
  const orgName = escapeHtml(params.orgName);
  const inviter = escapeHtml(params.inviterName ?? "An admin");
  const invitedEmail = escapeHtml(params.invitedEmail);
  const acceptUrl = params.acceptUrl;
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
  <title>You're invited to join ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#070A12;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Invitation to join ${orgName} on Ascend
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#070A12;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;border:1px solid rgba(255,255,255,0.10);border-radius:14px;overflow:hidden;background:#0B1020;">
          <tr>
            <td style="padding:18px 22px;background:radial-gradient(1200px circle at 25% 0%, rgba(91,124,255,0.22) 0%, rgba(11,16,32,0) 42%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));border-bottom:1px solid rgba(255,255,255,0.08);">
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
                You’re invited to join <span style="color:#B5C7FF;">${orgName}</span>
              </h2>
              <p style="margin:0 0 18px 0;color:rgba(233,238,249,0.75);font-size:14px;line-height:1.6;">
                ${inviter} invited <strong>${invitedEmail}</strong> to join this organization on Ascend.
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
                      Accept invite
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

function buildOrgInviteEmailText(params: {
  orgName: string;
  inviterName?: string | null;
  invitedEmail: string;
  acceptUrl: string;
  message?: string | null;
  expiresAtLabel?: string | null;
}) {
  const inviter = params.inviterName ?? "An admin";
  return [
    `You're invited to join ${params.orgName} on Ascend`,
    "",
    `${inviter} invited ${params.invitedEmail} to join.`,
    params.message ? `Message: ${params.message}` : "",
    "",
    `Accept invite: ${params.acceptUrl}`,
    params.expiresAtLabel ? `Expires: ${params.expiresAtLabel}` : "",
    "",
    "If you didn’t expect this invite, ignore this email.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function SendOrgEmailInvite(params: {
  toEmail: string;
  orgName: string;
  orgSlug: string;
  inviterName?: string | null;
  token: string;
  message?: string | null;
  expiresAt?: Date | null;
}) {
  const baseUrl =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const acceptUrl = `${baseUrl}/app/orgs/${params.orgSlug}/join/${params.token}`;

  const expiresAtLabel = params.expiresAt
    ? params.expiresAt.toLocaleString("en-US")
    : null;

  const html = buildOrgInviteEmailHtml({
    baseUrl,
    orgName: params.orgName,
    orgSlug: params.orgSlug,
    inviterName: params.inviterName,
    invitedEmail: params.toEmail,
    acceptUrl,
    message: params.message ?? null,
    expiresAtLabel,
  });

  const text = buildOrgInviteEmailText({
    orgName: params.orgName,
    inviterName: params.inviterName,
    invitedEmail: params.toEmail,
    acceptUrl,
    message: params.message ?? null,
    expiresAtLabel,
  });

  try {
    const from =
      process.env.RESEND_FROM_EMAIL ?? "Ascend <onboarding@resend.dev>";

    const result = await resend.emails.send({
      from,
      to: [params.toEmail],
      subject: `Invite to join ${params.orgName} on Ascend`,
      html,
      text,
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
      error: "Failed to send invite email",
      data: null,
    });
  }
}
