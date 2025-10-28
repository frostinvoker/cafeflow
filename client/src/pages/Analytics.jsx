import { useEffect, useRef, useState } from "react";
import "../styles/Analytics.css";

const API = "http://localhost:5000/api";
const PERIODS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last Year", days: 365 }
];

export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [best, setBest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [period, setPeriod] = useState(PERIODS[0]);
  const graphRef = useRef(null);
  const svgRef = useRef(null);
  const [svgBox, setSvgBox] = useState({ leftOffset: 0, topOffset: 0, width: 0, height: 0 });

  // tooltip state for interactive SVG
  const [tooltip, setTooltip] = useState({ visible: false, left: 0, top: 0, html: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [sRes, bRes] = await Promise.all([
          fetch(`${API}/admin/analytics/sales-trend?days=${period.days}`, { credentials: 'include' }),
          fetch(`${API}/admin/analytics/best-sellers?limit=5`, { credentials: 'include' }),
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
  }, [period.days]);

  // Fixed y-axis scale for exact value mapping
  const STANDARD_MAX = 10000;
  // Create axis labels in ₱2000 increments
  const Y_AXIS_STEPS = [0, 2000, 4000, 6000, 8000, 10000];
  // Keep scale fixed at 10000 for direct value mapping
  const maxTotal = STANDARD_MAX;
  
  // Get min and max sales for visible range
  const minSales = sales.reduce((min, s) => Math.min(min, Number(s.total || 0)), Infinity) || 0;
  const maxSales = sales.reduce((max, s) => Math.max(max, Number(s.total || 0)), 0) || 0;
  const steps = Math.max(sales.length - 1, 1);

  // helper to compute normalized x (0-100) and y (0-100) positions
  const pointXY = (i) => {
    const x = steps === 0 ? 0 : (i / steps) * 100;
    // Always normalize against fixed 10000 scale
    const value = Number(sales[i]?.total || 0);
    // Clamp value to 0-10000 range for consistent scaling
    const clampedValue = Math.min(Math.max(value, 0), STANDARD_MAX);
    const y = 100 - (clampedValue / STANDARD_MAX * 100);
    return { x, y };
  };

  // build points string for polyline
  const points = sales.map((s, i) => {
    const { x, y } = pointXY(i);
    return `${x},${y}`;
  }).join(' ');

  const showTooltipFor = (i) => {
    if (!graphRef.current || !svgRef.current) return;
    const rect = graphRef.current.getBoundingClientRect();
    const srect = svgRef.current.getBoundingClientRect();
    const { x, y } = pointXY(i);
    const leftPx = (srect.left - rect.left) + (x / 100) * srect.width;
    // Position tooltip above the point with some offset
    const topPx = (srect.top - rect.top) + (y / 100) * srect.height - 10;
    const formattedDate = sales[i] && sales[i].date ? new Date(sales[i].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    const salesAmount = Number(sales[i]?.total || 0).toLocaleString();
    setTooltip({ visible: true, left: leftPx, top: topPx, html: `<strong>${formattedDate}</strong><br/>Sales: ₱${salesAmount}` });
  };

  const moveTooltipFor = (i) => {
    if (!graphRef.current || !svgRef.current) return;
    const rect = graphRef.current.getBoundingClientRect();
    const srect = svgRef.current.getBoundingClientRect();
    const { x, y } = pointXY(i);
    const leftPx = (srect.left - rect.left) + (x / 100) * srect.width;
    const topPx = (srect.top - rect.top) + (y / 100) * srect.height;
    setTooltip(t => ({ ...t, left: leftPx, top: topPx }));
  };

  // compute svg bounding box offsets used for precise label placement
  useEffect(() => {
    function updateBox() {
      if (!graphRef.current || !svgRef.current) return setSvgBox({ leftOffset: 0, topOffset: 0, width: 0, height: 0 });
      const crect = graphRef.current.getBoundingClientRect();
      const srect = svgRef.current.getBoundingClientRect();
      setSvgBox({ leftOffset: srect.left - crect.left, topOffset: srect.top - crect.top, width: srect.width, height: srect.height });
    }
    updateBox();
    window.addEventListener('resize', updateBox);
    const ro = new ResizeObserver(updateBox);
    if (graphRef.current) ro.observe(graphRef.current);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => { window.removeEventListener('resize', updateBox); ro.disconnect(); };
  }, [sales.length]);

  const hideTooltip = () => setTooltip(t => ({ ...t, visible: false }));

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const labelInterval = windowWidth < 768 ? Math.max(1, Math.ceil(sales.length / 4)) : Math.max(1, Math.ceil(sales.length / 6));

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

          {/* Sales overview */}
          <section className="sales-overview-section">
            <div className="card">
              <div className="card-header">
                <h3>Sales Overview</h3>
                <select
                  value={period.days}
                  onChange={(e) => setPeriod(PERIODS.find(p => p.days === Number(e.target.value)) || PERIODS[0])}
                  className="period-select"
                >
                  {PERIODS.map(p => (
                    <option key={p.days} value={p.days}>{p.label}</option>
                  ))}
                </select>
              </div>

              {sales.length === 0 ? (
                <div className="empty">No sales data</div>
              ) : (
                <div className="sales-list">
                  <div className="graph-container" id="graph-container" ref={graphRef}>

                    {/* tooltip positioned via state (pixels) */}
                    <div
                      className={`sales-tooltip ${tooltip.visible ? 'visible' : ''}`}
                      style={{ left: tooltip.left ? `${tooltip.left}px` : undefined, top: tooltip.top ? `${tooltip.top}px` : undefined }}
                      dangerouslySetInnerHTML={{ __html: tooltip.html }}
                    />

                    <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" className="sales-graph">
                      {/* Draw grid lines at standard ₱2,500 increments */}
                      {Y_AXIS_STEPS.map(price => {
                        const y = 100 - (price / STANDARD_MAX * 100);
                        return (
                          <line
                            key={price}
                            x1={0}
                            y1={y}
                            x2={100}
                            y2={y}
                            stroke="#e0e0e0"
                            strokeWidth="0.5"
                            className="grid-line"
                          />
                        );
                      })}

                      <polyline points={points} className="sales-line" />

                      {/* Reference line for the STANDARD_MAX (if within range) */}
                      {typeof STANDARD_MAX === 'number' && STANDARD_MAX <= maxTotal && (
                        (() => {
                          const refY = 100 - (STANDARD_MAX / maxTotal * 100);
                          return (
                            <g>
                              <line x1={0} y1={refY} x2={100} y2={refY} stroke="#ff6347" strokeWidth={0.4} strokeDasharray="3 3" />
                              <text x={2} y={Math.max(refY - 1.5, 3)} fill="#ff6347" fontSize={3} fontWeight={600}>Standard ₱{STANDARD_MAX.toLocaleString()}</text>
                            </g>
                          );
                        })()
                      )}

                      {sales.map((s, i) => {
                        const { x, y } = pointXY(i);
                        return (
                          <g key={s.date || i} className="data-point-group">
                            <g>
                              {/* Larger transparent circle for easier hover */}
                              <circle
                                cx={x}
                                cy={y}
                                r={4}
                                fill="transparent"
                                className="data-point-hover"
                                onMouseEnter={() => showTooltipFor(i)}
                                onMouseMove={() => moveTooltipFor(i)}
                                onMouseLeave={hideTooltip}
                                onTouchStart={() => showTooltipFor(i)}
                                onTouchMove={() => moveTooltipFor(i)}
                                onTouchEnd={hideTooltip}
                              />
                              {/* Visible data point */}
                              <circle
                                cx={x}
                                cy={y}
                                r={3}
                                className="data-point"
                                stroke="white"
                                strokeWidth={1}
                              />
                            </g>
                          </g>
                        );
                      })}
                    </svg>

                    {/* x-axis dates absolutely positioned to match normalized x */}
                    <div className="x-axis-dates">
                      {sales.map((s, i) => {
                        if (i % labelInterval !== 0) return null;
                        const x = (i / steps) * 100;
                        const leftPx = svgBox.width ? svgBox.leftOffset + (x / 100) * svgBox.width : null;
                        return (
                          <div key={s.date || i} className="date-label" style={leftPx != null ? { left: `${leftPx}px` } : { left: `${x}%` }}>
                            {new Date(s.date).getDate()}
                          </div>
                        );
                      })}
                    </div>

                    {/* Y-axis values at standard ₱2,500 increments */}
                    <div className="y-axis-values">
                      {Y_AXIS_STEPS.map(price => (
                        <div key={price} className="value-label">₱{price.toLocaleString()}</div>
                      ))}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Best sellers horizontal */}
          <section className="bestsellers-section">
            <div className="card">
              <h3>Best Sellers by Category</h3>
              {best.length === 0 ? (
                <div className="empty">No sales data available</div>
              ) : (
                <div className="bestsellers-container">
                  {best.map(category => (
                    <div key={category._id} className="category-section">
                      <h4 className="category-title">Top {Math.min(5, category.items.length)} {category._id}</h4>
                      {category.items.length === 0 ? (
                        <div className="empty">No sales data for {category._id}</div>
                      ) : (
                        <div className="category-chart">
                          <div className="chart-area">
                            {category.items.map((item, index) => {
                              const maxQty = Math.max(...category.items.map(i => i.quantity));
                              const height = `${(item.quantity / (maxQty || 1)) * 100}%`;
                              return (
                                <div key={item.menuItemId} className="bar-container" style={{ left: `${(index * 20)}%`, width: '18%' }}>
                                  <div className="bar" style={{ height }}>
                                    <div className="bar-tooltip"><strong>{item.name}</strong><br/>Sold: {item.quantity.toLocaleString()}<br/>Revenue: ₱{item.revenue.toLocaleString()}</div>
                                  </div>
                                  <div className="bar-quantity">{item.quantity.toLocaleString()}</div>
                                  <div className="bar-name">{item.name}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
