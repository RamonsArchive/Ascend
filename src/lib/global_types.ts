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
