/** Reads the access JWT via same-origin route (HttpOnly cookie is not visible to client JS). */
export async function fetchSocketToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/realtime/socket-token", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { token?: unknown };
    return typeof data.token === "string" && data.token.length > 0
      ? data.token
      : null;
  } catch {
    return null;
  }
}
