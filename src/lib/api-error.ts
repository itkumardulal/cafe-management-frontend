import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;
  if (typeof message === "string") {
    return message;
  }
  if (Array.isArray(message) && message.length > 0) {
    return message.join(", ");
  }

  return fallback;
}
