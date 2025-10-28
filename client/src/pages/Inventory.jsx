import { useEffect, useMemo, useState } from "react";
import "../styles/Inventory.css";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    price: "",
    unit: "",
    lowStockThreshold: "",
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    quantity: "",
    price: "",
    unit: "pc",
    lowStockThreshold: "",
  });

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const unitOptions = useMemo(() => ["pc", "grams", "kg", "ml", "liters"], []);
  const defaultThreshold = 3;

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/inventory", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        if (!cancel) setItems(data);
      } catch (err) {
        if (!cancel) setError("Could not load inventory");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const openModal = () => {
    setForm({ name: "", quantity: "", price: "", unit: "", lowStockThreshold: "" });
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
    if (form.lowStockThreshold !== "") body.lowStockThreshold = Math.max(0, Number(form.lowStockThreshold) || 0);

    try {
      const res = await fetch("http://localhost:5000/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const created = await res.json().catch(() => null);
      if (!res.ok) throw new Error(created?.message || "Failed to add item");
      setItems((list) => [created, ...list]);
      closeModal();
    } catch (err) {
      setError(err.message || "Failed to add item");
    }
  };

  const openEdit = (it) => {
    setEditForm({
      _id: it._id,
      name: it.name ?? "",
      quantity: String(it.quantity ?? ""),
      price: it.price !== undefined && it.price !== null ? String(it.price) : "",
      unit: it.unit ?? "pc",
      lowStockThreshold: it.lowStockThreshold !== undefined && it.lowStockThreshold !== null ? String(it.lowStockThreshold) : "",
    });
    setShowEdit(true);
  };
  const closeEdit = () => setShowEdit(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    const body = {
      name: editForm.name.trim(),
      unit: editForm.unit,
      quantity: Number(editForm.quantity) || 0,
    };
    if (editForm.price !== "") body.price = Number(editForm.price) || 0;
    if (editForm.lowStockThreshold !== "") body.lowStockThreshold = Math.max(0, Number(editForm.lowStockThreshold) || 0);

    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${editForm._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const updated = await res.json().catch(() => null);
      if (!res.ok) throw new Error(updated?.message || "Failed to update item");

      setItems((list) =>
        list.map((x) => (x._id === updated._id ? updated : x))
      );
      closeEdit();
    } catch (err) {
      setError(err.message || "Failed to update item");
    }
  };

  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);
    setShowDelete(true);
  };
  const closeDeleteConfirm = () => setShowDelete(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${deleteTarget._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete item");
      setItems((list) => list.filter((it) => it._id !== deleteTarget._id));
      closeDeleteConfirm();
    } catch (err) {
      setError(err.message || "Failed to delete item");
    }
  };

  const totalItems = items.length;
  const lowItems = items.filter((it) => {
    const t = Number(it.lowStockThreshold) > 0 ? Number(it.lowStockThreshold) : defaultThreshold;
    return Number(it.quantity) <= t;
  });
  const hasLow = !loading && !error && lowItems.length > 0;

  return (
    <div className="default-container">
      <h2>Inventory</h2>

      <div className={`low-supply-alert ${hasLow ? "show" : ""}`}>
        <p>
          Low Supply:{" "}
          {lowItems
            .map((it) => {
              const t = Number(it.lowStockThreshold) > 0 ? Number(it.lowStockThreshold) : defaultThreshold;
              return `${it.name} (${Number(it.quantity)} ${it.unit})`;
            })
            .join(", ")}
        </p>
      </div>

      <div className="inventory-header">
        <div className="total-items">
          <p>Total items: {totalItems}</p>
        </div>
        <button className="add-new-item" onClick={openModal}>
          + Add New Item
        </button>
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
              <p>
                Stock: {it.quantity} {it.unit}
              </p>
              {typeof it.price === "number" ? (
                <p>
                  ₱{it.price} / {it.unit}
                </p>
              ) : (
                <p>&nbsp;</p>
              )}
              <div className="buttons">
                <button className="add" onClick={() => openEdit(it)}>
                  Edit
                </button>
                <button
                  className="remove"
                  onClick={() => openDeleteConfirm(it)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: "1rem" }}>No items yet.</div>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal">
            <h2>Add New Item</h2>
            <p>Scan barcode or manually enter details:</p>
            <form onSubmit={handleSubmit}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Item Name"
              />
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={handleChange}
                required
                placeholder="Stock Quantity"
              />
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="Price Per Unit"
              />
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Unit Type
                </option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={handleChange}
                placeholder="Insert Quantity for Low Supply Alert"
              />
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Add Item
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="modal">
            <h2>Edit Item</h2>
            <form onSubmit={handleUpdate}>
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
                placeholder="Item Name"
              />
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={editForm.quantity}
                onChange={handleEditChange}
                required
                placeholder="Stock Quantity"
              />
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={handleEditChange}
                placeholder="Price Per Unit"
              />
              <select
                name="unit"
                value={editForm.unit}
                onChange={handleEditChange}
                required
              >
                <option value="" disabled>
                  Unit Type
                </option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={editForm.lowStockThreshold}
                onChange={handleEditChange}
                placeholder="Insert Quantity for Low Supply Alert"
              />
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Save Changes
                </button>
                <button type="button" className="secondary" onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteConfirm();
          }}
        >
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong>?
            </p>
            <div className="modal-actions">
              <button className="remove" onClick={handleConfirmDelete}>
                Yes, Remove
              </button>
              <button className="secondary" onClick={closeDeleteConfirm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
