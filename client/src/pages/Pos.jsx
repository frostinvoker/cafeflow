import { useNavigate } from "react-router-dom";
import "../styles/pos.css";
import { usePos } from "../hooks/usePos";

export default function Pos() {
  const {
    // data/meta
    items,
    addons,
    loading,
    err,

    // order
    order,
    total,
    removeFromOrder,

    // config modal
    showConfig,
    configItem,
    configQty,
    setConfigQty,
    configAddonIds,
    configSize,
    setConfigSize,
    openConfig,
    closeConfig,
    selectableAddons,
    toggleAddon,
    addConfiguredLine,

    // utils
    moneyPHP,

    // checkout
    buildCheckoutState,

    // tabs
    activeTab,
    setActiveTab,
    categoryOptions,
    filteredItems,
  } = usePos();

  const navigate = useNavigate();

  // purely visual mapping stays in component (UI concern)
  const shapeClass = (cat) => {
    switch (cat) {
      case "Drinks":
        return "shape square drinks";
      case "Snacks":
        return "shape triangle snacks";
      case "Meals":
        return "shape circle meals";
      default:
        return "shape square";
    }
  };

  const goToCheckout = () => {
    const state = buildCheckoutState();
    localStorage.setItem("posOrder", JSON.stringify(state));
    navigate("/pos/checkout", { state });
  };

  return (
    <div className="pos-container">
      <div className="products-container">
        <h2>Product Selection</h2>
        <div className="menu-category">
          {categoryOptions.map((tab) => (
            <button
              key={tab}
              className={`category-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: "1rem" }}>Loading menu…</div>
        ) : err ? (
          <div style={{ padding: "1rem", color: "#b91c1c" }}>{err}</div>
        ) : (
          <div className="product-list">
            {filteredItems.map((it) => {
              const isAvailable = Boolean(
                it.effectiveAvailable ??
                  ((it.available ?? true) && (it.availableComputed ?? true))
              );
              const disabled = !isAvailable;

              return (
                <div
                  key={it._id}
                  className={`product ${
                    disabled ? "is-unavailable" : "is-available"
                  }`}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-disabled={disabled}
                  onClick={() => openConfig(it)}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " "))
                      openConfig(it);
                  }}
                >
                  <div className={shapeClass(it.category)} />
                  <p className="name">{it.name}</p>
                  <h4 className="price">
                    {(it.category || "").toLowerCase() === "drinks"
                      ? `${moneyPHP(
                          Number(it.sizePrices?.oz12 ?? 0)
                        )} / ${moneyPHP(Number(it.sizePrices?.oz16 ?? 0))}`
                      : moneyPHP(Number(it.price) || 0)}
                  </h4>
                  <small className={`availability ${disabled ? "na" : "ok"}`}>
                    {disabled ? "Not Available" : "Available"}
                  </small>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div style={{ padding: "1rem" }}>No items yet.</div>
            )}
          </div>
        )}
      </div>

      <div className="checkout">
        <h2>Current Order</h2>
        <div className="order-lines">
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
                <div
                  onClick={() => removeFromOrder(li.lineId)}
                  className="remove-order"
                >
                  <svg
                    width="15"
                    height="19"
                    viewBox="0 0 15 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.5833 1.04167H10.9375L9.89583 0H4.6875L3.64583 1.04167H0V3.125H14.5833M1.04167 16.6667C1.04167 17.2192 1.26116 17.7491 1.65186 18.1398C2.04256 18.5305 2.57247 18.75 3.125 18.75H11.4583C12.0109 18.75 12.5408 18.5305 12.9315 18.1398C13.3222 17.7491 13.5417 17.2191 13.5417 16.6667V4.16667H1.04167V16.6667Z"
                      fill="#FF4D4D"
                    />
                  </svg>
                </div>
                {li.addons?.length > 0 && (
                  <div className="order-addons">
                    {li.addons.map((a, idx) => (
                      <small key={idx}>+ {a.name}</small>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="total">
          <h4>Total</h4>
          <h4>{moneyPHP(total)}</h4>
        </div>

        <button
          className="checkout-btn"
          onClick={goToCheckout}
          disabled={order.length === 0}
        >
          Checkout
        </button>
      </div>

      {/* Order Modal */}
      {showConfig && configItem && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeConfig()}
        >
          <div className="modal-order" onClick={(e) => e.stopPropagation()}>
            <h2>{configItem.name}</h2>

            {(configItem.category || "").toLowerCase() === "drinks" && (
              <div className="modal-order-size">
                <label>Size</label>
                <div className="size-choices">
                  <label>
                    <input
                      type="radio"
                      name="size"
                      value="12oz"
                      checked={configSize === "12oz"}
                      onChange={() => setConfigSize("12oz")}
                    />
                    12oz
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="size"
                      value="16oz"
                      checked={configSize === "16oz"}
                      onChange={() => setConfigSize("16oz")}
                    />
                    16oz
                  </label>
                </div>
              </div>
            )}

            <div className="modal-order-qty">
              <p>Quantity</p>
              <input
                type="number"
                min="1"
                step="1"
                value={configQty}
                onChange={(e) => setConfigQty(e.target.value)}
              />
            </div>

            <div className="modal-order-addons">
              <label>Add-ons</label>
              <div className="addons-container">
                {selectableAddons.map((a) => {
                  const id = String(a._id);
                  return (
                    <label key={id} className="addon">
                      <input
                        type="checkbox"
                        checked={configAddonIds.includes(id)}
                        onChange={() => toggleAddon(id)}
                      />
                      {a.name} ({moneyPHP(Number(a.price) || 0)})
                    </label>
                  );
                })}
                {selectableAddons.length === 0 && (
                  <small>No add-ons available.</small>
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button className="add-order" onClick={addConfiguredLine}>
                Add to Order
              </button>
              <button className="cancel-order" onClick={closeConfig}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
