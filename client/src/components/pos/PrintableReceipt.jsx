// pages/pos/PrintableReceipt.jsx
import React, { forwardRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../styles/PrintableReceipt.css";
import { useReceipt } from "../../hooks/useReceipt";

const PrintableReceipt = forwardRef(({ checkout: passedCheckout, moneyPHP: m, lineTotal: lt }, ref) => {
  const { checkoutId } = useParams();
  const { checkout, loading, err, setErr, load, moneyPHP, lineTotal } = useReceipt();

  // if embedded with data, don't fetch; if routed (no prop), fetch by id
  useEffect(() => {
    if (!passedCheckout) {
      setErr("");
      load(checkoutId);
    }
  }, [checkoutId, load, setErr, passedCheckout]);

  const data = passedCheckout || checkout;
  const fmt  = m || moneyPHP;
  const ltot = lt || lineTotal;

  if (!passedCheckout && loading) return <div className="print-receipt loading">Loading…</div>;
  if (!passedCheckout && err)     return <div className="print-receipt error">{err}</div>;
  if (!data) return null;

  const issuedAt = data?.createdAt ? new Date(data.createdAt) : null;
  const niceDate = issuedAt ? issuedAt.toLocaleString() : "";
  const shortId  = data?._id ? String(data._id).slice(-6).toUpperCase() : "";

  return (
    <div ref={ref} className="print-receipt">
      <div className="rcpt-header">
        <div className="rcpt-store">blue52</div>
        <div className="rcpt-sub">your neighborhood cafe</div>
        <div className="rcpt-meta">
          <div>Receipt: {shortId || checkoutId}</div>
          {niceDate && <div>Date: {niceDate}</div>}
          <div>Payment: {data.paymentMethod}</div>
          {data?.customerSnapshot?.name && <div>Customer: {data.customerSnapshot.name}</div>}
        </div>
        <div className="rcpt-sep" />
      </div>

      <div className="rcpt-items">
        {data.items.map((li) => (
          <div key={`${li.menuItem}-${li.size || ""}`} className="rcpt-line">
            <div className="line-top">
              <span className="name">
                {li.name}{li.size ? ` (${li.size})` : ""} ×{li.quantity}
              </span>
              <span className="amount">{fmt(ltot(li))}</span>
            </div>
            {Array.isArray(li.addons) && li.addons.length > 0 && (
              <div className="addons">
                {li.addons.map((a, i) => <span key={i}>+ {a.name}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rcpt-sep" />

      <div className="rcpt-totals">
        <div className="row"><span>Total</span><span>{fmt(data.total)}</span></div>
        <div className="row"><span>Received</span><span>{fmt(data?.payment?.tendered ?? 0)}</span></div>
        <div className="row"><span>Change</span><span>{fmt(data?.payment?.change ?? 0)}</span></div>
      </div>

      {(data?.pointsEarned ?? 0) > 0 && (
        <>
          <div className="rcpt-sep" />
          <div className="rcpt-totals">
            <div className="row"><span>Points Earned</span><span>{data.pointsEarned}</span></div>
          </div>
        </>
      )}

      <div className="rcpt-footer">
        <div>Thank you!</div>
      </div>
    </div>
  );
});

export default PrintableReceipt;
