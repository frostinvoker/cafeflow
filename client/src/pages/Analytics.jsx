import { useEffect, useState } from "react";
import "../styles/Analytics.css";

const API = "http://localhost:5000/api";

export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [best, setBest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [sRes, bRes] = await Promise.all([
          fetch(`${API}/admin/analytics/sales-trend?days=30`, { credentials: 'include' }),
          fetch(`${API}/admin/analytics/best-sellers?limit=10`, { credentials: 'include' }),
        ]);

        if (!sRes.ok) throw new Error('Failed to fetch sales trend');
        if (!bRes.ok) throw new Error('Failed to fetch best sellers');

        const sData = await sRes.json();
        const bData = await bRes.json();
        if (!cancelled) {
          setSales(sData || []);
          setBest(bData || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const maxTotal = sales.reduce((m, s) => Math.max(m, Number(s.total || 0)), 0) || 1;

  return (
    <div className="default-container analytics-container">
      <h2>Analytics Dashboard</h2>
      <p>Sales trends and best-selling menu items for the cafe.</p>

      {loading ? (
        <div style={{ padding: '1rem' }}>Loading…</div>
      ) : err ? (
        <div style={{ color: '#b91c1c', padding: '1rem' }}>{err}</div>
      ) : (
        <div className="analytics-grid">
          <section className="card">
            <h3>Sales (last 30 days)</h3>
            {sales.length === 0 ? (
              <div className="empty">No sales data</div>
            ) : (
              <div className="sales-list">
                {sales.map((row) => (
                  <div key={row.date} className="sales-row">
                    <div className="date">{row.date}</div>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ width: `${Math.round((Number(row.total || 0) / maxTotal) * 100)}%` }}
                        title={`₱ ${Number(row.total || 0).toFixed(2)}`}
                      />
                    </div>
                    <div className="amount">₱ {Number(row.total || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h3>Best Sellers</h3>
            {best.length === 0 ? (
              <div className="empty">No data</div>
            ) : (
              <table className="best-table" cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {best.map((b) => (
                    <tr key={String(b.menuItemId || b._id || b.name)}>
                      <td>{b.name}</td>
                      <td>{b.quantity}</td>
                      <td>₱ {Number(b.revenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
