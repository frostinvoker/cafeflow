import { useEffect, useRef, useState } from "react";
import "../../styles/lowstock.css";

export default function LowStockToast({
  threshold = 3,
  pollMs = 30000,
  apiBase = "",
}) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);

  function loadSeen() {
    try {
      return JSON.parse(localStorage.getItem("seenLowStock") || "{}");
    } catch {
      return {};
    }
  }
  const seenRef = useRef(loadSeen());
  const dismissTtlMs = 15 * 60 * 1000;
  const snoozeUntilRef = useRef(0);

  const hideNow = () => {
    snoozeUntilRef.current = Date.now() + 3000;
    setOpen(false);
  };

  useEffect(() => {
    let timer;
    const ctrl = new AbortController();

    const fetchLowStock = async () => {
      try {
        if (Date.now() < snoozeUntilRef.current) {
          timer = setTimeout(fetchLowStock, pollMs);
          return;
        }

        const url = `${apiBase}/api/inventory/low-stock?threshold=${threshold}&_=${Date.now()}`;
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
          signal: ctrl.signal,
        });

        if (!res.ok) return;

        const data = await res.json();
        const now = Date.now();
        const allLow = data.items || [];
        setItems(allLow);

        const hasTrigger = allLow.some((it) => {
          const key = `${it._id}:${it.quantity}`;
          const last = seenRef.current[key];
          return !last || now - last > dismissTtlMs;
        });

        if (hasTrigger) {
          setItems(allLow);
          setOpen(true);
        }
      } catch {
      } finally {
        timer = setTimeout(fetchLowStock, pollMs);
      }
    };

    fetchLowStock();
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [threshold, pollMs, apiBase, bump]);
  useEffect(() => {
    const handler = () => setBump((b) => b + 1);
    window.addEventListener("inventory:changed", handler);
    return () => window.removeEventListener("inventory:changed", handler);
  }, []);
  if (!open || items.length === 0) return null;

  return (
    <div className="lowstock-toast">
      <div className="lowstock-header">
        <strong>Low stock Alert</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={hideNow}>Hide</button>
        </div>
      </div>
      <div className="lowstock-body">
        {items.map((it) => (
          <div key={it._id} className="lowstock-line">
            <span>{it.name}</span>
            <span>
              {it.quantity} {it.unit || "pcs"} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
