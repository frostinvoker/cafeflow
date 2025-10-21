import { useEffect, useState } from "react";
import "../styles/Customers.css";

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    email: "",
    loyaltyPoints: 0,
  });

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load customers
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/customers", {
          credentials: "include",
          signal: abort.signal,
        });
        if (!res.ok) throw new Error("Failed to load customers");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        if (err.name !== "AbortError") setError("Could not load customer");
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  // Add customer modal
  const openAddCustomer = () => {
    setForm({ name: "", email: "" });
    setShowAddCustomer(true);
  };
  const closeAddCustomer = () => setShowAddCustomer(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNewCustomer = async (e) => {
    e.preventDefault();
    setError("");
    const body = {
      name: form.name.trim(),
      email: form.email,
    };
    try {
      const res = await fetch("http://localhost:5000/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const created = await res.json().catch(() => null);
      if (!res.ok) throw new Error(created?.message || "Failed to add customer");
      setItems((list) => [created, ...list]);
      closeAddCustomer();
    } catch (err) {
      setError(err.message || "Failed to add customer");
    }
  };

  // Edit customer modal
  const openEditCustomer = (item) => {
    setEditForm({
      _id: item._id,
      name: item.name ?? "",
      email: item.email ?? "",
      loyaltyPoints: Number(item.loyaltyPoints ?? 0),
    });
    setShowEditCustomer(true);
  };
  const closeEditCustomer = () => setShowEditCustomer(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") return;
    setEditForm((f) => ({
      ...f,
      [name]: name === "loyaltyPoints" ? Number(value) : value,
    }));
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setError("");
    const body = {
      name: editForm.name.trim(),
      email: editForm.email,
      loyaltyPoints: Number(editForm.loyaltyPoints) || 0,
    };
    try {
      const res = await fetch(
        `http://localhost:5000/api/customers/${editForm._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update customer");
      setItems((list) => list.map((it) => (it._id === data._id ? data : it)));
      closeEditCustomer();
    } catch (err) {
      setError(err.message || "Failed to update customer");
    }
  };

  // Delete confirm modal
  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);
    setShowDelete(true);
  };
  const closeDeleteConfirm = () => setShowDelete(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/customers/${deleteTarget._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete customer");
      setItems((list) => list.filter((it) => it._id !== deleteTarget._id));
      closeDeleteConfirm();
    } catch (err) {
      setError(err.message || "Failed to delete customer");
    }
  };

  return (
    <div className="default-container">
      <h2>Customer Management</h2>
      <button className="add-customer" onClick={openAddCustomer}>
        Add New Customer
      </button>

      {loading ? (
        <div style={{ padding: "1rem" }}>Loading customers...</div>
      ) : error ? (
        <div style={{ padding: "1rem", color: "#b91c1c" }}>{error}</div>
      ) : items.length === 0 ? (
        <div style={{ padding: "1rem" }}>No customers yet</div>
      ) : (
        <table className="customer" cellSpacing={0} cellPadding={0}>
          <thead>
            <tr className="table-header">
              <th>Customer</th>
              <th>Contact</th>
              <th>Loyalty Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id} className="table-body">
                <td>{it.name}</td>
                <td>{it.email}</td>
                <td>{it.loyaltyPoints ?? 0}</td>
                <td className="buttons">
                  <button className="edit" onClick={() => openEditCustomer(it)}>
                    Edit
                  </button>
                  <button
                    className="remove"
                    onClick={() => openDeleteConfirm(it)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddCustomer();
          }}
        >
          <div className="modal addMenuCustomer-modal">
            <h2>Add New Customer</h2>
            <form onSubmit={handleNewCustomer}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Full Name"
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Email"
              />
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Add Customer
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeAddCustomer}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomer && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditCustomer();
          }}
        >
          <div className="modal">
            <h2>Edit Customer</h2>
            <form onSubmit={handleUpdateCustomer}>
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
                placeholder="Full Name"
              />
              <input
                name="email"
                type="email"
                value={editForm.email}
                readOnly
                aria-readonly="true"
                className="readonly"
                placeholder="Email"
              />
              <input
                name="loyaltyPoints"
                type="number"
                min="0"
                step="1"
                value={Number(editForm.loyaltyPoints ?? 0)}
                onChange={handleEditChange}
                required
                placeholder="Loyalty Points"
              />
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeEditCustomer}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
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
              Are you sure you want to delete{" "}
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
