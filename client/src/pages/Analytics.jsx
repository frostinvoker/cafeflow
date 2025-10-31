import { useEffect, useState } from "react";
import "../styles/Analytics.css";

import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  annotationPlugin,
  BarElement
);

const API = "http://localhost:5000/api";
const PERIODS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last Year", days: 365 },
];

// Currency formatter for PHP
const formatCurrency = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
function buildCategoryChart(category) {
  const items = (category?.items ?? []).slice(0, 5);

  
  const totalOrders = items.reduce((a, b) => a + (b?.orderCount ?? 0), 0);
  const totalQty = items.reduce((a, b) => a + (b?.quantity ?? 0), 0);

  const labels = items.map((it) => it?.name ?? "");
  const qty = items.map((it) => it?.quantity ?? 0);
  const pct = items.map((it, idx) => {
    if (totalOrders > 0) {
      return ((it?.orderCount ?? 0) / totalOrders) * 100;
    }
    
    return totalQty > 0 ? (qty[idx] / totalQty) * 100 : 0;
  });

  return { labels, qty, pct, items };
}
export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [best, setBest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [period, setPeriod] = useState(PERIODS[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [sRes, bRes] = await Promise.all([
          fetch(`${API}/admin/analytics/sales-trend?days=${period.days}`, {
            credentials: "include",
          }),
          fetch(
            `${API}/admin/analytics/best-sellers?limit=5&days=${period.days}`,
            { credentials: "include" }
          ),
        ]);
        if (!sRes.ok) throw new Error("Failed to fetch sales trend");
        if (!bRes.ok) throw new Error("Failed to fetch best sellers");

        const sData = await sRes.json();
        const bData = await bRes.json();
        if (!cancelled) {
          setSales(sData || []);
          setBest(bData || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period.days]);

  // Chart.js config
  const STANDARD_MAX = 30000;
  const Y_STEP = 5000;
  const labels = sales.map((s) =>
    new Date(s.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const values = sales.map((s) => Number(s.total || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sales",
        data: values,
        borderColor: "#006599",
        backgroundColor: "rgba(0,101,153,.12)",
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, right: 12, left: 8, bottom: 18 } },
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || "",
          label: (ctx) => `Sales: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
      annotation: {
        annotations: {
          standardLine: {
            type: "line",
            yMin: STANDARD_MAX,
            yMax: STANDARD_MAX,
            borderColor: "#ff6347",
            borderDash: [6, 6],
            borderWidth: 1.5,
            label: {
              display: true,
              content: `Standard ${formatCurrency(STANDARD_MAX)}`,
              position: "start",
              backgroundColor: "transparent",
              color: "#ff6347",
              font: { weight: "bold" },
              padding: 0,
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#e9ecef" },
        ticks: {
          autoSkip: false,
          maxRotation: 0, },
      },
      y: {
        min: 0,
        max: STANDARD_MAX, 
        grid: { color: "#e9ecef" },
        ticks: {
          stepSize: Y_STEP, 
          callback: (v) => formatCurrency(v),
        },
      },
    },
  };

  return (
    <div className="default-container analytics-container">
      <h2>Analytics Dashboard</h2>
      <p>Sales trends and best-selling menu items for the cafe.</p>

      {loading ? (
        <div style={{ padding: "1rem" }}>Loading…</div>
      ) : err ? (
        <div style={{ color: "#b91c1c", padding: "1rem" }}>{err}</div>
      ) : (
        <div className="analytics-grid">
          {/* Sales overview */}
          <section className="sales-overview-section">
            <div className="card">
              <div className="card-header">
                <h3>Sales Overview</h3>
                <select
                  value={period.days}
                  onChange={(e) =>
                    setPeriod(
                      PERIODS.find((p) => p.days === Number(e.target.value)) ||
                        PERIODS[0]
                    )
                  }
                  className="period-select"
                >
                  {PERIODS.map((p) => (
                    <option key={p.days} value={p.days}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {sales.length === 0 ? (
                <div className="empty">No sales data</div>
              ) : (
                <div className="sales-list">
                  <div className="graph-container">
                    {/* Chart.js canvas */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 320,
                      }}
                    >
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Best sellers */}
          <section className="bestsellers-section">
            <div className="card">
              <h3>Best Sellers by Category</h3>
              {best.length === 0 ? (
                <div className="empty">No sales data available</div>
              ) : (
                <div className="bestsellers-container">
                  {best.map((category) => {
                    const cfg = buildCategoryChart(category);
                    return (
                      <div key={category._id} className="category-section">
                        <h4 className="category-title">Top 5 {category._id}</h4>

                        {category.items.length === 0 ? (
                          <div className="empty">
                            No sales data for {category._id}
                          </div>
                        ) : (
                          <div className="category-chart">
                            <div className="chart-area" style={{ height: 260 }}>
                              <Bar
                                data={{
                                  labels: cfg.labels,
                                  datasets: [
                                    {
                                      label: "Qty Sold",
                                      data: cfg.qty,
                                      backgroundColor: "rgba(0,101,153,0.30)",
                                      borderColor: "#006599",
                                      borderWidth: 1,
                                      barPercentage: 0.7,      
                                      categoryPercentage: 0.7, 
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        title: (items) =>
                                          items?.[0]?.label ?? "",
                                        label: (ctx) => {
                                          const i = ctx.dataIndex;
                                          const it = cfg.items[i];
                                          const pct = cfg.pct[i] ?? 0;
                                          const lines = [
                                            `Number of Orders: ${
                                              it?.quantity?.toLocaleString?.() ??
                                              0
                                            }`,
                                            `% of Orders: ${pct.toFixed(1)}%`,
                                          ];
                                          if (it?.revenue != null) {
                                            lines.push(
                                              `Revenue: ${formatCurrency(
                                                it.revenue
                                              )}`
                                            );
                                          }
                                          return lines;
                                        },
                                      },
                                    },
                                  },
                                  layout: {
                                    padding: {
                                      top: 8,
                                      right: 12,
                                      left: 8,
                                      bottom: 8,
                                    },
                                  },
                                  scales: {
                                    x: {
                                      grid: { display: false },
                                      ticks: {
                                        autoSkip: false,
                                        maxRotation: 0,
                                        maxTicksLimit: 0,
                                        font: { size: 11 },
                                        callback: (value, idx) => {
                                            const label = cfg.labels[idx] ?? "";
                                            return label.length > 14 ? label.slice(0, 14) + "…" : label;
                                        },
                                      },
                                    },
                                    y: {
                                      beginAtZero: true,
                                      grid: { color: "#e9ecef" },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
