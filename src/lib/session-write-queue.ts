export type SessionWritePriority = "critical" | "normal";

type Waiter = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

type QueueJob = {
  priority: SessionWritePriority;
  coalesceKey?: string;
  run: () => Promise<unknown>;
  waiters: Waiter[];
};

type SessionQueueState = {
  running: boolean;
  pending: QueueJob[];
};

/**
 * Serializes mutations per dining session. Critical jobs (KOT, billing) run
 * before normal jobs (line saves). Pending normal jobs with the same coalesceKey
 * are merged so only the latest payload is sent.
 */
export class SessionWriteQueue {
  private readonly sessions = new Map<string, SessionQueueState>();

  enqueue<T>(
    sessionId: string,
    priority: SessionWritePriority,
    fn: () => Promise<T>,
    coalesceKey?: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let state = this.sessions.get(sessionId);
      if (!state) {
        state = { running: false, pending: [] };
        this.sessions.set(sessionId, state);
      }

      if (coalesceKey && priority === "normal") {
        const existing = state.pending.find(
          (job) => job.coalesceKey === coalesceKey && job.priority === "normal",
        );
        if (existing) {
          existing.run = fn as () => Promise<unknown>;
          existing.waiters.push({
            resolve: resolve as (value: unknown) => void,
            reject,
          });
          return;
        }
      }

      state.pending.push({
        priority,
        coalesceKey,
        run: fn as () => Promise<unknown>,
        waiters: [
          {
            resolve: resolve as (value: unknown) => void,
            reject,
          },
        ],
      });
      this.sortPending(state.pending);
      void this.pump(sessionId);
    });
  }

  private sortPending(pending: QueueJob[]) {
    pending.sort((a, b) => {
      const pa = a.priority === "critical" ? 0 : 1;
      const pb = b.priority === "critical" ? 0 : 1;
      return pa - pb;
    });
  }

  private async pump(sessionId: string) {
    const state = this.sessions.get(sessionId);
    if (!state || state.running || state.pending.length === 0) {
      return;
    }

    state.running = true;
    const job = state.pending.shift()!;

    try {
      const result = await job.run();
      for (const waiter of job.waiters) {
        waiter.resolve(result);
      }
    } catch (error) {
      for (const waiter of job.waiters) {
        waiter.reject(error);
      }
    } finally {
      state.running = false;
      if (state.pending.length === 0) {
        this.sessions.delete(sessionId);
      } else {
        void this.pump(sessionId);
      }
    }
  }
}

export const sessionWriteQueue = new SessionWriteQueue();
