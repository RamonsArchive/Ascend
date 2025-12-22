import type { Prisma } from "@prisma/client";

export type ActionState = {
  status: "INITIAL" | "PENDING" | "SUCCESS" | "ERROR";
  error: string | null;
  data: unknown | null;
};

export type FormDataType = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  message: string;
};

export type NewOrgFormDataType = {
  name: string;
  description: string;

  publicEmail: string;
  publicPhone: string;
  websiteUrl: string;
  // File inputs (client-side only). Server action receives these as FormData.
  logoFile: File | null;
  coverFile: File | null;
  contactNote: string;
};

export type SponsorTier =
  | "TITLE"
  | "PLATINUM"
  | "GOLD"
  | "SILVER"
  | "BRONZE"
  | "COMMUNITY";

export type OrgSponsorWithSponsor = Prisma.OrganizationSponsorGetPayload<{
  include: {
    sponsor: {
      select: {
        id: true;
        name: true;
        slug: true;
        websiteKey: true;
        description: true;
        logoKey: true;
        coverKey: true;
      };
    };
  };
}>;

export type OrgJoinRequestWithUser = Prisma.OrgJoinRequestGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
  };
}>;

export type JoinSettingsErrors = Partial<
  Record<"joinMode" | "allowJoinRequests", string>
>;

export type JoinOrgGateProps = {
  kind: "EMAIL_INVITE" | "INVITE_LINK";
  org: {
    name: string;
    slug: string;
    description: string | null;
  };
  // email invites only
  inviteEmail?: string | null;

  session: {
    userId: string | null;
    email: string | null;
    name: string | null;
  };

  token: string;

  // status flags computed on server
  disabledReason:
    | null
    | "INVITE_INVALID"
    | "INVITE_EXPIRED"
    | "INVITE_NOT_PENDING"
    | "LINK_INVALID"
    | "LINK_EXPIRED"
    | "LINK_NOT_PENDING"
    | "LINK_MAX_USES_REACHED";

  acceptAction: (token: string) => Promise<ActionState>;
};
