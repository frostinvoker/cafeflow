import { useEffect, useMemo, useState } from "react";
import "../styles/Menu.css";

export default function Menu() {
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    category: "",
    price: "",
    available: true,
  });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categoryOptions = useMemo(() => ["Drinks", "Snacks", "Meals"], []);
  
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
  const openEditMenu = (item) => {
    setEditForm({
      _id: item._id,
      name: item.name,
      category: item.category,
      price: String(item.price ?? ""),
      available: !!item.available,
    });
    setShowEdit(true);
  };
  const closeEditMenu = () => setShowEdit(false);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // Loads items
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

  // Adds New Items
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

// Edits the Item
const handleUpdateItem = async (e) => {
  e.preventDefault();
  setError("");
  const priceNum = Number(editForm.price);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    setError("Enter a valid price");
    return;
  }
  const body = {
    name: editForm.name.trim(),
    category: editForm.category,
    price: priceNum,
    available: !!editForm.available,
  };

  try {
    const res = await fetch(`http://localhost:5000/api/menu-items/${editForm._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Failed to update item");

    setItems((list) => list.map((it) => (it._id === data._id ? data : it)));
    closeEditMenu();
  } catch (err) {
    setError(err.message || "Failed to update item");
  }
};
// Deletes the Item
const openDeleteConfirm = (item) => {
  setDeleteTarget(item);
  setShowDelete(true);
};
const closeDeleteConfirm = () => setShowDelete(false);

const handleConfirmDelete = async () => {
  if (!deleteTarget) return;
  try {
    const res = await fetch(`http://localhost:5000/api/menu-items/${deleteTarget._id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Failed to delete item");

    setItems((list) => list.filter((it) => it._id !== deleteTarget._id));
    closeDeleteConfirm();
  } catch (err) {
    setError(err.message || "Failed to delete item");
  }
};
  return (
        <div className="default-container">
          <h2>Cafe Menu Management</h2>
          <div className="header-buttons">
            <button onClick={openAddMenu}>Add New Item</button>
          </div>
          <div className="table-scroll">
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
                    <td className={`availability ${it.available ? "available" : "unavailable"}`}>
                      <span className="badge">
                        {it.available ? "Available" : "Not Available"}
                      </span>
                    </td>
                    <td className="buttons">
                      <button className="edit" onClick={() => openEditMenu(it)}>Edit</button>
                      <button className="remove" onClick={() => openDeleteConfirm(it)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>

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
          {showEdit && (
            <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeEditMenu(); }}>
              <div className="modal">
                <h2>Edit Menu Item</h2>
                <form onSubmit={handleUpdateItem}>
                  <input name="name" value={editForm.name} onChange={handleEditChange} required placeholder="Item Name"/>
                  <select name="category" value={editForm.category} onChange={handleEditChange} required>
                    <option value="" disabled>Select Category</option>
                    {categoryOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <input name="price" type="number" min="0" step="0.01" value={editForm.price} onChange={handleEditChange} placeholder="Price (₱)" required/>
                  <label className="checkbox-availability">
                  <input type="checkbox" name="available" checked={!!editForm.available} onChange={handleEditChange}/> Available</label>
                  <div className="modal-actions">
                    <button type="submit" className="primary">Save Changes</button>
                    <button type="button" className="secondary" onClick={closeEditMenu}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showDelete && (
            <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeDeleteConfirm(); }}>
              <div className="modal">
                <h2>Confirm Removal</h2>
                <p>
                  Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from the menu?
                </p>
                <div className="modal-actions">
                  <button className="remove" onClick={handleConfirmDelete}>Yes, Remove</button>
                  <button className="secondary" onClick={closeDeleteConfirm}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
    );
}