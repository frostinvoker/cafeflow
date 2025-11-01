import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../../styles/Checkout.css";
import { useCheckout } from "../../hooks/useCheckout";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const initial =
    location.state ||
    JSON.parse(localStorage.getItem("posOrder") || "null") ||
    {};

  const {
    // order / totals
    order, total, change,

    // payment
    paymentMethod, setPaymentMethod,
    tendered, setTendered,

    // customers
    selectedCustomer, selectCustomer, clearSelectedCustomer,
    showCustomerModal, openCustomerModal, closeCustomerModal,
    customerQuery, setCustomerQuery,
    customerList, custLoading,

    // confirm modal
    showConfirmPayment, openConfirmPayment, closeConfirmPayment,

    // loyalty
    canRedeem, redeemFreeDrink, setRedeemFreeDrink,
    pointsEarned, earnToShow,

    // actions
    confirmPayment,

    // utils
    moneyPHP,
  } = useCheckout(initial);

  // optional: focus behavior or cleanup
  useEffect(() => {}, []);

  async function handleConfirm() {
    try {
      const id = await confirmPayment();
      if (id) navigate(`/pos/checkout/receipt/${id}`);
    } catch (e) {
      alert(e.message);
    }
  }

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
                    <p>{moneyPHP(lineTotal)}</p>
                  </div>
                  {li.addons?.length > 0 && (
                    <div className="order-addons">
                      {li.addons.map((a, index) => (
                        <small key={index}>+ {a.name}</small>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {order.length === 0 && <div style={{ padding: ".5rem" }}>No items.</div>}
          </div>
          <div className="total">
            <h2>Total</h2>
            <h2>{moneyPHP(total)}</h2>
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
                <h3>{moneyPHP(change)}</h3>
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
                    current pts: <strong>{selectedCustomer.loyaltyPoints ?? 0}</strong> pts
                  </small>
                </div>

                <div className="selected-customer-line">
                  {canRedeem && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={redeemFreeDrink}
                        onChange={(e) => setRedeemFreeDrink(e.target.checked)}
                      />
                      Redeem free drink (100 pts)
                    </label>
                  )}
                  <small>will earn <strong>{earnToShow}</strong> pts</small>
                </div>

                <button className="remove" onClick={clearSelectedCustomer}>
                  Clear
                </button>
              </div>
            ) : (
              <>
                <small>No customer selected</small>
                <button
                  type="button"
                  className="customer-picker-btn"
                  onClick={openCustomerModal}
                  style={{ marginTop: 8 }}
                >
                  Select customer
                </button>
              </>
            )}
          </div>

          <button className="long-button" onClick={openConfirmPayment} disabled={order.length === 0}>
            Confirm Payment
          </button>
          <button className="cancel-button" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>

      {/* Confirm Payment Modal */}
      {showConfirmPayment && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeConfirmPayment()}>
          <div className="modal">
            <h2>Confirm Payment</h2>
            <p>Are you sure you want to <strong>confirm</strong> the payment?</p>
            <div className="modal-actions">
              <button className="confirm" onClick={handleConfirm}>Confirm</button>
              <button className="secondary" onClick={closeConfirmPayment}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Picker Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeCustomerModal()}>
          <div className="modal customer-picker-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Select Customer</h2>

            <input
              autoFocus
              type="text"
              placeholder="Search customer name…"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
            />

            <div className="customer-grid">
              {custLoading && <div className="muted" style={{ padding: 8 }}>Loading…</div>}
              {!custLoading && !customerQuery.trim() && customerList.length === 0 && (
                <div className="muted" style={{ padding: 8 }}>No customers yet</div>
              )}
              {!custLoading && customerQuery.trim() && customerList.length === 0 && (
                <div className="muted" style={{ padding: 8 }}>No matches</div>
              )}

              {customerList.map((c) => (
                <div
                  key={c._id}
                  role="button"
                  className="customer-card"
                  onClick={() => selectCustomer(c)}
                >
                  <div className="customer-card-title"><h3>{c.name}</h3></div>
                  <div className="customer-card-sub">
                    <p>{c.email || <span className="muted">No email</span>}</p>
                    <p>Points: {c.loyaltyPoints ?? 0} pts</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="remove" onClick={clearSelectedCustomer}>Select none</button>
              <button className="secondary" onClick={closeCustomerModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
