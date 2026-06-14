export type RefreshFailure = {
  message: string;
  status?: number;
  isNetwork?: boolean;
};

export class SessionRefreshError extends Error {
  status?: number;
  isNetwork?: boolean;

  constructor(payload: RefreshFailure) {
    super(payload.message);
    this.name = "SessionRefreshError";
    this.status = payload.status;
    this.isNetwork = payload.isNetwork;
  }
}

export function isRecoverableRefreshFailure(error: unknown): boolean {
  if (error instanceof SessionRefreshError) {
    return isRecoverableRefreshPayload({
      status: error.status,
      isNetwork: error.isNetwork,
    });
  }
  return false;
}

export function isRecoverableRefreshPayload(
  payload: Pick<RefreshFailure, "status" | "isNetwork"> | undefined,
): boolean {
  if (!payload) {
    return false;
  }
  if (payload.isNetwork) {
    return true;
  }
  if (payload.status === 429) {
    return true;
  }
  if (payload.status && payload.status >= 500) {
    return true;
  }
  return false;
}
