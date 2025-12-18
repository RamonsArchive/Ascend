export const parseServerActionResponse = <T>(response: T): T => {
  return JSON.parse(JSON.stringify(response));
};

// Phone number formatting
export const updatePhoneNumber = (
  value: string,
  phoneNumber: string,
  setPhoneNumber: (value: string) => void,
) => {
  // If the user is backspacing and hit a dash, remove the digit before the dash
  const prevLength = phoneNumber.length;
  const newLength = value.length;

  // Check if user is backspacing on a dash
  if (newLength < prevLength) {
    const deletedChar = phoneNumber[newLength];
    if (deletedChar === "-") {
      // Remove the digit before the dash as well
      const withoutDash = phoneNumber.slice(0, newLength);
      const withoutLastDigit = withoutDash.slice(0, -1);
      setPhoneNumber(withoutLastDigit);
      return;
    }
  }

  // Normal processing
  const cleanedValue = value.replace(/[^0-9]/g, "");

  if (cleanedValue.length > 10) {
    return;
  }

  // Format the number
  let formattedValue = cleanedValue;
  if (cleanedValue.length >= 6) {
    formattedValue = `${cleanedValue.slice(0, 3)}-${cleanedValue.slice(
      3,
      6,
    )}-${cleanedValue.slice(6, 10)}`;
  } else if (cleanedValue.length >= 3) {
    formattedValue = `${cleanedValue.slice(0, 3)}-${cleanedValue.slice(3)}`;
  }

  setPhoneNumber(formattedValue);
};

export const formDataToObject = (formData: FormData) => {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value.toString();
  }
  return obj;
};

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Not available";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
}
