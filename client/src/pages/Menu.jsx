import { useEffect, useMemo, useState } from "react";
import "../styles/Menu.css";

export default function Menu() {
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const categoryOptions = useMemo(() => ["Drinks", "Snacks", "Meals"], []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/menu-items", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        if (!cancel) setItems(data);
      } catch (err) {
        if (!cancel) setError("Could not load menu");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);


  const openAddMenu = () => {
    setForm({ name: "", category: "", price: "" });
    setShowAddMenu(true);
  };
  const closeAddMenu = () => setShowAddMenu(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const formatPHP = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n)
      : "—";
      
  const handleNewItem = async (e) => {
    e.preventDefault();
    setError("");
    const body = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price) || 0,
    };
    if (form.price !== "") body.price = Number(form.price) || 0;

    try {
      const res = await fetch("http://localhost:5000/api/menu-items", {
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
      closeAddMenu();
    } catch (err) {
      setError(err.message || "Failed to add item");
    }
  };

  return (
        <div className="default-container">
          <h2>Cafe Menu Management</h2>
          <div className="header-buttons">
            <button onClick={openAddMenu}>Add New Item</button>
          </div>
        {loading ? (
          <div style={{ padding: "1rem" }}>Loading menu...</div>
        ) : error ? (
          <div style={{ padding: "1rem", color: "#b91c1c" }}>{error}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: "1rem" }}>No menu items yet.</div>
        ) : (
          <table className="menu" cellSpacing={0} cellPadding={0}>
            <thead>
              <tr className="table-header">
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => (
                <tr key={it._id} className="table-body">
                  <td>{it.name}</td>
                  <td>{cap(it.category)}</td>
                  <td>{formatPHP(it.price)}</td>
                  <td className={it.available}>{it.available ? "Available" : "Out of stock"}</td>
                  <td className="buttons">
                    <button className="edit" onClick={() => onEdit?.(it)}>Edit</button>
                    <button className="remove" onClick={() => onRemove?.(it._id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
          {showAddMenu &&(
            <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAddMenu(); }}>
              <div className="modal addMenuItem-modal">
                <h2>Add New Menu Item</h2>
                <form onSubmit={handleNewItem}>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Item Name" />
                  <select name="category" value={form.category} onChange={handleChange} required>
                    {categoryOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="Price (₱)"/>
                  <div className="modal-actions">
                    <button type="submit" className="primary">Add Item</button>
                    <button type="button" className="secondary" onClick={closeAddMenu}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
    );
}