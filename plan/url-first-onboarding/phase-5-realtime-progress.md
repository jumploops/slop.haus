# Phase 5: Real-time Progress

## Status: ✅ Complete (2026-01-11)

**Implementation Notes:**
- Added SSE endpoint at `GET /api/v1/drafts/:draftId/events`
- Uses polling-based approach (1 poll/second, 2 min timeout)
- Sends status, progress, complete, error, and heartbeat events
- Created `useDraftProgress` hook for client-side consumption
- Heartbeats sent every 15 seconds to prevent proxy timeouts

## Goal

Implement Server-Sent Events (SSE) endpoint to provide real-time progress updates during URL analysis.

## Dependencies

- Phase 4 complete (draft API endpoints)

## Tasks

### 5.1 Create SSE Endpoint

**File:** `apps/api/src/routes/drafts.ts`

Add to existing drafts router:

```typescript
import { streamSSE } from "hono/streaming";

// GET /api/v1/drafts/:draftId/events - SSE stream for progress
app.get("/:draftId/events", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  // Verify ownership
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id)
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found" }, 404);
  }

  return streamSSE(c, async (stream) => {
    let lastStatus = draft.status;
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max (1 poll per second)

    // Send initial status
    await stream.writeSSE({
      event: "status",
      data: JSON.stringify({
        status: lastStatus,
        message: getStatusMessage(lastStatus),
      }),
    });

    // Poll for updates
    while (pollCount < maxPolls) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      pollCount++;

      const [currentDraft] = await db
        .select()
        .from(enrichmentDrafts)
        .where(eq(enrichmentDrafts.id, draftId));

      if (!currentDraft) {
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({
            error: "Draft not found",
            code: "DRAFT_NOT_FOUND",
          }),
        });
        break;
      }

      // Status changed
      if (currentDraft.status !== lastStatus) {
        lastStatus = currentDraft.status;

        if (lastStatus === "ready") {
          await stream.writeSSE({
            event: "complete",
            data: JSON.stringify({ draftId }),
          });
          break;
        }

        if (lastStatus === "failed") {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({
              error: currentDraft.error || "Analysis failed",
              code: "ANALYSIS_FAILED",
            }),
          });
          break;
        }

        await stream.writeSSE({
          event: "status",
          data: JSON.stringify({
            status: lastStatus,
            message: getStatusMessage(lastStatus),
          }),
        });

        // Send progress event for step completion
        if (lastStatus === "analyzing") {
          await stream.writeSSE({
            event: "progress",
            data: JSON.stringify({
              step: "scraping",
              status: "completed",
            }),
          });
        }
      }

      // Heartbeat every 15 seconds
      if (pollCount % 15 === 0) {
        await stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ timestamp: Date.now() }),
        });
      }
    }

    // Timeout
    if (pollCount >= maxPolls) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          error: "Analysis timed out",
          code: "TIMEOUT",
        }),
      });
    }
  });
});

function getStatusMessage(status: string): string {
  switch (status) {
    case "pending":
      return "Starting analysis...";
    case "scraping":
      return "Fetching page content...";
    case "analyzing":
      return "Extracting project details...";
    case "ready":
      return "Analysis complete!";
    case "failed":
      return "Analysis failed";
    default:
      return "Processing...";
  }
}
```

### 5.2 Alternative: Pub/Sub with Redis (Production)

For production scalability, consider Redis pub/sub:

**File:** `apps/api/src/lib/draft-events.ts`

```typescript
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export interface DraftEvent {
  type: "status" | "progress" | "complete" | "error";
  draftId: string;
  data: Record<string, unknown>;
}

export async function publishDraftEvent(event: DraftEvent): Promise<void> {
  await redis.publish(`draft:${event.draftId}`, JSON.stringify(event));
}

export function subscribeToDraft(
  draftId: string,
  callback: (event: DraftEvent) => void
): () => void {
  const subscriber = redis.duplicate();
  const channel = `draft:${draftId}`;

  subscriber.subscribe(channel);
  subscriber.on("message", (ch, message) => {
    if (ch === channel) {
      callback(JSON.parse(message));
    }
  });

  return () => {
    subscriber.unsubscribe(channel);
    subscriber.disconnect();
  };
}
```

**Worker updates:**
```typescript
// In scrape-url.ts after status update
await publishDraftEvent({
  type: "status",
  draftId,
  data: { status: "scraping", message: "Fetching page content..." },
});
```

### 5.3 Client-Side SSE Hook

**File:** `apps/web/src/hooks/useDraftProgress.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import type { DraftStatus } from "@slop/shared";

interface ProgressState {
  status: DraftStatus;
  message: string;
  error: string | null;
  isComplete: boolean;
  steps: {
    scraping: "pending" | "in_progress" | "completed";
    analyzing: "pending" | "in_progress" | "completed";
  };
}

export function useDraftProgress(draftId: string | null) {
  const [state, setState] = useState<ProgressState>({
    status: "pending",
    message: "Starting analysis...",
    error: null,
    isComplete: false,
    steps: {
      scraping: "pending",
      analyzing: "pending",
    },
  });

  useEffect(() => {
    if (!draftId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const eventSource = new EventSource(
      `${apiUrl}/api/v1/drafts/${draftId}/events`,
      { withCredentials: true }
    );

    eventSource.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        status: data.status,
        message: data.message,
        steps: {
          scraping: data.status === "scraping" ? "in_progress" :
                   data.status === "analyzing" || data.status === "ready" ? "completed" : "pending",
          analyzing: data.status === "analyzing" ? "in_progress" :
                    data.status === "ready" ? "completed" : "pending",
        },
      }));
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        steps: {
          ...prev.steps,
          [data.step]: data.status,
        },
      }));
    });

    eventSource.addEventListener("complete", () => {
      setState((prev) => ({
        ...prev,
        status: "ready",
        message: "Analysis complete!",
        isComplete: true,
        steps: {
          scraping: "completed",
          analyzing: "completed",
        },
      }));
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        setState((prev) => ({
          ...prev,
          error: data.error,
          status: "failed",
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Connection lost",
        }));
      }
      eventSource.close();
    });

    eventSource.onerror = () => {
      // Connection error - might reconnect automatically
      console.warn("SSE connection error");
    };

    return () => {
      eventSource.close();
    };
  }, [draftId]);

  const reset = useCallback(() => {
    setState({
      status: "pending",
      message: "Starting analysis...",
      error: null,
      isComplete: false,
      steps: {
        scraping: "pending",
        analyzing: "pending",
      },
    });
  }, []);

  return { ...state, reset };
}
```

## SSE Event Types

### status
Sent when draft status changes.
```json
{
  "event": "status",
  "data": {
    "status": "scraping",
    "message": "Fetching page content..."
  }
}
```

### progress
Sent when a step completes.
```json
{
  "event": "progress",
  "data": {
    "step": "scraping",
    "status": "completed"
  }
}
```

### complete
Sent when analysis is ready.
```json
{
  "event": "complete",
  "data": {
    "draftId": "uuid"
  }
}
```

### error
Sent on failure.
```json
{
  "event": "error",
  "data": {
    "error": "Failed to scrape URL",
    "code": "SCRAPE_FAILED"
  }
}
```

### heartbeat
Sent periodically to keep connection alive.
```json
{
  "event": "heartbeat",
  "data": {
    "timestamp": 1704931200000
  }
}
```

## Verification

- [ ] SSE endpoint streams events correctly
- [ ] Status updates sent on draft status change
- [ ] Progress events sent on step completion
- [ ] Complete event sent when ready
- [ ] Error event sent on failure
- [ ] Heartbeats sent every 15 seconds
- [ ] Connection closes on complete/error/timeout
- [ ] Client hook handles all event types
- [ ] Client reconnects on connection loss

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/routes/drafts.ts` | Add SSE endpoint |
| `apps/web/src/hooks/useDraftProgress.ts` | NEW |

## Notes

- MVP uses polling-based SSE (simpler, works without Redis)
- Production should use Redis pub/sub for scalability
- SSE timeout is 2 minutes (120 polls at 1/second)
- Heartbeats prevent proxy/load balancer timeouts
- Client uses `withCredentials: true` for cookie auth
- EventSource auto-reconnects on connection loss

## CORS Considerations

Ensure SSE endpoint allows credentials:

```typescript
// In apps/api/src/index.ts
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:3000",
  credentials: true,
}));
```

## Fallback: Polling

If SSE doesn't work (corporate proxies, etc.), client can fall back to polling:

```typescript
// Polling fallback
const pollInterval = setInterval(async () => {
  const res = await fetch(`${apiUrl}/api/v1/drafts/${draftId}`);
  const data = await res.json();

  if (data.draft.status === "ready") {
    clearInterval(pollInterval);
    // Handle complete
  }
}, 2000);
```
