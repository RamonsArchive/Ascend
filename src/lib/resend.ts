import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
if (!resendKey) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(resendKey);

export default resend;
