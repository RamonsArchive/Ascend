import { parseServerActionResponse } from "../lib/utils";
import { FormDataType } from "../lib/global_types";
import { prisma } from "../lib/prisma";
import SendContactEmail from "../emails/SendContactEmail";
import { checkRateLimit } from "../lib/rate-limiter";

export const writeContactMessage = async (formObject: FormDataType) => {
  try {
    const isRateLimited = await checkRateLimit("writeContactMessage");
    if (isRateLimited.status === "ERROR") {
      return isRateLimited;
    }

    const { firstName, lastName, email, phone, organization, message } =
      formObject;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        organization,
        message,
      },
    });

    // emial with resend
    await SendContactEmail({ formObject });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: contactMessage,
    });
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to write contact message",
      data: null,
    });
  }
};
