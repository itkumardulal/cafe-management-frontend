import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Server timed out. Check your connection and try again.";
    }
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      return "Cannot reach the server. Check your connection or try again in a moment.";
    }
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
