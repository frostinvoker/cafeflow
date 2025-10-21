import { useEffect, useMemo, useState } from "react";
import "../styles/Inventory.css";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", price: "", unit: "pcs" });
  const unitOptions = useMemo(() => ["Unit Type","pc", "grams", "kg", "ml", "liters"], []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/inventory", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        if (!cancel) setItems(data);
      } catch (err) {
        if (!cancel) setError("Could not load inventory");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const openModal = () => {
    setForm({ name: "", quantity: "", price: "", unit: "Unit Type" });
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const body = {
      name: form.name.trim(),
      unit: form.unit,
      quantity: Number(form.quantity) || 0,
    };
    if (form.price !== "") body.price = Number(form.price) || 0;

    try {
      const res = await fetch("http://localhost:5000/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add item");
      }
      const created = await res.json();
      setItems((list) => [created, ...list]);
      closeModal();
    } catch (err) {
      setError(err.message || "Failed to add item");
    }
  };

  const totalItems = items.length;

  return (
    <div className="default-container">
      <h2>Inventory</h2>
      <div className="low-supply-alert"><p>Low Supply Alert: Milk (5 left), Sugar (8 left)</p></div>
      <div className="inventory-header">
        <div className="total-items"><p>Total items: {totalItems}</p></div>
        <button className="add-new-item" onClick={openModal}>+ Add New Item</button>
      </div>

      {loading ? (
        <div style={{ padding: "1rem" }}>Loading inventory...</div>
      ) : error ? (
        <div style={{ padding: "1rem", color: "#b91c1c" }}>{error}</div>
      ) : (
        <div className="inventory-list">
          {items.map((it) => (
            <div key={it._id} className="item">
              <h4>{it.name}</h4>
              <p>Stock: {it.quantity} {it.unit}</p>
              {typeof it.price === 'number' ? <p>₱{it.price} / {it.unit}</p> : <p>&nbsp;</p>}
              <div className="buttons">
                <button className="add">Add</button>
                <button className="remove">Remove</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: "1rem" }}>No items yet.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <h2>Add New Item</h2>
            <p>Scan barcode or manually enter details:</p>
            <form onSubmit={handleSubmit}>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Item Name" />
                <input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} required placeholder="Stock Quantity"/>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="Price Per Unit"/>
                <select name="unit" value={form.unit} onChange={handleChange}>
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              <div className="modal-actions">
                <button type="submit" className="primary">Add Item</button>
                <button type="button" className="secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

