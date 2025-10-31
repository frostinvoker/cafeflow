import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Checkout.css";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const initial =
    location.state ||
    JSON.parse(localStorage.getItem("posOrder") || "null") ||
    {};
  const [order, setOrder] = useState(initial.order || []);
  const [itemsPayload, setItemsPayload] = useState(initial.itemsPayload || []);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tendered, setTendered] = useState("");
  const [change, setChange] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const [redeemFreeDrink, setRedeemFreeDrink] = useState(false);

  const openConfirmPayment = () => setShowConfirmPayment(true);
  const closeConfirmPayment = () => setShowConfirmPayment(false);

  const formatPHP = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(n)
      : "—";

  const total = useMemo(() => {
    return (order || []).reduce((sum, li) => {
      const addonsTotal = (li.addons || []).reduce(
        (s, a) => s + (a.price || 0),
        0
      );
      return sum + (li.basePrice + addonsTotal) * (li.quantity || 1);
    }, 0);
  }, [order]);

  useEffect(() => {
    const changeAmount = Math.max(0, Number(tendered) - total);
    setChange(changeAmount);
  }, [tendered, total]);

  const confirmPayment = async () => {
    try {
      const body = {
        items: itemsPayload,
        paymentMethod,
        payment: {
          tendered: Number(tendered) || 0,
          referenceId: paymentMethod === "gcash" ? `GCASH-${Date.now()}` : "",
        },
        status: "completed",
        customer: selectedCustomer?._id || undefined,
        redeemFreeDrink: canRedeem && redeemFreeDrink,
      };

      const res = await fetch("http://localhost:5000/api/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const created = await res.json();
      if (!res.ok)
        throw new Error(created?.message || "Failed to create checkout");

      localStorage.removeItem("posOrder");

      navigate(`/pos/checkout/receipt/${created._id}`);
    } catch (e) {
      alert(e.message || "Payment failed");
    }
  };
  useEffect(() => {
    if (!showCustomerModal) return;

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setCustLoading(true);
        const url = customerQuery.trim()
          ? `http://localhost:5000/api/customers?q=${encodeURIComponent(
              customerQuery
            )}`
          : `http://localhost:5000/api/customers`;

        const res = await fetch(url, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) return;

        const data = await res.json();
        if (customerQuery.trim()) {
          setCustomerResults(data);
        } else {
          setAllCustomers(data);
          setCustomerResults([]);
        }
      } finally {
        setCustLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [showCustomerModal, customerQuery]);

  const pointsEarned = useMemo(() => Math.floor(total * 0.1), [total]);
  const isSingleDrink = useMemo(() => {
    if ((order?.length || 0) !== 1) return false;
    const cat = (order[0]?.category || "").toLowerCase();
    return ["drink", "drinks", "beverage", "beverages"].includes(cat);
  }, [order]);
  const canRedeem =
    !!selectedCustomer &&
    (selectedCustomer.loyaltyPoints ?? 0) >= 100 &&
    isSingleDrink;

  const earnToShow = redeemFreeDrink ? 0 : pointsEarned;

  useEffect(() => {
    localStorage.setItem(
      "posOrder",
      JSON.stringify({
        order,
        itemsPayload,
        total,
        selectedCustomerId: selectedCustomer?._id || null,
      })
    );
  }, [order, itemsPayload, total, selectedCustomer]);
  useEffect(() => {
    if ((itemsPayload || []).length || (order || []).length === 0) return;

    
    const built = (order || []).map((li) => ({
      menuItem: li.menuItemId || li._id, 
      quantity: Number(li.quantity) || 1,
      size: li.size || undefined, // only for drinks
      addons: (li.addons || []).map((a) => a._id || a.addonId).filter(Boolean),
    }));
    setItemsPayload(built);
  }, [order, itemsPayload]);

  return (
    <div className="default-container">
      <h2>Checkout</h2>
      <div className="checkout-container">
        <div className="summary">
          <h2>Order Summary</h2>
          <div className="orders">
            {order.map((li) => {
              const lineTotal =
                (li.basePrice +
                  (li.addons || []).reduce((s, a) => s + (a.price || 0), 0)) *
                (li.quantity || 1);
              return (
                <div key={li.lineId} className="ordered-item">
                  <div className="order-name-qty">
                    <p>
                      {li.name}
                      {li.size ? ` (${li.size})` : ""} x{li.quantity}
                    </p>
                    <p>{formatPHP(lineTotal)}</p>
                  </div>
                  {li.addons && li.addons.length > 0 && (
                    <div className="order-addons">
                      {li.addons.map((a, index) => (
                        <small key={index}>+ {a.name}</small>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {order.length === 0 && (
              <div style={{ padding: ".5rem" }}>No items.</div>
            )}
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
          <div className="select-customer">
            <h2>Select Customer</h2>

            {selectedCustomer ? (
              <div className="selected-customer">
                <div className="selected-customer-line">
                  <strong>{selectedCustomer.name}</strong>
                  <small>
                    current pts:{" "}
                    <strong>{selectedCustomer.loyaltyPoints ?? 0}</strong> pts
                  </small>
                </div>

                <div className="selected-customer-line">
                  {canRedeem && (
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <input
                        type="checkbox"
                        checked={redeemFreeDrink}
                        onChange={(e) => setRedeemFreeDrink(e.target.checked)}
                      />
                      Redeem free drink (100 pts)
                    </label>
                  )}
                  <small>
                    will earn <strong>{earnToShow}</strong> pts
                  </small>
                </div>

                <button
                  className="remove"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setRedeemFreeDrink(false);
                  }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <>
                <small>No customer selected</small>

                <button
                  type="button"
                  className="customer-picker-btn"
                  onClick={() => {
                    setShowCustomerModal(true);
                    setCustomerQuery("");
                    setCustomerResults([]);
                  }}
                  style={{ marginTop: 8 }}
                >
                  Select customer
                </button>
              </>
            )}
          </div>

          <button
            className="long-button"
            onClick={openConfirmPayment}
            disabled={order.length === 0}
          >
            Confirm Payment
          </button>
          <button className="cancel-button" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
      {showConfirmPayment && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirmPayment();
          }}
        >
          <div className="modal">
            <h2>Confirm Payment</h2>
            <p>
              Are you sure you want to <strong>confirm</strong> the payment?
            </p>
            <div className="modal-actions">
              <button className="confirm" onClick={confirmPayment}>
                Confirm
              </button>
              <button className="secondary" onClick={closeConfirmPayment}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showCustomerModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomerModal(false);
          }}
        >
          <div className="modal customer-picker-modal">
            <h2>Select Customer</h2>

            <input
              autoFocus
              type="text"
              placeholder="Search customer name…"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
            />

            <div className="customer-grid">
              {custLoading && (
                <div className="muted" style={{ padding: "8px" }}>
                  Loading…
                </div>
              )}
              {!custLoading &&
                !customerQuery.trim() &&
                allCustomers.length === 0 && (
                  <div className="muted" style={{ padding: "8px" }}>
                    No customers yet
                  </div>
                )}
              {!custLoading &&
                customerQuery.trim() &&
                customerResults.length === 0 && (
                  <div className="muted" style={{ padding: "8px" }}>
                    No matches
                  </div>
                )}

              {(customerQuery.trim() ? customerResults : allCustomers).map(
                (c) => (
                  <div
                    key={c._id}
                    role="button"
                    className="customer-card"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setRedeemFreeDrink(false);
                      setShowCustomerModal(false);
                    }}
                  >
                    <div className="customer-card-title">
                      <h3>{c.name}</h3>
                    </div>
                    <div className="customer-card-sub">
                      <p>
                        {c.email || <span className="muted">No email</span>}
                      </p>
                      <p>Points: {c.loyaltyPoints ?? 0} pts</p>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="modal-actions">
              <button
                className="remove"
                onClick={() => {
                  setSelectedCustomer(null);
                  setRedeemFreeDrink(false);
                  setShowCustomerModal(false);
                }}
              >
                Select none
              </button>
              <button
                className="secondary"
                onClick={() => setShowCustomerModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
