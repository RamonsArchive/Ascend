export const parseServerActionResponse = <T>(response: T): T => {
  return JSON.parse(JSON.stringify(response));
};
