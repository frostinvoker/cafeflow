import { useInventory } from "../hooks/useInventory";
import "../styles/Inventory.css";

export default function Inventory() {
  const {
    items,
    loading,
    error,
    unitOptions,
    defaultThreshold,
    form,
    editForm,
    deleteTarget,
    createOpen,
    editOpen,
    deleteOpen,
    lowItems,
    // actions
    openCreate,
    closeCreate,
    onFormChange,
    create,
    openEdit,
    closeEdit,
    onEditFormChange,
    update,
    openDelete,
    closeDelete,
    confirmDelete,
  } = useInventory();

  const totalItems = items.length;
  const hasLow = !loading && !error && lowItems.length > 0;

  return (
    <div className="default-container">
      <h2>Inventory</h2>

      <div className={`low-supply-alert ${hasLow ? "show" : ""}`}>
        <p>
          Low Supply:{" "}
          {lowItems
            .map(
              (it) => `${it.name} (${Number(it.quantity)} ${it.unit || "pc"})`
            )
            .join(", ")}
        </p>
      </div>

      <div className="inventory-header">
        <div className="total-items">
          <p>Total items: {totalItems}</p>
        </div>
        <button className="add-new-item" onClick={openCreate}>
          + Add New Item
        </button>
      </div>

      {/* List */}
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
                <button className="remove" onClick={() => openDelete(it)}>
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

      {/* Create */}
      {createOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeCreate()}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Add New Item</h2>
            <form onSubmit={create}>
              <label>
                Item Name
                <input
                  name="name"
                  value={form.name}
                  onChange={onFormChange}
                  required
                  placeholder="Enter Item Name"
                />
              </label>
              <label>
                Quantity
                <input
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={onFormChange}
                  required
                  placeholder="Enter Stock Quantity"
                />
              </label>
              <label>
                Price per Unit
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={onFormChange}
                  placeholder="Price Per Unit"
                />
              </label>
              <label>
                Unit
                <select
                  name="unit"
                  value={form.unit}
                  onChange={onFormChange}
                  required
                >
                  <option value="" disabled>
                    Select Unit Type
                  </option>
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Min. Quantity for Low Supply Alert
                <input
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  value={form.lowStockThreshold}
                  onChange={onFormChange}
                  placeholder="Insert Quantity for Low Supply Alert"
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Add Item
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeCreate}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit */}
      {editOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeEdit()}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Edit Item</h2>
            <form onSubmit={update}>
              <label>
                Item Name
                <input
                  name="name"
                  value={editForm.name}
                  onChange={onEditFormChange}
                  required
                  placeholder="Item Name"
                />
              </label>
              <label>
                Quantity
                <input
                  name="quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={onEditFormChange}
                  required
                  placeholder="Stock Quantity"
                />
              </label>
              <label>
                Price per Unit
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={onEditFormChange}
                  placeholder="Price Per Unit"
                />
              </label>
              <label>
                Unit
                <select
                  name="unit"
                  value={editForm.unit}
                  onChange={onEditFormChange}
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
              </label>
              <label>
                Min. Quantity for Low Supply Alert
                <input
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  value={editForm.lowStockThreshold}
                  onChange={onEditFormChange}
                  placeholder="Insert Quantity for Low Supply Alert"
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
      {deleteOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeDelete()}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong>?
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
