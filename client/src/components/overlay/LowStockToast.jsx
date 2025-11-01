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
        <svg width="23" height="25" viewBox="0 0 23 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.48779 8.98506C2.48779 6.60207 3.43442 4.31669 5.11945 2.63166C6.80447 0.946637 9.08986 0 11.4728 0C13.8558 0 16.1412 0.946637 17.8262 2.63166C19.5113 4.31669 20.4579 6.60207 20.4579 8.98506V13.8164L22.7966 18.4938C22.9042 18.7091 22.9551 18.9483 22.9443 19.1888C22.9334 19.4292 22.8613 19.6629 22.7348 19.8677C22.6082 20.0724 22.4314 20.2414 22.2212 20.3586C22.0109 20.4758 21.7742 20.5373 21.5335 20.5373H16.4454C16.1599 21.6389 15.5167 22.6145 14.6167 23.311C13.7167 24.0075 12.6109 24.3854 11.4728 24.3854C10.3348 24.3854 9.22902 24.0075 8.32902 23.311C7.42902 22.6145 6.78577 21.6389 6.50025 20.5373H1.41215C1.17145 20.5373 0.934734 20.4758 0.72449 20.3586C0.514247 20.2414 0.337454 20.0724 0.210902 19.8677C0.0843505 19.6629 0.0122424 19.4292 0.00142643 19.1888C-0.00938956 18.9483 0.0414458 18.7091 0.149104 18.4938L2.48779 13.8164V8.98506ZM9.24968 20.5373C9.475 20.9275 9.79907 21.2515 10.1893 21.4768C10.5796 21.7021 11.0222 21.8207 11.4728 21.8207C11.9234 21.8207 12.3661 21.7021 12.7564 21.4768C13.1466 21.2515 13.4707 20.9275 13.696 20.5373H9.24968ZM11.4728 2.56716C9.77071 2.56716 8.13829 3.24333 6.9347 4.44692C5.73111 5.65051 5.05494 7.28292 5.05494 8.98506V13.8164C5.05492 14.2148 4.96219 14.6077 4.78411 14.964L3.28232 17.9701H19.6646L18.1629 14.964C17.9843 14.6078 17.8912 14.2149 17.8907 13.8164V8.98506C17.8907 7.28292 17.2146 5.65051 16.011 4.44692C14.8074 3.24333 13.175 2.56716 11.4728 2.56716Z" fill="white"/>
          </svg>

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
