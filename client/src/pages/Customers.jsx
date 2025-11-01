import { useCustomers } from "../hooks/useCustomers";
import "../styles/Customers.css";

export default function Customers() {
  const {
    items,
    loading,
    error,
    showAdd,
    openAdd,
    closeAdd,
    form,
    onFormChange,
    create,
    showEdit,
    openEdit,
    closeEdit,
    editForm,
    onEditChange,
    update,
    showDelete,
    openDelete,
    closeDelete,
    confirmDelete,
  } = useCustomers();

  return (
    <div className="default-container">
      <h2>Customer Management</h2>
      <button className="add-customer" onClick={openAdd}>
        + Add New Customer
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
                <td className="table-buttons">
                  <button className="edit" onClick={() => openEdit(it)}>
                    Edit
                  </button>
                  <button className="remove" onClick={() => openDelete(it)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add */}
      {showAdd && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeAdd()}
        >
          <div className="modal addMenuCustomer-modal">
            <h2>Add New Customer</h2>
            <form onSubmit={create}>
              <label>Full Name
              <input
                name="name"
                value={form.name}
                onChange={onFormChange}
                required
                placeholder="Enter Full Name"
              />
              </label>
              <label>Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onFormChange}
                required
                placeholder="Enter Email"
              />
              </label>
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Add Customer
                </button>
                <button type="button" className="secondary" onClick={closeAdd}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit */}
      {showEdit && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeEdit()}
        >
          <div className="modal">
            <h2>Edit Customer</h2>
            <form onSubmit={update}>
              <label>Full Name
              <input
                name="name"
                value={editForm.name}
                onChange={onEditChange}
                required
                placeholder="Full Name"
              />
              </label>
              <label>Email
              <input
                name="email"
                type="email"
                value={editForm.email}
                readOnly
                aria-readonly="true"
                className="readonly"
                placeholder="Email"
              />
              </label>
              <label>Loyalty Points
              <input
                name="loyaltyPoints"
                type="number"
                min="0"
                step="1"
                value={Number(editForm.loyaltyPoints ?? 0)}
                onChange={onEditChange}
                required
                placeholder="Loyalty Points"
              />
              </label>
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

      {/* Delete */}
      {showDelete && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeDelete()}
        >
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{/* name shown from state */}</strong>?
            </p>
            <div className="modal-actions">
              <button className="remove" onClick={confirmDelete}>
                Yes, Remove
              </button>
              <button className="secondary" onClick={closeDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
