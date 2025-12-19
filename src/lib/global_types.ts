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
