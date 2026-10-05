type Options = { url: string; key: string; token: string; onChange: () => void };

// Minimal Supabase Realtime (Phoenix channel) subscriber for one table.
// Deliberately dependency-free so the hosted build's lockfile stays untouched.
// Realtime applies the table's RLS policies to the access_token used at join,
// so only the signed-in user's own cart rows are ever delivered.
export function subscribeTableChanges(opts: Options): () => void {
  const host = opts.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const topic = "realtime:cart-sync";
  let ws: WebSocket | null = null;
  let closed = false;
  let joined = false;
  let ref = 0;
  let heartbeat = 0;
  let reconnect = 0;
  let poll = 0;
  let delay = 1000;

  const send = (message: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  };

  function connect() {
    if (closed) return;
    try {
      ws = new WebSocket(`wss://${host}/realtime/v1/websocket?apikey=${encodeURIComponent(opts.key)}&vsn=1.0.0`);
    } catch {
      schedule();
      return;
    }
    ws.onopen = () => {
      delay = 1000;
      const joinRef = String(++ref);
      send({
        topic,
        event: "phx_join",
        payload: {
          config: {
            broadcast: { self: true },
            presence: { key: "" },
            postgres_changes: [{ event: "*", schema: "public", table: "cart_items" }],
          },
          access_token: opts.token,
        },
        ref: joinRef,
        join_ref: joinRef,
      });
    };
    ws.onmessage = (event) => {
      let message: { topic?: string; event?: string; payload?: { status?: string; data?: { schema?: string; table?: string } } };
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message.event === "phx_reply" && message.topic === topic && message.payload?.status === "ok") joined = true;
      else if (message.event === "postgres_changes" && message.payload?.data?.schema === "public" && message.payload?.data?.table === "cart_items") opts.onChange();
    };
    ws.onclose = () => {
      joined = false;
      window.clearInterval(heartbeat);
      schedule();
    };
    ws.onerror = () => {
      ws?.close();
    };
    heartbeat = window.setInterval(() => send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(++ref) }), 25000);
  }

  function schedule() {
    if (closed) return;
    window.clearTimeout(reconnect);
    reconnect = window.setTimeout(connect, delay);
    delay = Math.min(15000, delay * 2);
  }

  connect();
  // Safety net: if the socket never joins (network policy, protocol drift),
  // refresh on a slow poll so carts still converge.
  poll = window.setInterval(() => {
    if (!joined) opts.onChange();
  }, 15000);

  return () => {
    closed = true;
    window.clearInterval(heartbeat);
    window.clearInterval(poll);
    window.clearTimeout(reconnect);
    ws?.close();
  };
}
