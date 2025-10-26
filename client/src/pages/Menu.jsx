import { useEffect, useMemo, useState } from "react";
import "../styles/Menu.css";

export default function Menu() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  const [inventory, setInventory] = useState([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    category: "",
    price: "",
    available: true,
  });
  const [editSelectedIngredientIds, setEditSelectedIngredientIds] = useState(
    []
  );
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [tempSelectedIngredientIds, setTempSelectedIngredientIds] = useState(
    []
  );
  const [showIngredientPickerEdit, setShowIngredientPickerEdit] =
    useState(false);
  const [tempEditSelectedIngredientIds, setTempEditSelectedIngredientIds] =
    useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [addons, setAddons] = useState([]);
  const [addonsLoaded, setAddonsLoaded] = useState(false);

  const [showAddOn, setShowAddOn] = useState(false);
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    category: "",
    price: "",
    active: true,
  });

  const [showEditAddOn, setShowEditAddOn] = useState(false);
  const [editAddOnForm, setEditAddOnForm] = useState({
    _id: "",
    name: "",
    category: "",
    price: "",
    active: true,
  });

  const [showDeleteAddOn, setShowDeleteAddOn] = useState(false);
  const [deleteAddOnTarget, setDeleteAddOnTarget] = useState(null);
  const categoryOptions = useMemo(() => ["Drinks", "Snacks", "Meals"], []);

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const formatPHP = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(n)
      : "—";
  const selectedNames = useMemo(
    () =>
      inventory
        .filter((i) => selectedIngredientIds.includes(i._id))
        .map((i) => i.name),
    [inventory, selectedIngredientIds]
  );
  const editSelectedNames = useMemo(
    () =>
      inventory
        .filter((i) => editSelectedIngredientIds.includes(i._id))
        .map((i) => i.name),
    [inventory, editSelectedIngredientIds]
  );
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/menu-items", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load menu");
        const data = await res.json();
        if (!cancel) setItems(data);
      } catch (err) {
        if (!cancel) setError("Could not load menu");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);
  useEffect(() => {
    let cancel = false;
    const needInventory =
      showAddMenu ||
      showEdit ||
      showIngredientPicker ||
      showIngredientPickerEdit;
    if (!needInventory) return;
    if (inventory.length) return; // already loaded

    (async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/inventory?available=true",
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        if (!cancel) setInventory(data);
      } catch (e) {
        if (!cancel) setError(e.message || "Could not load inventory");
      }
    })();

    return () => {
      cancel = true;
    };
  }, [showAddMenu, showEdit, showIngredientPicker, showIngredientPickerEdit]);

  // Loads Addons
  useEffect(() => {
    if (activeTab !== "Add-on" || addonsLoaded) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/addons", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load add-ons");
        const data = await res.json();
        if (!cancel) {
          setAddons(data);
          setAddonsLoaded(true);
        }
      } catch (e) {
        if (!cancel) setError(e.message || "Could not load add-ons");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [activeTab, addonsLoaded]);
  const openIngredientPicker = () => {
    setTempSelectedIngredientIds(selectedIngredientIds); // start from current
    setShowIngredientPicker(true);
  };
  const closeIngredientPicker = () => setShowIngredientPicker(false);
  const confirmIngredientPicker = () => {
    setSelectedIngredientIds(tempSelectedIngredientIds);
    setShowIngredientPicker(false);
  };
  const openIngredientPickerEdit = () => {
    setTempEditSelectedIngredientIds(editSelectedIngredientIds);
    setShowIngredientPickerEdit(true);
  };
  const closeIngredientPickerEdit = () => setShowIngredientPickerEdit(false);
  const confirmIngredientPickerEdit = () => {
    setEditSelectedIngredientIds(tempEditSelectedIngredientIds);
    setShowIngredientPickerEdit(false);
  };
  // Handlers
  const openAddMenu = () => {
    setForm({ name: "", category: "", price: "" });
    setShowAddMenu(true);
  };
  useEffect(() => {
    let cancel = false;
    if (!showAddMenu) return;

    (async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/inventory?available=true",
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        if (!cancel) setInventory(data);
      } catch (e) {
        if (!cancel) setError(e.message || "Could not load inventory");
      }
    })();

    return () => {
      cancel = true;
    };
  }, [showAddMenu]);
  const closeAddMenu = () => {
    setShowAddMenu(false);
    setSelectedIngredientIds([]);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNewItem = async (e) => {
    e.preventDefault();
    try {
      if (selectedIngredientIds.length === 0) {
        throw new Error("Please select at least one ingredient.");
      }

      const body = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price) || 0,
        ingredients: selectedIngredientIds, 
      };

      const res = await fetch("http://localhost:5000/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const created = await res.json().catch(() => null);
      if (!res.ok) throw new Error(created?.message || "Failed to add item");

      const listRes = await fetch("http://localhost:5000/api/menu-items", {
        credentials: "include",
      });
      const listData = await listRes.json();
      setItems(listData);

      closeAddMenu();
    } catch (err) {
      setError(err.message || "Failed to add item");
    }
  };

  const openEditMenu = (item) => {
    setEditForm({
      _id: item._id,
      name: item.name,
      category: item.category,
      price: String(item.price ?? ""),
      available: !!item.available,
    });
    setEditSelectedIngredientIds(item.ingredients || []);
    setShowEdit(true);
  };
  const closeEditMenu = () => setShowEdit(false);
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const priceNum = Number(editForm.price);
      if (Number.isNaN(priceNum) || priceNum < 0)
        throw new Error("Enter a valid price");
      const body = {
        name: editForm.name.trim(),
        category: editForm.category,
        price: priceNum,
        available: !!editForm.available,
        ingredients: editSelectedIngredientIds,
      };
      const res = await fetch(
        `http://localhost:5000/api/menu-items/${editForm._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update item");
      setItems((list) => list.map((it) => (it._id === data._id ? data : it)));
      closeEditMenu();
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
        `http://localhost:5000/api/menu-items/${deleteTarget._id}`,
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

  const openAddOnModal = () => {
    setAddOnForm({ name: "", category: "", price: "", active: true });
    setShowAddOn(true);
  };
  const closeAddOnModal = () => setShowAddOn(false);

  const handleAddOnChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddOnForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateAddOn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = {
        name: addOnForm.name.trim(),
        category: addOnForm.category,
        price: Number(addOnForm.price) || 0,
        active: !!addOnForm.active,
        applicableTo: "drink",
      };
      const res = await fetch("http://localhost:5000/api/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const created = await res.json().catch(() => null);
      if (!res.ok) throw new Error(created?.message || "Failed to add add-on");
      setAddons((list) => [created, ...list]);
      closeAddOnModal();
    } catch (err) {
      setError(err.message || "Failed to add add-on");
    }
  };

  // edit
  const openEditAddOn = (a) => {
    setEditAddOnForm({
      _id: a._id,
      name: a.name ?? "",
      category: a.category ?? "",
      price: String(a.price ?? ""),
      active: !!a.active,
    });
    setShowEditAddOn(true);
  };
  const closeEditAddOn = () => setShowEditAddOn(false);

  const handleEditAddOnChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditAddOnForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateAddOn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = {
        name: editAddOnForm.name.trim(),
        category: editAddOnForm.category,
        price: Number(editAddOnForm.price) || 0,
        active: !!editAddOnForm.active,
      };
      const res = await fetch(
        `http://localhost:5000/api/addons/${editAddOnForm._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const updated = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(updated?.message || "Failed to update add-on");
      setAddons((list) =>
        list.map((x) => (x._id === updated._id ? updated : x))
      );
      closeEditAddOn();
    } catch (err) {
      setError(err.message || "Failed to update add-on");
    }
  };
  const openDeleteAddOnConfirm = (addon) => {
    setDeleteAddOnTarget(addon);
    setShowDeleteAddOn(true);
  };

  const closeDeleteAddOnConfirm = () => setShowDeleteAddOn(false);
  const handleConfirmDeleteAddOn = async () => {
    if (!deleteAddOnTarget) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/addons/${deleteAddOnTarget._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete add-on");

      setAddons((list) => list.filter((a) => a._id !== deleteAddOnTarget._id));
      closeDeleteAddOnConfirm();
    } catch (err) {
      setError(err.message || "Failed to delete add-on");
    }
  };
  // TABLE RENDERS
  const filteredItems =
    activeTab === "All"
      ? items
      : items.filter((it) => it.category === activeTab);

  const renderMenuTable = (rows) => (
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
        {rows.map((it) => (
          <tr key={it._id} className="table-body">
            <td>{it.name}</td>
            <td>{cap(it.category)}</td>
            <td>{formatPHP(it.price)}</td>
            <td
              className={`availability ${
                it.availableComputed ?? it.available
                  ? "available"
                  : "unavailable"
              }`}
            >
              <span className="badge">
                {it.availableComputed ?? it.available
                  ? "Available"
                  : "Not Available"}
              </span>
            </td>
            <td className="buttons">
              <button className="edit" onClick={() => openEditMenu(it)}>
                Edit
              </button>
              <button className="remove" onClick={() => openDeleteConfirm(it)}>
                Remove
              </button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} style={{ padding: "0.8rem" }}>
              No items in this category.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderAddOnTable = (rows) => (
    <table className="menu" cellSpacing={0} cellPadding={0}>
      <thead>
        <tr className="table-header">
          <th>Name</th>
          <th>Price</th>
          <th>Category</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a._id} className="table-body">
            <td>{a.name}</td>
            <td>{cap(a.category)}</td>
            <td>{formatPHP(a.price)}</td>
            <td
              className={`availability ${
                a.active ? "available" : "unavailable"
              }`}
            >
              <span className="badge">
                {a.active ? "Available" : "Not Available"}
              </span>
            </td>
            <td className="buttons">
              <button className="edit" onClick={() => openEditAddOn(a)}>
                Edit
              </button>
              <button
                className="remove"
                onClick={() => openDeleteAddOnConfirm(a)}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} style={{ padding: "0.8rem" }}>
              No add-ons yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="default-container">
      <h2>Cafe Menu Management</h2>

      {/* TABS */}
      <div className="menu-category">
        {["All", "Drinks", "Snacks", "Meals", "Add-on"].map((tab) => (
          <button
            key={tab}
            className={`category-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* HEADER BUTTONS */}
      <div className="header-buttons">
        <button onClick={openAddMenu}>Add New Item</button>
        {activeTab === "Add-on" && (
          <button onClick={openAddOnModal}>Add New Add-On</button>
        )}
      </div>

      {/*TABLE TO BE RENDERED */}
      <div className="table-scroll">
        {loading ? (
          <div style={{ padding: "1rem" }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: "1rem", color: "#b91c1c" }}>{error}</div>
        ) : activeTab === "Add-on" ? (
          renderAddOnTable(addons)
        ) : (
          renderMenuTable(filteredItems)
        )}
      </div>

      {/* MODALS */}
      {showAddMenu && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddMenu();
          }}
        >
          <div className="modal addMenuItem-modal">
            <h2>Add New Menu Item</h2>
            <form onSubmit={handleNewItem}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Item Name"
              />
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categoryOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="Price (₱)"
              />
              <div className="ingredient-summary-row">
                <button
                  type="button"
                  className="select-ingredients"
                  onClick={openIngredientPicker}
                >
                  Select ingredients
                </button>
                <div className="ingredient-summary">
                  {selectedIngredientIds.length === 0 ? (
                    <em>No ingredients selected</em>
                  ) : (
                    inventory
                      .filter((i) => selectedIngredientIds.includes(i._id))
                      .map((i) => i.name)
                      .join(", ")
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={selectedIngredientIds.length === 0}
                >
                  Add Item
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeAddMenu}
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
            if (e.target === e.currentTarget) closeEditMenu();
          }}
        >
          <div className="modal">
            <h2>Edit Menu Item</h2>
            <form onSubmit={handleUpdateItem} className="modal-item-form">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
                placeholder="Item Name"
              />
              <select
                name="category"
                value={editForm.category}
                onChange={handleEditChange}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categoryOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={handleEditChange}
                placeholder="Price (₱)"
                required
              />
              <label className="checkbox-availability">
                <input
                  type="checkbox"
                  name="available"
                  checked={!!editForm.available}
                  onChange={handleEditChange}
                />{" "}
                Available
              </label>
              <div className="ingredient-summary-row">
                <button
                  type="button"
                  className="select-ingredients"
                  onClick={openIngredientPickerEdit}
                >
                  Select ingredients
                </button>
                <div className="ingredient-summary">
                  {editSelectedIngredientIds.length === 0 ? (
                    <em>No ingredients selected</em>
                  ) : (
                    inventory
                      .filter((i) => editSelectedIngredientIds.includes(i._id))
                      .map((i) => i.name)
                      .join(", ")
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeEditMenu}
                >
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
            <h2>Confirm Removal</h2>
            <p>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong> from the menu?
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

      {/* FOR ADDON*/}
      {showAddOn && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddOnModal();
          }}
        >
          <div className="modal">
            <h2>Add New Add-On</h2>
            <form onSubmit={handleCreateAddOn} className="modal-addon-form">
              <input
                name="name"
                value={addOnForm.name}
                onChange={handleAddOnChange}
                required
                placeholder="Add-On Name"
              />
              <select
                name="category"
                value={addOnForm.category}
                onChange={handleAddOnChange}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categoryOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={addOnForm.price}
                onChange={handleAddOnChange}
                required
                placeholder="Price (₱)"
              />
              <label className="checkbox-availability">
                <input
                  type="checkbox"
                  name="active"
                  checked={!!addOnForm.active}
                  onChange={handleAddOnChange}
                />
                Available
              </label>
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Add Add-On
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeAddOnModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditAddOn && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditAddOn();
          }}
        >
          <div className="modal">
            <h2>Edit Add-On</h2>
            <form onSubmit={handleUpdateAddOn} className="modal-addon-form">
              <input
                name="name"
                value={editAddOnForm.name}
                onChange={handleEditAddOnChange}
                required
                placeholder="Add-On Name"
              />
              <select
                name="category"
                value={editAddOnForm.category}
                onChange={handleEditAddOnChange}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categoryOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={editAddOnForm.price}
                onChange={handleEditAddOnChange}
                required
                placeholder="Price (₱)"
              />
              <label className="checkbox-availability">
                <input
                  type="checkbox"
                  name="active"
                  checked={!!editAddOnForm.active}
                  onChange={handleEditAddOnChange}
                />
                Available
              </label>
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={closeEditAddOn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteAddOn && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteAddOnConfirm();
          }}
        >
          <div className="modal">
            <h2>Confirm Removal</h2>
            <p>
              Are you sure you want to remove{" "}
              <strong>{deleteAddOnTarget?.name}</strong>?
            </p>
            <div className="modal-actions">
              <button className="remove" onClick={handleConfirmDeleteAddOn}>
                Yes, Remove
              </button>
              <button className="secondary" onClick={closeDeleteAddOnConfirm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showIngredientPicker && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeIngredientPicker();
          }}
        >
          <div className="modal">
            <h2>Select Ingredients</h2>

            <div className="ingredients-list">
              {inventory.length === 0 && (
                <small>No inventory items available.</small>
              )}
              {inventory.map((inv) => (
                <label key={inv._id} className="ingredient-check">
                  <input
                    type="checkbox"
                    checked={tempSelectedIngredientIds.includes(inv._id)}
                    onChange={(e) => {
                      setTempSelectedIngredientIds((prev) =>
                        e.target.checked
                          ? [...new Set([...prev, inv._id])]
                          : prev.filter((id) => id !== inv._id)
                      );
                    }}
                  />
                  <span>
                    {inv.name}
                    {inv.quantity <= 0 ? " (Out of stock)" : ""}
                  </span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="primary"
                disabled={tempSelectedIngredientIds.length === 0}
                onClick={confirmIngredientPicker}
              >
                Use Selected
              </button>
              <button className="secondary" onClick={closeIngredientPicker}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showIngredientPickerEdit && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeIngredientPickerEdit();
          }}
        >
          <div className="modal">
            <h2>Select Ingredients</h2>

            <div className="ingredients-list">
              {inventory.length === 0 && (
                <small>No inventory items available.</small>
              )}
              {inventory.map((inv) => (
                <label key={inv._id} className="ingredient-check">
                  <input
                    type="checkbox"
                    checked={tempEditSelectedIngredientIds.includes(inv._id)}
                    onChange={(e) => {
                      setTempEditSelectedIngredientIds((prev) =>
                        e.target.checked
                          ? [...new Set([...prev, inv._id])]
                          : prev.filter((id) => id !== inv._id)
                      );
                    }}
                  />
                  <span>
                    {inv.name}
                    {inv.quantity <= 0 ? " (Out of stock)" : ""}
                  </span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="primary"
                disabled={tempEditSelectedIngredientIds.length === 0}
                onClick={confirmIngredientPickerEdit}
              >
                Use Selected
              </button>
              <button className="secondary" onClick={closeIngredientPickerEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
