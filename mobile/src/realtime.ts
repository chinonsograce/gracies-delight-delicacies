/**
 * Minimal Supabase Realtime (Phoenix channel) subscriber for cart_items,
 * ported from web/lib/realtime.ts for React Native (global WebSocket).
 * Realtime applies the table's RLS policies to the access_token used at join,
 * so only the signed-in user's own cart rows are ever delivered — no filter.
 */
export type RealtimeConfig = { url: string | null; key: string | null };

export function subscribeCartChanges(
  config: RealtimeConfig,
  accessToken: string,
  onChange: () => void,
): () => void {
  if (!config.url || !config.key) return () => {};

  const wsUrl =
    config.url.replace(/^http/, "ws") +
    "/realtime/v1/websocket?apikey=" +
    encodeURIComponent(config.key) +
    "&vsn=1.0.0";

  let socket: WebSocket | null = null;
  let closed = false;
  let joined = false;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retries = 0;

  const cleanup = () => {
    closed = true;
    if (pingTimer) clearInterval(pingTimer);
    if (pollTimer) clearInterval(pollTimer);
    if (retryTimer) clearTimeout(retryTimer);
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      try {
        socket.close();
      } catch {
        /* already closed */
      }
    }
  };

  const connect = () => {
    if (closed) return;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      scheduleRetry();
      return;
    }

    socket.onopen = () => {
      retries = 0;
      socket?.send(
        JSON.stringify({
          topic: "realtime:public.cart_items",
          event: "phx_join",
          ref: "1",
          join_ref: "1",
          payload: {
            config: {
              broadcast: { self: true },
              presence: { key: "" },
              postgres_changes: [
                { event: "*", schema: "public", table: "cart_items" },
              ],
            },
            access_token: accessToken,
          },
        }),
      );
      pingTimer = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", ref: String(Date.now()), payload: {} }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      let message: { topic?: string; event?: string; payload?: { status?: string; type?: string; data?: { schema?: string; table?: string } } };
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message.event === "phx_reply" && message.topic === "realtime:public.cart_items" && message.payload?.status === "ok") joined = true;
      else if (
        message.event === "postgres_changes" &&
        message.payload?.data?.schema === "public" &&
        message.payload?.data?.table === "cart_items"
      ) {
        onChange();
      }
    };

    socket.onerror = () => {
      /* onclose follows and handles retry */
    };
    socket.onclose = () => {
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = null;
      joined = false;
      scheduleRetry();
    };
  };

  const scheduleRetry = () => {
    if (closed) return;
    retries += 1;
    if (retries > 5) return;
    retryTimer = setTimeout(connect, Math.min(1000 * 2 ** retries, 15000));
  };

  connect();
  // Safety net: if the socket never joins (network policy, protocol drift),
  // refresh on a slow poll so bags still converge.
  pollTimer = setInterval(() => {
    if (!joined) onChange();
  }, 15000);
  return cleanup;
}
