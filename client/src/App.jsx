import { useEffect, useState } from "react";
const API = "http://localhost:5000";

export default function App() {
  const [trades, setTrades] = useState([]);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/trades`).then(r => r.json()).then(d => {
      setTrades(d.trades); setPulling(d.pulling);
    });
    const es = new EventSource(`${API}/api/events`);
    es.addEventListener("trades", e => {
      const fresh = JSON.parse(e.data);
      setTrades(prev => {
        const seen = new Set(prev.map(t => t.tradeId));
        return [...prev, ...fresh.filter(t => !seen.has(t.tradeId))];
      });
    });
    es.addEventListener("status", e => setPulling(JSON.parse(e.data).pulling));
    return () => es.close();
  }, []);

  const startPull = () => fetch(`${API}/api/pull`, { method: "POST" });

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Trades Dashboard</h2>
      <button onClick={startPull} disabled={pulling}>
        {pulling ? "Pull in progress..." : "Start pull"}
      </button>
      <p>Total trades: {trades.length}</p>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead><tr>
          <th>Trade ID</th><th>Client</th><th>Symbol</th><th>Qty</th><th>Price</th><th>Time</th>
        </tr></thead>
        <tbody>
          {[...trades].reverse().slice(0, 200).map(t => (
            <tr key={t.tradeId}>
              <td>{t.tradeId}</td><td>{t.client}</td><td>{t.symbol}</td>
              <td>{t.quantity}</td><td>₹{t.price}</td>
              <td>{new Date(t.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}