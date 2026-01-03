import type {
  EventType,
  OrgJoinMode,
  OrgMembership,
  Prisma,
  Sponsor,
} from "@prisma/client";

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
  baseUrl: string; // ✅ new

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
  isMember: boolean;

  // status flags computed on server
  disabledReason:
    | null
    | "INVITE_INVALID"
    | "INVITE_EXPIRED"
    | "INVITE_NOT_PENDING"
    | "LINK_INVALID"
    | "LINK_EXPIRED"
    | "LINK_NOT_PENDING"
    | "LINK_MAX_USES_REACHED"
    | "EMAIL_MISMATCH";

  acceptAction: (token: string) => Promise<ActionState>;
};

export type EventNavData = {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  status: string;
};

export type OrgMember = Prisma.OrgMembershipGetPayload<{
  select: {
    id: true;
    userId: true;
    role: true;
    createdAt: true;
    user: { select: { id: true; name: true; email: true; image: true } };
  };
}>;

export type OrgMemberResponse = Omit<OrgMember, "createdAt"> & {
  createdAt: string;
};
export type EventBucket = "UPCOMING" | "LIVE" | "PAST";

export type SponsorPublic = Pick<
  Sponsor,
  "id" | "name" | "slug" | "websiteKey" | "description" | "logoKey" | "coverKey"
>;

export type SponsorLinkBase = {
  id: string;
  sponsorId: string;
  tier: SponsorTier;
  isActive: boolean;
  displayName: string | null;
  blurb: string | null;
  logoKey: string | null;
  order: number; // UI sorting
  // “outer” override (if you add it later to org/event link models)
  websiteKey?: string | null;
  sponsor: SponsorPublic;
};

export type PublicOrgSponsorLink = SponsorLinkBase & { orgId: string };
export type PublicEventSponsorLink = SponsorLinkBase & { eventId: string };

export type OrgListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoKey: string | null;
  coverKey: string | null;
  _count: { memberships: number };
};

export type PublicEventListItem = {
  id: string;
  slug: string;
  name: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  type: EventType;
  joinMode: OrgJoinMode;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date; // ✅ add this
  registrationClosesAt: Date | null;
  coverKey: string | null;
  orgId: string;
  org: {
    id: string;
    name: string;
    slug: string;
    logoKey: string | null;
  };
};

export type EventLikeForTime = {
  startAt: Date | string | null;
  endAt: Date | string | null;
  createdAt?: Date | string; // optional for public list items
};

export type EventCompleteData = {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  status: string;

  type: string;
  visibility: string;
  joinMode: string;

  heroTitle: string | null;
  heroSubtitle: string | null;

  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
  startAt: Date | null;
  endAt: Date | null;
  submitDueAt: Date | null;
  rulesMarkdown: string | null;
  rubricMarkdown: string | null;
  locationAddress: string | null;
  locationName: string | null;
  locationNotes: string | null;
  locationMapUrl: string | null;

  maxTeamSize: number;
  allowSelfJoinRequests: boolean;
  lockTeamChangesAtStart: boolean;
  requireImages: boolean;
  requireVideoDemo: boolean;

  coverKey: string | null;

  org: { id: string; name: string; slug: string; logoKey: string | null };

  tracks: TrackDraft[];
  awards: AwardDraft[];

  sponsors: PublicEventSponsorLink[];

  _count: {
    teams: number;
    submissions: number;
    staff: number;
    members: number;
  };
};

export type EventMembersData = {
  eventId: string;
  teams: Array<{
    id: string;
    slug: string;
    name: string;
    track: {
      id: string;
      name: string;
    };
    lookingForMembers: boolean;
    createdAt: string;
    members: Array<{
      id: string; // TeamMember.id
      userId: string;
      role: "LEADER" | "MEMBER";
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
  }>;
  unassigned: Array<{
    id: string; // EventParticipant.id
    userId: string;
    status: string; // ParticipantStatus
    lookingForTeam: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
};

export type UnassignedMember = {
  id: string; // EventParticipant.id
  userId: string;
  status: string;
  lookingForTeam: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export type TrackDraft = {
  clientId: string;
  name: string;
  blurb: string;
  order: string; // keep as string for input
};

export type AwardDraft = {
  clientId: string;
  name: string;
  blurb: string;
  order: string; // keep as string for input
  allowMultipleWinners: boolean;
};

export type EventSettingsView =
  | "DETAILS"
  | "CONTENT"
  | "TEAM_RULES"
  | "TRACKS"
  | "AWARDS"
  | "INVITES"
  | "MEMBERS"
  | "SPONSORS"
  | "STAFF";

export type OrgSettingsData = Prisma.OrganizationGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    publicEmail: true;
    publicPhone: true;
    websiteUrl: true;
    contactNote: true;
    logoKey: true;
    coverKey: true;
    allowJoinRequests: true;
    joinMode: true;
    memberships: {
      select: {
        id: true;
        orgId: true;
        userId: true;
        role: true;
        createdAt: true;
        user: {
          select: { id: true; name: true; email: true; image: true };
        };
      };
    };
    joinRequests: {
      select: {
        id: true;
        orgId: true;
        userId: true;
        message: true;
        status: true;
        createdAt: true;
        updatedAt: true;
        user: {
          select: { id: true; name: true; email: true; image: true };
        };
      };
    };
    sponsors: {
      select: {
        id: true;
        sponsorId: true;
        order: true;
        createdAt: true;
        updatedAt: true;
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
    };
  };
}>;

export type SettingsTab<TView extends string> = {
  key: TView;
  label: string;
  description: string;
};

export type SettingsSection<TView extends string> = {
  key: TView;
  render: () => React.ReactNode;
};

export type OrgSettingsView =
  | "DETAILS"
  | "JOIN"
  | "MEMBERS"
  | "SPONSORS"
  | "EVENTS";

export type OrgRole = OrgMembership["role"];

export type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: Date;
  user: { id: string; name: string; email: string; image: string | null };
};

export type SponsorLibraryItem = {
  id: string;
  name: string;
  slug: string;
  websiteKey: string | null;
  description: string | null;
  logoKey: string | null;
  coverKey: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdById: string | null;
};

export type EventStaffRole = Prisma.EventStaffMembershipGetPayload<{
  select: { role: true };
}>["role"];

export type EventStaffRow = Prisma.EventStaffMembershipGetPayload<{
  select: {
    userId: true;
    role: true;
    user: { select: { id: true; name: true; email: true; image: true } };
  };
}>;

export type EventStaffData = {
  eventId: string;
  staff: EventStaffRow[];
};

export type PrivateEventTrack = {
  id: string;
  name: string;
  blurb?: string | null;
};

export type PrivateEventAward = {
  id: string;
  name: string;
  blurb?: string | null;
  order?: number | null;
};

export type PrivateEventTeamCardData = {
  id: string;
  slug: string;
  name: string;
  lookingForMembers: boolean;
  createdAt: string | Date;
  track: { id: string; name: string } | null;
  members: Array<{
    id: string;
    role: "LEADER" | "MEMBER";
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
};

export type EventInfoPageData = {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  status: string;

  type: string;
  visibility: string;
  joinMode: string;

  heroTitle: string | null;
  heroSubtitle: string | null;

  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  startAt: string | null;
  endAt: string | null;
  submitDueAt: string | null;

  rulesMarkdown: string | null;
  rubricMarkdown: string | null;

  locationAddress: string | null;
  locationName: string | null;
  locationNotes: string | null;
  locationMapUrl: string | null;

  tracks: TrackDraft[];
  awards: AwardDraft[];

  _count: {
    teams: number;
    submissions: number;
    staff: number;
    members: number;
  };

  org: { id: string; name: string; slug: string; logoKey: string | null };
};

export type Candidate = {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  source: "TEAM" | "UNASSIGNED";
};

/* join gate */

export type JoinGateDisabledReason =
  | "INVITE_INVALID"
  | "INVITE_EXPIRED"
  | "INVITE_NOT_PENDING"
  | "LINK_INVALID"
  | "LINK_EXPIRED"
  | "LINK_NOT_PENDING"
  | "LINK_MAX_USES_REACHED"
  | "EMAIL_MISMATCH"
  | null;

export type JoinGateSessionShape = {
  userId: string | null;
  email: string | null;
  name: string | null;
};

export type JoinGateKind = "EMAIL_INVITE" | "INVITE_LINK";
export type JoinGateEntityType = "ORG" | "EVENT" | "STAFF" | "TEAM";

// Minimal entity shapes per gate
export type JoinGateOrgEntity = {
  name: string;
  slug: string; // orgSlug
  description?: string | null;
};

export type JoinGateEventEntity = {
  name: string;
  slug: string; // eventSlug
  orgSlug: string;
  description?: string | null;
};

export type JoinGateStaffEntity = {
  name: string;
  slug: string; // eventSlug (staff is scoped to event)
  orgSlug: string;
  description?: string | null;
  role?: string | null; // optional if you want to show it
};

export type JoinGateTeamEntity = {
  name: string;
  slug: string; // teamSlug
  orgSlug: string;
  eventSlug: string;
  description?: string | null;
};

export type JoinGateEntity =
  | JoinGateOrgEntity
  | JoinGateEventEntity
  | JoinGateStaffEntity
  | JoinGateTeamEntity;

export type JoinGateProps = {
  baseUrl: string;
  kind: JoinGateKind;
  entityType: JoinGateEntityType;
  entity: JoinGateEntity;
  inviteEmail?: string | null;
  session: JoinGateSessionShape;
  isMember: boolean;
  token: string;
  disabledReason: JoinGateDisabledReason;
  acceptAction: (token: string) => Promise<ActionState>;
};
