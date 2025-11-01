import { useEffect } from "react";
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

import { useAnalytics } from "../hooks/useAnalytics"; // <-- new hook

// Register once here
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

export default function Analytics() {
  const {
    loading,
    err,
    setErr,
    PERIODS,
    period,
    setPeriod,
    chartData,
    chartOptions,
    best,
    buildCategoryChart,
    fmtPHP,
  } = useAnalytics();

  // optional: clear error on unmount to avoid stale toasts
  useEffect(() => () => setErr(""), [setErr]);

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

              {!chartData.labels?.length ? (
                <div className="empty">No sales data</div>
              ) : (
                <div className="sales-list">
                  <div className="graph-container">
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
                                              `Revenue: ${fmtPHP(it.revenue)}`
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
                                          return label.length > 14
                                            ? label.slice(0, 14) + "…"
                                            : label;
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
