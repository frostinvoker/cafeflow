import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Checkout.css";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Pull from router state or localStorage (refresh-safe)
  const initial = location.state || JSON.parse(localStorage.getItem("posOrder") || "null") || {};
  const [order, setOrder] = useState(initial.order || []);
  const [itemsPayload, setItemsPayload] = useState(initial.itemsPayload || []);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tendered, setTendered] = useState("");
  const [change, setChange] = useState(0);

  const formatPHP = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n)
      : "—";

  const total = useMemo(() => {
    return (order || []).reduce((sum, li) => {
      const addonsTotal = (li.addons || []).reduce((s, a) => s + (a.price || 0), 0);
      return sum + (li.basePrice + addonsTotal) * (li.quantity || 1);
    }, 0);
  }, [order]);

  useEffect(() => {
    const changeAmount = Math.max(0, Number(tendered) - total);
    setChange(changeAmount);
  }, [tendered, total]);

  // Persist in case user reloads the page
  useEffect(() => {
    localStorage.setItem("posOrder", JSON.stringify({ order, itemsPayload, total }));
  }, [order, itemsPayload, total]);

    const confirmPayment = async () => {
    try {
        const body = {
        items: itemsPayload,
        paymentMethod,
        payment: {
            tendered: Number(tendered) || 0,
            referenceId: paymentMethod === "gcash" ? `GCASH-${Date.now()}` : ""
        },
        status: "completed"
        };

        const res = await fetch("http://localhost:5000/api/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created?.message || "Failed to create checkout");

        // clear temp data
        localStorage.removeItem("posOrder");

        // Navigate to the receipt page with the checkoutId
        navigate(`/pos/checkout/receipt/${created._id}`);
    } catch (e) {
        alert(e.message || "Payment failed");
    }
    };


  return (
    <div className="default-container-checkout">
      <h2>Checkout</h2>
      <div className="checkout-container">
        <div className="summary">
          <h2>Order Summary</h2>
          <div className="orders">
            {order.map((li) => {
              const addonsText =
                li.addons && li.addons.length > 0
                  ? " + " + li.addons.map((a) => a.name).join(", ")
                  : "";
              const lineTotal =
                (li.basePrice +
                  (li.addons || []).reduce((s, a) => s + (a.price || 0), 0)) *
                (li.quantity || 1);
              return (
                <div key={li.lineId} className="ordered-item">
                    <div className="order-name-qty">
                        <p>
                            {li.name} x{li.quantity}
                        </p>
                        <p>{formatPHP(lineTotal)}</p>
                    </div>
                    <div className="order-addons">
                        <small>{addonsText}</small>
                    </div>
                </div>
              );
            })}
            {order.length === 0 && <div style={{ padding: ".5rem" }}>No items.</div>}
          </div>
          <div className="total">
            <h2>Total</h2>
            <h2>{formatPHP(total)}</h2>
          </div>
        </div>

            <div className="payment">
            <h2>Payment Method</h2>
            <div className="payment-options">
                <label className="cash">
                <input
                    type="radio"
                    name="pm"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                />
                <span>Cash</span>
                </label>
                <label className="GCash">
                <input
                    type="radio"
                    name="pm"
                    value="gcash"
                    checked={paymentMethod === "gcash"}
                    onChange={() => setPaymentMethod("gcash")}
                />
                <span>GCash</span>
                </label>
            </div>

            {paymentMethod === "cash" && (
                <div className="cash-option-container">
                    <div className="cash-received">
                        <label>Cash Received: </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tendered}
                            onChange={(e) => setTendered(e.target.value)}
                        />
                    </div>
                    <div className="change">
                        <p>Change: </p>
                        <h3>{formatPHP(change)}</h3>
                    </div>
                </div>
            )}
            <button className="long-button" onClick={confirmPayment} disabled={order.length === 0}>Confirm Payment</button>
            <button className="cancel-button" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </div>
  );
}
