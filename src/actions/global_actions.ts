"use server";
import { parseServerActionResponse } from "../lib/utils";
import { ActionState, FormDataType } from "../lib/global_types";
import { prisma } from "../lib/prisma";
import SendContactEmail from "../emails/SendContactEmail";
import { checkRateLimit } from "../lib/rate-limiter";
import { contactFormSchema } from "../lib/validation";
import { auth } from "../lib/auth";
import { headers } from "next/headers";
import { SponsorVisibility } from "@prisma/client";

export const writeContactMessage = async (formObject: FormDataType) => {
  try {
    const isRateLimited = await checkRateLimit("writeContactMessage");
    if (isRateLimited.status === "ERROR") {
      return isRateLimited;
    }

    const { firstName, lastName, email, phone, organization, message } =
      formObject;

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      organization,
      message,
    };
    const parsed = await contactFormSchema.safeParseAsync(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid form data";
      return parseServerActionResponse({
        status: "ERROR",
        error: message,
        data: null,
      });
    }

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

export const fetchSponsorLibrary = async (
  query?: string
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("fetchSponsorLibrary");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const q = (query ?? "").trim();
    const userId = session.user.id;

    const sponsors = await prisma.sponsor.findMany({
      where: {
        AND: [
          {
            OR: [
              { createdById: userId },
              { visibility: SponsorVisibility.PUBLIC },
            ],
          },
          q
            ? {
                OR: [
                  { name: { contains: q } },
                  { websiteKey: { contains: q } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        websiteKey: true,
        description: true,
        logoKey: true,
        coverKey: true,
        visibility: true,
        createdById: true,
        updatedAt: true,
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: sponsors,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch sponsor library",
      data: null,
    }) as ActionState;
  }
};
