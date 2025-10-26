import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pos.css";

export default function Pos() {
  const [items, setItems] = useState([]);
  const [addons, setAddons] = useState([]);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Config modal state
  const [showConfig, setShowConfig] = useState(false);
  const [configItem, setConfigItem] = useState(null);
  const [configQty, setConfigQty] = useState(1);
  const [configAddonIds, setConfigAddonIds] = useState([]);

  const navigate = useNavigate();

  const formatPHP = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(n)
      : "—";

  // UI only
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

  // Load menu items
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/menu-items", {
          credentials: "include",
          signal: abort.signal,
        });
        if (!res.ok) throw new Error("Failed to load menu");
        const data = await res.json();
        setItems(data);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Could not load menu items");
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  // Load all active add-ons once (filter per item later)
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/addons?active=true",
          {
            credentials: "include",
            signal: abort.signal,
          }
        );
        if (!res.ok) throw new Error("Failed to load add-ons");
        const data = await res.json();
        setAddons(data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => abort.abort();
  }, []);

  // Open config modal for a product
  const openConfig = (it) => {
    if (!it.available) return;
    setConfigItem(it);
    setConfigQty(1);
    setConfigAddonIds([]); // start with nothing selected
    setShowConfig(true);
  };
  const closeConfig = () => setShowConfig(false);

  // Add-ons available for the current item (by category + allowedAddOns)
  const selectableAddons = useMemo(() => {
    if (!configItem) return [];
    let list = addons.filter((a) => a.active !== false);

    // Match add-on category to the menu item's category
    if (configItem.category) {
      list = list.filter((a) => a.category === configItem.category);
    }

    // Enforce allowedAddOns if the menu item restricts
    const allowed = (configItem.allowedAddOns || []).map(String);
    if (allowed.length > 0) {
      list = list.filter((a) => allowed.includes(String(a._id)));
    }
    return list;
  }, [addons, configItem]);

  // Toggle an add-on in the current config
  const toggleAddon = (id) => {
    setConfigAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Add configured line to order
  const addConfiguredLine = () => {
    if (!configItem) return;

    const chosen = selectableAddons.filter((a) =>
      configAddonIds.includes(String(a._id))
    );
    const line = {
      lineId:
        window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now() + Math.random()),
      menuItemId: configItem._id,
      name: configItem.name,
      category: configItem.category,
      basePrice: Number(configItem.price) || 0,
      quantity: Number(configQty) || 1,
      addons: chosen.map((a) => ({
        _id: a._id,
        name: a.name,
        price: Number(a.price) || 0,
      })),
    };

    setOrder((prev) => [...prev, line]);
    setShowConfig(false);
  };

  // Remove a line from order
  const removeFromOrder = (lineId) => {
    setOrder((prev) => prev.filter((line) => line.lineId !== lineId));
  };

  // Order total
  const total = useMemo(() => {
    return order.reduce((sum, li) => {
      const addonsTotal = (li.addons || []).reduce(
        (s, a) => s + (a.price || 0),
        0
      );
      return sum + (li.basePrice + addonsTotal) * (li.quantity || 1);
    }, 0);
  }, [order]);

  // Go to checkout with preserved data
  const goToCheckout = () => {
    const itemsPayload = order.map((li) => ({
      menuItem: li.menuItemId,
      quantity: li.quantity,
      addons: (li.addons || []).map((a) => a._id),
    }));
    const state = { order, itemsPayload, total };
    localStorage.setItem("posOrder", JSON.stringify(state));
    navigate("/pos/checkout", { state });
  };

  return (
    <div className="pos-container">
      <div className="products-container">
        <h2>Product Selection</h2>
        {loading ? (
          <div style={{ padding: "1rem" }}>Loading menu…</div>
        ) : err ? (
          <div style={{ padding: "1rem", color: "#b91c1c" }}>{err}</div>
        ) : (
          <div className="product-list">
            {items.map((it) => {
              const isAvailable = Boolean(it.availableComputed ?? it.available); // ← use computed if present
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
                  <h4 className="price">{formatPHP(Number(it.price) || 0)}</h4>
                  <small className={`availability ${disabled ? "na" : "ok"}`}>
                    {disabled ? "Not Available" : "Available"}
                  </small>
                </div>
              );
            })}
            {items.length === 0 && (
              <div style={{ padding: "1rem" }}>No items yet.</div>
            )}
          </div>
        )}
      </div>

      <div className="checkout">
        <h2>Current Order</h2>
        <div className="order-lines">
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
                      d="M14.5833 1.04167H10.9375L9.89583 0H4.6875L3.64583 1.04167H0V3.125H14.5833M1.04167 16.6667C1.04167 17.2192 1.26116 17.7491 1.65186 18.1398C2.04256 18.5305 2.57247 18.75 3.125 18.75H11.4583C12.0109 18.75 12.5408 18.5305 12.9315 18.1398C13.3222 17.7491 13.5417 17.2192 13.5417 16.6667V4.16667H1.04167V16.6667Z"
                      fill="#FF4D4D"
                    />
                  </svg>
                </div>
                <div className="order-addons">
                  <small>{addonsText}</small>
                </div>
              </div>
            );
          })}
        </div>

        <div className="total">
          <h4>Total</h4>
          <h4>{formatPHP(total)}</h4>
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
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfig();
          }}
        >
          <div className="modal-order">
            <h2>{configItem.name}</h2>

            <div className="modal-order-qty">
              <label>Quantity</label>
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
                      {a.name} ({formatPHP(Number(a.price) || 0)})
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
