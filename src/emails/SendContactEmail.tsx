import { FormDataType } from "../lib/global_types";
import resend from "../lib/resend";
import { parseServerActionResponse } from "../lib/utils";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildContactEmailHtml(params: {
  baseUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  message: string;
}) {
  const safeFirstName = escapeHtml(params.firstName);
  const safeLastName = escapeHtml(params.lastName);
  const safeEmail = escapeHtml(params.email);
  const safePhone = params.phone ? escapeHtml(params.phone) : "";
  const safeOrg = params.organization ? escapeHtml(params.organization) : "";
  const safeMessage = escapeHtml(params.message).replaceAll("\n", "<br />");

  // For dark email backgrounds, use a white logo with transparent background.
  const logoUrl = params.baseUrl
    ? `${params.baseUrl}/Logos/Transparent/ascend_logo_white_t.png`
    : "";

  const nameLine = `${safeFirstName} ${safeLastName}`.trim();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>New contact message</title>
  </head>
  <body style="margin:0;padding:0;background:#070A12;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      New contact message from ${nameLine || "website visitor"}
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#070A12;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px;max-width:600px;border:1px solid rgba(255,255,255,0.10);border-radius:14px;overflow:hidden;background:#0B1020;">
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
                  New contact message
                </h2>
                <p style="margin:0 0 22px 0;color:rgba(233,238,249,0.75);font-size:14px;line-height:1.6;">
                  You received a new message through the Ascend contact form.
                </p>

                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;">
                  <div style="margin:0 0 10px 0;">
                    <div style="color:rgba(233,238,249,0.70);font-size:12px;line-height:1.4;">Name</div>
                    <div style="font-weight:600;font-size:14px;line-height:1.5;">${nameLine || "-"}</div>
                  </div>

                  <div style="margin:0 0 ${
                    safePhone || safeOrg ? "10" : "0"
                  }px 0;">
                    <div style="color:rgba(233,238,249,0.70);font-size:12px;line-height:1.4;">Email</div>
                    <div style="font-weight:600;font-size:14px;line-height:1.5;">${safeEmail || "-"}</div>
                  </div>

                  ${
                    safePhone
                      ? `<div style="margin:0 0 ${safeOrg ? "10" : "0"}px 0;">
                          <div style="color:rgba(233,238,249,0.70);font-size:12px;line-height:1.4;">Phone</div>
                          <div style="font-weight:600;font-size:14px;line-height:1.5;">${safePhone}</div>
                        </div>`
                      : ""
                  }

                  ${
                    safeOrg
                      ? `<div style="margin:0;">
                          <div style="color:rgba(233,238,249,0.70);font-size:12px;line-height:1.4;">Organization</div>
                          <div style="font-weight:600;font-size:14px;line-height:1.5;">${safeOrg}</div>
                        </div>`
                      : ""
                  }
                </div>

                <div style="margin-top:18px;">
                  <div style="color:rgba(233,238,249,0.70);font-size:12px;line-height:1.4;margin-bottom:8px;">Message</div>
                  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;color:rgba(233,238,249,0.90);font-size:14px;line-height:1.6;">
                    ${safeMessage || "-"}
                  </div>
                </div>

                <hr style="margin:22px 0 14px 0;border:none;border-top:1px solid rgba(255,255,255,0.08);" />

                <p style="margin:0;color:rgba(233,238,249,0.55);font-size:12px;line-height:1.5;">
                  This email was automatically generated from the Ascend website.
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

function buildContactEmailText(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  message: string;
}) {
  const name = `${params.firstName} ${params.lastName}`.trim();
  return [
    "New contact message (Ascend)",
    "",
    `Name: ${name || "-"}`,
    `Email: ${params.email || "-"}`,
    `Phone: ${params.phone || "-"}`,
    `Organization: ${params.organization || "-"}`,
    "",
    "Message:",
    params.message || "-",
    "",
    "—",
    "This email was automatically generated from the Ascend website.",
  ].join("\n");
}

const SendContactEmail = async ({
  formObject,
}: {
  formObject: FormDataType;
}) => {
  const { firstName, lastName, email, phone, organization, message } =
    formObject;

  // Emails need absolute URLs for images. Configure SITE_URL (preferred) or
  // NEXT_PUBLIC_SITE_URL. On Vercel, VERCEL_URL is supported.
  const baseUrl =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const html = buildContactEmailHtml({
    baseUrl,
    firstName,
    lastName,
    email,
    phone: phone || undefined,
    organization: organization || undefined,
    message,
  });

  const text = buildContactEmailText({
    firstName,
    lastName,
    email,
    phone: phone || undefined,
    organization: organization || undefined,
    message,
  });

  try {
    const companyEmail = process.env.COMPANY_EMAIL;
    if (!companyEmail) {
      throw new Error("COMPANY_EMAIL is not set");
    }

    // In production, set a verified sender in RESEND_FROM_EMAIL.
    // Example: "Ascend <hello@yourdomain.com>"
    const from =
      process.env.RESEND_FROM_EMAIL ?? "Ascend <onboarding@resend.dev>";

    const result = await resend.emails.send({
      from,
      to: [companyEmail],
      subject: `New contact form submission: ${firstName} ${lastName}`.trim(),
      html,
      text,
      replyTo: email,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log("Project ticket email sent successfully:", result.data?.id);
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.data?.id,
    });
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to send email",
      data: null,
    });
  }
};

export default SendContactEmail;
