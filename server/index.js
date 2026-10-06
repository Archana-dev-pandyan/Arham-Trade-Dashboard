const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const BSE_URL = process.env.BSE_URL || "http://localhost:4000";
const SELF_URL = process.env.SELF_URL || "http://localhost:5000";
const trades = new Map(); // tradeId -> trade (dedupes automatically)
const sseClients = new Set();
let pulling = false;

function broadcast(event, data) {
  for (const r of sseClients) r.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Instant: returns whatever is already stored
app.get("/api/trades", (req, res) =>
  res.json({ pulling, count: trades.size, trades: [...trades.values()] }));

// Live channel to the browser
app.get("/api/events", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  res.write(`event: status\ndata: ${JSON.stringify({ pulling })}\n\n`);
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

// Start a pull, don't wait for it
app.post("/api/pull", async (req, res) => {
  if (pulling) return res.status(409).json({ error: "Pull already in progress" });
  pulling = true;
  broadcast("status", { pulling });
  try {
    const url = `${BSE_URL}/getTrades?callbackUrl=${encodeURIComponent(SELF_URL + "/api/callback")}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("BSE rejected the request");
    res.status(202).json({ message: "Pull started" });
  } catch (e) {
    pulling = false;
    broadcast("status", { pulling });
    res.status(502).json({ error: e.message });
  }
});

// BSE calls this when the pull finishes
app.post("/api/callback", (req, res) => {
  const fresh = [];
  for (const t of req.body.trades || []) {
    if (!trades.has(t.tradeId)) { trades.set(t.tradeId, t); fresh.push(t); }
  }
  pulling = false;
  broadcast("trades", fresh);
  broadcast("status", { pulling });
  res.sendStatus(200);
});

// Keep-alive only, so idle SSE connections aren't dropped (not a scheduler for pulls)
setInterval(() => { for (const r of sseClients) r.write(": ping\n\n"); }, 15000);

app.listen(5000, () => console.log("Server on 5000"));