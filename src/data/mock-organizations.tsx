// mock organizations
import { Organization } from "@prisma/client";

export const mockOrganizations: Organization[] = [
  {
    id: "org_ascend",
    name: "Ascend",
    slug: "ascend",
    logoUrl: "/Logos/Transparent/ascend_logo_t.png",
    coverUrl: "/GlobalAssets/Hero/himg2.png",
    moderationStatus: "ACTIVE",
    description:
      "Ascend is building the modern event layer for ambitious builders.",
    publicEmail: "hello@ascend.com",
    publicPhone: "+1234567890",
    websiteUrl: "https://ascend.com",
    contactNote: "Email us for sponsorships",
    createdAt: new Date("2025-12-01T00:00:00Z"),
    updatedAt: new Date("2025-12-01T00:00:00Z"),
  },
  {
    id: "org_clutch_studio",
    name: "Clutch Studio",
    slug: "clutch-studio",
    logoUrl: "/Logos/Transparent/ascend_logo_black_t.png",
    coverUrl: "/GlobalAssets/Hero/himg1.jpg",
    moderationStatus: "ACTIVE",
    description:
      "A product studio helping teams ship beautiful, durable software.",
    publicEmail: "hello@clutchstudio.com",
    publicPhone: "+1234567890",
    websiteUrl: "https://clutchstudio.com",
    contactNote: "Email us for sponsorships",
    createdAt: new Date("2025-12-02T00:00:00Z"),
    updatedAt: new Date("2025-12-02T00:00:00Z"),
  },
  {
    id: "org_systems_guild",
    name: "Systems Guild",
    slug: "systems-guild",
    logoUrl: "/Logos/Transparent/ascend_logo_white_t.png",
    coverUrl: "/GlobalAssets/Hero/himg2.png",
    moderationStatus: "ACTIVE",
    description:
      "A community for engineers exploring reliability, infra, and AI systems.",
    publicEmail: "hello@systemsguild.com",
    publicPhone: "+1234567890",
    websiteUrl: "https://systemsguild.com",
    contactNote: "Email us for sponsorships",
    createdAt: new Date("2025-12-03T00:00:00Z"),
    updatedAt: new Date("2025-12-03T00:00:00Z"),
  },
  {
    id: "org_green_future_labs",
    name: "Green Future Labs",
    slug: "green-future-labs",
    logoUrl: "/Logos/Transparent/ascend_logo_t.png",
    coverUrl: "/GlobalAssets/Hero/himg1.jpg",
    moderationStatus: "ACTIVE",
    description:
      "Builders and researchers working on climate-forward technology.",
    publicEmail: "hello@greenfuturelabs.com",
    publicPhone: "+1234567890",
    websiteUrl: "https://greenfuturelabs.com",
    contactNote: "Email us for sponsorships",
    createdAt: new Date("2025-12-04T00:00:00Z"),
    updatedAt: new Date("2025-12-04T00:00:00Z"),
  },
];
