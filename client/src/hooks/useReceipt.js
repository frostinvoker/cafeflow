import { useCallback, useRef, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

const moneyPHP = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(n)
    : "—";

const lineTotal = (li) => {
  const addons = (li.addons || []).reduce(
    (s, a) => s + (Number(a.price) || 0),
    0
  );
  return (Number(li.price) + addons) * (Number(li.quantity) || 1);
};

export function useReceipt() {
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const printTargetRef = useRef(null);
  const setPrintTarget = useCallback((el) => {
    printTargetRef.current = el;
  }, []);

  const load = useCallback(async (checkoutId) => {
    if (!checkoutId) {
      setCheckout(null);
      setErr("Missing checkout id");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/checkouts/${checkoutId}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load receipt");
      setCheckout(data);
    } catch (e) {
      setErr(e.message || "Failed to load receipt");
      setCheckout(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const printReceipt = useCallback(() => {
    const node = printTargetRef.current;
    if (!node) {
      // Fallback: print the current page
      try {
        window.print();
      } catch {}
      return;
    }

    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      visibility: "hidden",
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;

    const styles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style")
    )
      .map((el) => el.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`<!doctype html>
      <html>
      <head>
      <meta charset="utf-8">
      ${styles}
      </head>
      <body>${node.outerHTML}</body>
      </html>`);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 200);
      }
    };

    if ((doc.readyState || "").toLowerCase() === "complete") {
      setTimeout(doPrint, 0);
    } else {
      iframe.onload = doPrint;
    }
  }, []);

  return {
    checkout,
    loading,
    err,
    setErr,
    load,
    // helpers
    moneyPHP,
    lineTotal,
    printReceipt,
    setPrintTarget,
  };
}
