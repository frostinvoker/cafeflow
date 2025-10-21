import { useEffect, useState } from "react";
import { NavLink} from "react-router-dom";
import "../styles/pos.css";

export default function Pos() {
    const [items, setItems] = useState([]);
    const [order, setOrder] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    //loads menu items
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

    const addToOrder = (it) => {
        if (!it.available) return;
        setOrder((prev) => [...prev, it]);
    };

    const total = order.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    const formatPHP = (n) =>
        typeof n === "number"
        ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n)
        : "—";
    
    const shapeClass = (cat) => {
        switch (cat) {
        case "Drinks": return "shape square drinks";
        case "Snacks": return "shape triangle snacks";
        case "Meals":  return "shape circle meals";
        default:       return "shape square";
        }
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
                        const disabled = !it.available;
                        return (
                            <div key={it._id}
                            className={`product ${disabled ? "is-unavailable" : "is-available"}`}
                            role="button"
                            tabIndex={disabled ? -1 : 0}
                            aria-disabled={disabled}
                            onClick={() => addToOrder(it)}
                            onKeyDown={(e) => {
                                if (!disabled && (e.key === "Enter" || e.key === " ")) addToOrder(it);
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
                <div className="total">
                    <h4>Total</h4>
                    <h4>₱0</h4>
                </div>
                <NavLink to="/pos/checkout" className="checkout-btn">Checkout</NavLink>
            </div>
        </div>
    );
}