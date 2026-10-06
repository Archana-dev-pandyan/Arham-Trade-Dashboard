const express = require("express");
const app = express();
const DELAY = Number(process.argv[2] ?? process.env.PULL_DELAY_MS ?? 900000); // 15 min default
const BATCH = 500;
const clients = ["ABC Capital", "XYZ Traders", "Orion Funds", "Delta Securities", "Nova Wealth"];
const symbols = [["TCS", 3400], ["INFY", 1500], ["RELIANCE", 2850], ["HDFCBANK", 1650], ["ITC", 430], ["SBIN", 780]];
let batchNo = 0;

function makeBatch(n) {
  const out = [];
  for (let i = 0; i < BATCH; i++) {
    const idx = n * BATCH + i;
    const [symbol, base] = symbols[idx % symbols.length];
    out.push({
      tradeId: "T" + String(idx + 1).padStart(6, "0"),
      client: clients[(idx * 7) % clients.length],
      symbol,
      quantity: ((idx * 13) % 20 + 1) * 10,
      price: +(base * (0.97 + ((idx * 17) % 60) / 1000)).toFixed(2),
      timestamp: new Date().toISOString(),
    });
  }
  return out;
}

app.get("/getTrades", (req, res) => {
  const { callbackUrl } = req.query;
  if (!callbackUrl) return res.status(400).json({ error: "callbackUrl required" });
  const n = batchNo++;
  res.status(202).json({ jobId: "job-" + n, estimatedMs: DELAY }); // reply instantly

  setTimeout(async () => {
    try {
      await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: "job-" + n, trades: makeBatch(n) }),
      });
    } catch (e) { console.error("Callback failed:", e.message); }
  }, DELAY);
});

app.listen(4000, () => console.log("Mock BSE on 4000, delay(ms):", DELAY));