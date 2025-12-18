import { parseServerActionResponse } from "../lib/utils";
import { FormDataType } from "../lib/global_types";
import { prisma } from "../lib/prisma";

export const writeContactMessage = async (formData: FormDataType) => {
  try {
    const { firstName, lastName, email, phone, organization, message } =
      formData;

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
