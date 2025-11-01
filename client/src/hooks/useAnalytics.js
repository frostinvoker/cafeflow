import { useCallback, useEffect, useMemo, useState } from "react";

// ---- config/env ----
const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

// Export so the component can render the period <select>
export const PERIODS = [
  { label: "Daily", days: 30 },
  { label: "Monthly", days: 365, group: "month" },
];

// ---- utils ----
const fmtPHP = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const yyyy_mm_dd = (d) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const addDays = (d, n) => {
  const t = new Date(d);
  t.setDate(t.getDate() + n);
  return t;
};
// --- monthly helpers ---
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const monthKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleString("en-US", { month: "short", year: "numeric" });
};

/**
 * Aggregate raw daily sales into last <months> months, filling missing months with 0
 * raw: [{ date: 'YYYY-MM-DD', total: number }, ...]
 */
const toMonthlySeries = (raw, months = 12) => {
  const list = Array.isArray(raw) ? raw : [];
  if (months <= 0) return [];

  // sum totals per month from raw
  const byMonth = new Map();
  for (const r of list) {
    const d = new Date(r.date);
    const key = monthKey(d);
    const v = Number(r.total || 0);
    byMonth.set(key, (byMonth.get(key) || 0) + v);
  }

  // pick end = latest date we have (fallback: today), then build exact N months
  let latest = list.length ? new Date(list[0].date) : new Date();
  for (const r of list)
    if (new Date(r.date) > latest) latest = new Date(r.date);
  const endMonth = new Date(latest.getFullYear(), latest.getMonth(), 1);
  const startMonth = addMonths(endMonth, -(months - 1));

  const out = [];
  for (let i = 0; i < months; i++) {
    const cur = addMonths(startMonth, i);
    const key = monthKey(cur);
    out.push({ month: key, total: byMonth.get(key) || 0 });
  }
  return out;
};

/**
 * Fill missing days with zero totals so the x-axis shows every date.
 * raw: [{ date: '2025-10-01', total: 123 }, ...]
 */
const densifySales = (raw, days) => {
  const list = Array.isArray(raw) ? raw.slice() : [];
  if (list.length === 0) {
    // build last <days> with zeros ending today
    const end = new Date();
    const start = addDays(end, -(days - 1));
    const out = [];
    for (let d = 0; d < days; d++) {
      const cur = addDays(start, d);
      out.push({ date: yyyy_mm_dd(cur), total: 0 });
    }
    return out;
  }
  // map by date
  const byKey = new Map();
  for (const r of list) byKey.set(yyyy_mm_dd(r.date), Number(r.total || 0));

  // choose end = latest date in data (or today if future-safe)
  const latest = list.reduce(
    (acc, r) => (new Date(r.date) > acc ? new Date(r.date) : acc),
    new Date(list[0].date)
  );
  const end = latest > new Date() ? latest : latest;
  const start = addDays(end, -(days - 1));

  const out = [];
  for (let d = 0; d < days; d++) {
    const cur = addDays(start, d);
    const key = yyyy_mm_dd(cur);
    out.push({ date: key, total: byKey.get(key) ?? 0 });
  }
  return out;
};

const buildCategoryChart = (category) => {
  const items = (category?.items ?? []).slice(0, 5);
  const totalOrders = items.reduce((a, b) => a + (b?.orderCount ?? 0), 0);
  const totalQty = items.reduce((a, b) => a + (b?.quantity ?? 0), 0);

  const labels = items.map((it) => it?.name ?? "");
  const qty = items.map((it) => it?.quantity ?? 0);
  const pct = items.map((it, idx) => {
    if (totalOrders > 0) return ((it?.orderCount ?? 0) / totalOrders) * 100;
    return totalQty > 0 ? (qty[idx] / totalQty) * 100 : 0;
  });

  return { labels, qty, pct, items };
};

// ---- hook ----
export function useAnalytics() {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [salesRaw, setSalesRaw] = useState([]);
  const [best, setBest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchAll = useCallback(async (days, signal) => {
    const [sRes, bRes] = await Promise.all([
      fetch(`${API_BASE}/admin/analytics/sales-trend?days=${days}`, {
        credentials: "include",
        signal,
      }),
      fetch(`${API_BASE}/admin/analytics/best-sellers?limit=5&days=${days}`, {
        credentials: "include",
        signal,
      }),
    ]);
    if (!sRes.ok) throw new Error("Failed to fetch sales trend");
    if (!bRes.ok) throw new Error("Failed to fetch best sellers");
    const sData = await sRes.json();
    const bData = await bRes.json();
    return { sData: sData || [], bData: bData || [] };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { sData, bData } = await fetchAll(period.days, controller.signal);
        setSalesRaw(Array.isArray(sData) ? sData : []);
        setBest(Array.isArray(bData) ? bData : []);
      } catch (e) {
        if (e.name !== "AbortError")
          setErr(e.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [period.days, fetchAll]);

  // ---- derived (chart-ready) ----
  // Build daily series (used for 30 days)
  const dailySeries = useMemo(
    () => densifySales(salesRaw, period.days),
    [salesRaw, period.days]
  );

  // Build monthly series (used for Last Year)
  const monthlySeries = useMemo(
    () => (period.group === "month" ? toMonthlySeries(salesRaw, 12) : []),
    [salesRaw, period.group]
  );

  // Labels & values switch based on group
  const lineLabels = useMemo(() => {
    if (period.group === "month") {
      return monthlySeries.map((m) => monthLabel(m.month));
    }
    return dailySeries.map((s) =>
      new Date(s.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );
  }, [period.group, monthlySeries, dailySeries]);

  const lineValues = useMemo(() => {
    if (period.group === "month")
      return monthlySeries.map((m) => Number(m.total || 0));
    return dailySeries.map((s) => Number(s.total || 0));
  }, [period.group, monthlySeries, dailySeries]);

  const STANDARD_MAX = 30000;
  const Y_STEP = period.group === "month" ? 10000 : 5000;

  const yMax = useMemo(() => {
    const maxVal = Math.max(0, ...lineValues);
    const stepped = Math.ceil(maxVal / Y_STEP) * Y_STEP || Y_STEP;
    return Math.max(STANDARD_MAX, stepped);
  }, [lineValues]);

  const chartData = useMemo(
    () => ({
      labels: lineLabels,
      datasets: [
        {
          label: "Sales",
          data: lineValues,
          borderColor: "#006599",
          backgroundColor: "rgba(0,101,153,.12)",
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [lineLabels, lineValues]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 12, left: 8, bottom: 18 } },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label || "",
            label: (ctx) => `Sales: ${fmtPHP(ctx.parsed.y)}`,
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
                content: `Standard ${fmtPHP(STANDARD_MAX)}`,
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
            maxRotation: 0,
          },
        },
        y: {
          min: 0,
          max: yMax,
          grid: { color: "#e9ecef" },
          ticks: {
            stepSize: Y_STEP,
            callback: (v) => fmtPHP(v),
          },
        },
      },
    }),
    [yMax]
  );

  return {
    // meta
    loading,
    err,
    setErr,

    // period control
    PERIODS,
    period,
    setPeriod,

    // data for charts
    chartData,
    chartOptions,

    // best sellers raw and helper
    best,
    buildCategoryChart,

    // utils
    fmtPHP,
  };
}
