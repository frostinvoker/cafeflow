import "../styles/Menu.css";
import { useMenu } from "../hooks/useMenu";

export default function Menu() {
  const {
    // data / meta
    items,
    addons,
    inventory,
    inventoryById,
    loading,
    error,
    setError,
    quantize,
    activeTab,
    setActiveTab,
    categoryOptions,
    cap,
    formatPHP,
    getRow,

    // add item
    showAddMenu,
    openAddMenu,
    closeAddMenu,
    form,
    onFormChange,
    selectedIngredientIds,
    setSelectedIngredientIds,
    formRecipe,
    setFormRecipe,
    showIngredientPicker,
    openIngredientPicker,
    closeIngredientPicker,
    tempSelectedIngredientIds,
    setTempSelectedIngredientIds,
    confirmIngredientPicker,
    createMenuItem,

    // edit item
    showEdit,
    openEditMenu,
    closeEditMenu,
    editForm,
    onEditFormChange,
    editSelectedIngredientIds,
    setEditSelectedIngredientIds,
    editRecipe,
    setEditRecipe,
    showIngredientPickerEdit,
    openIngredientPickerEdit,
    closeIngredientPickerEdit,
    tempEditSelectedIngredientIds,
    setTempEditSelectedIngredientIds,
    confirmIngredientPickerEdit,
    updateMenuItem,

    // delete item
    showDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,

    // addons
    showAddOn,
    openAddOnModal,
    closeAddOnModal,
    addOnForm,
    onAddOnChange,
    createAddOn,
    showEditAddOn,
    openEditAddOn,
    closeEditAddOn,
    editAddOnForm,
    onEditAddOnChange,
    updateAddOn,
    showDeleteAddOn,
    openDeleteAddOnConfirm,
    closeDeleteAddOnConfirm,
    confirmDeleteAddOn,
  } = useMenu();

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
            <td>
              {(it.category || "").toLowerCase() === "drinks"
                ? `${formatPHP(Number(it.sizePrices?.oz12 ?? 0))} / ${formatPHP(
                    Number(it.sizePrices?.oz16 ?? 0)
                  )}`
                : formatPHP(Number(it.price) || 0)}
            </td>
            <td
              className={`availability ${
                it.effectiveAvailable ??
                ((it.available ?? true) && (it.availableComputed ?? true))
                  ? "available"
                  : "unavailable"
              }`}
            >
              <span className="badge">
                {it.effectiveAvailable ??
                ((it.available ?? true) && (it.availableComputed ?? true))
                  ? "Available"
                  : "Not Available"}
              </span>
            </td>
            <td>
              <div className="table-buttons">
                <button className="edit" onClick={() => openEditMenu(it)}>
                  Edit
                </button>
                <button
                  className="remove"
                  onClick={() => openDeleteConfirm(it)}
                >
                  Remove
                </button>
              </div>
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
          <th>Category</th>
          <th>Price</th>
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
            <td className="table-buttons">
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
        <button onClick={openAddMenu}>+ Add New Item</button>
        {activeTab === "Add-on" && (
          <button onClick={openAddOnModal}>+ Add New Add-On</button>
        )}
      </div>

      {/* TABLE */}
      <div>
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

      {/* Add Menu Item */}
      {showAddMenu && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeAddMenu()}
        >
          <div className="modal addMenuItem-modal">
            <h2>Add New Menu Item</h2>
            <form onSubmit={createMenuItem}>
              <label>
                Item Name
                <input
                  name="name"
                  value={form.name}
                  onChange={onFormChange}
                  required
                  placeholder="Item Name"
                />
              </label>
              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={onFormChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              {(form.category || "").toLowerCase() === "drinks" ? (
                <div className="size-selector">
                  <label>
                    Price for 12oz
                    <input
                      name="size12"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.size12}
                      onChange={onFormChange}
                      placeholder="Price 12oz (₱)"
                      required
                    />
                  </label>
                  <label>
                    Price for 16oz
                    <input
                      name="size16"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.size16}
                      onChange={onFormChange}
                      placeholder="Price 16oz (₱)"
                      required
                    />
                  </label>
                </div>
              ) : (
                <label>
                  Price
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={onFormChange}
                    placeholder="Price (₱)"
                    required
                  />
                </label>
              )}

              <div className="ingredient-summary-row">
                <button
                  type="button"
                  className="select-ingredients"
                  onClick={openIngredientPicker}
                >
                  Select ingredients
                </button>
              </div>

              {selectedIngredientIds.length > 0 && (
                <div className="recipe-editor">
                  <h4>Stock used per item</h4>
                  <div className="recipe-grid">
                    {selectedIngredientIds.map((id) => {
                      const inv = inventoryById?.[String(id)];
                      const row = getRow(formRecipe, id);
                      const isDrink =
                        (form.category || "").toLowerCase() === "drinks";
                      return (
                        <div key={String(id)} className="recipe-row">
                          <div className="recipe-name">
                            {inv?.name || String(id)}{" "}
                            {inv?.unit ? <small>({inv.unit})</small> : null}
                          </div>

                          {!isDrink && (
                            <label>
                              Qty / {inv?.unit ?? "unit"}
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                value={row.qtyPerUnit ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setFormRecipe((prev) =>
                                    prev.map((r) =>
                                      String(r.ingredient) === String(id)
                                        ? { ...r, qtyPerUnit: v }
                                        : r
                                    )
                                  );
                                }}
                                onBlur={(e) => {
                                  const v = e.target.value;
                                  setFormRecipe((prev) =>
                                    prev.map((r) =>
                                      String(r.ingredient) === String(id)
                                        ? {
                                            ...r,
                                            qtyPerUnit:
                                              v === "" ? 0 : quantize(v),
                                          }
                                        : r
                                    )
                                  );
                                }}
                              />
                            </label>
                          )}

                          {isDrink && (
                            <>
                              <label>
                                Qty for 12oz
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={row.perSize?.oz12 ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setFormRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz12: v,
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  onBlur={(e) => {
                                    const v = e.target.value;
                                    setFormRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz12:
                                                  v === "" ? 0 : quantize(v),
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                />
                              </label>
                              <label>
                                Qty for 16oz
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.01"
                                  value={row.perSize?.oz16 ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setFormRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz16: v,
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  onBlur={(e) => {
                                    const v = e.target.value;
                                    setFormRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz16:
                                                  v === "" ? 0 : quantize(v),
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

      {/* Edit Menu Item */}
      {showEdit && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeEditMenu()}
        >
          <div className="modal">
            <h2>Edit Menu Item</h2>
            <form onSubmit={updateMenuItem} className="modal-item-form">
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
                Category
                <select
                  name="category"
                  value={editForm.category}
                  onChange={onEditFormChange}
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
              </label>
              {(editForm.category || "").toLowerCase() === "drinks" ? (
                <div className="size-selector">
                  <label>
                    Price for 12oz
                    <input
                      name="size12"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.size12}
                      onChange={onEditFormChange}
                      placeholder="Price 12oz (₱)"
                      required
                    />
                  </label>
                  <label>
                    Price for 16oz
                    <input
                      name="size16"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.size16}
                      onChange={onEditFormChange}
                      placeholder="Price 16oz (₱)"
                      required
                    />
                  </label>
                </div>
              ) : (
                <label>
                  Price
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={onEditFormChange}
                    placeholder="Price (₱)"
                    required
                  />
                </label>
              )}

              <div className="ingredient-summary-row">
                <button
                  type="button"
                  className="select-ingredients"
                  onClick={openIngredientPickerEdit}
                >
                  Select ingredients
                </button>
              </div>

              {editSelectedIngredientIds.length > 0 && (
                <div className="recipe-editor">
                  <h4>Stock used per item</h4>
                  <div className="recipe-grid">
                    {editSelectedIngredientIds.map((id) => {
                      const inv = inventory.find((i) => i._id === id);
                      const row = getRow(editRecipe, id);
                      const isDrink =
                        (editForm.category || "").toLowerCase() === "drinks";
                      return (
                        <div key={String(id)} className="recipe-row">
                          <div className="recipe-name">
                            {inv?.name}{" "}
                            {inv?.unit ? <small>({inv.unit})</small> : null}
                          </div>

                          {!isDrink && (
                            <label>
                              Qty / {inv?.unit ?? "unit"}
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={row.qtyPerUnit ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setEditRecipe((prev) =>
                                    prev.map((r) =>
                                      String(r.ingredient) === String(id)
                                        ? { ...r, qtyPerUnit: v }
                                        : r
                                    )
                                  );
                                }}
                                onBlur={(e) => {
                                  const v = e.target.value;
                                  setEditRecipe((prev) =>
                                    prev.map((r) =>
                                      String(r.ingredient) === String(id)
                                        ? {
                                            ...r,
                                            qtyPerUnit:
                                              v === "" ? 0 : quantize(v),
                                          }
                                        : r
                                    )
                                  );
                                }}
                              />
                            </label>
                          )}

                          {isDrink && (
                            <>
                              <label>
                                Qty for 12oz
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.01"
                                  value={row.perSize?.oz12 ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setEditRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz12: v,
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  onBlur={(e) => {
                                    const v = e.target.value;
                                    setEditRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz12:
                                                  v === "" ? 0 : quantize(v),
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                />
                              </label>
                              <label>
                                Qty for 16oz
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.01"
                                  value={row.perSize?.oz16 ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setEditRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz16: v,
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  onBlur={(e) => {
                                    const v = e.target.value;
                                    setEditRecipe((prev) =>
                                      prev.map((r) =>
                                        String(r.ingredient) === String(id)
                                          ? {
                                              ...r,
                                              perSize: {
                                                ...(r.perSize || {}),
                                                oz16:
                                                  v === "" ? 0 : quantize(v),
                                              },
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="checkbox-availability">
                <input
                  type="checkbox"
                  name="available"
                  checked={!!editForm.available}
                  onChange={onEditFormChange}
                />
                <p>Available</p>
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

      {/* Confirm Delete Menu Item */}
      {showDelete && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeDeleteConfirm()}
        >
          <div className="modal">
            <h2>Confirm Removal</h2>
            <p>
              Are you sure you want to remove{" "}
              <strong>{/* name shown in button row */}</strong>?
            </p>
            <div className="modal-actions">
              <button className="remove" onClick={confirmDelete}>
                Yes, Remove
              </button>
              <button className="secondary" onClick={closeDeleteConfirm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Add-On */}
      {showAddOn && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeAddOnModal()}
        >
          <div className="modal">
            <h2>Add New Add-On</h2>
            <form onSubmit={createAddOn} className="modal-addon-form">
              <label>
                Add-On Name
                <input
                  name="name"
                  value={addOnForm.name}
                  onChange={onAddOnChange}
                  required
                  placeholder="Add-On Name"
                />
              </label>
              <label>
                Category
                <select
                  name="category"
                  value={addOnForm.category}
                  onChange={onAddOnChange}
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
              </label>
              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={addOnForm.price}
                  onChange={onAddOnChange}
                  required
                  placeholder="Price (₱)"
                />
              </label>
              <div className="checkbox-availability">
                <input
                  type="checkbox"
                  name="active"
                  checked={!!addOnForm.active}
                  onChange={onAddOnChange}
                />
                <p>Available</p>
              </div>
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

      {/* Edit Add-On */}
      {showEditAddOn && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeEditAddOn()}
        >
          <div className="modal">
            <h2>Edit Add-On</h2>
            <form onSubmit={updateAddOn} className="modal-addon-form">
              <label>
                Add-On Name
                <input
                  name="name"
                  value={editAddOnForm.name}
                  onChange={onEditAddOnChange}
                  required
                  placeholder="Add-On Name"
                />
              </label>
              <label>
                Category
                <select
                  name="category"
                  value={editAddOnForm.category}
                  onChange={onEditAddOnChange}
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
              </label>
              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editAddOnForm.price}
                  onChange={onEditAddOnChange}
                  required
                  placeholder="Price (₱)"
                />
              </label>
              <div className="checkbox-availability">
                <input
                  type="checkbox"
                  name="active"
                  checked={!!editAddOnForm.active}
                  onChange={onEditAddOnChange}
                />
                <p>Available</p>
              </div>
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

      {/* Confirm Delete Add-On */}
      {showDeleteAddOn && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && closeDeleteAddOnConfirm()
          }
        >
          <div className="modal">
            <h2>Confirm Removal</h2>
            <p>Are you sure you want to remove this add-on?</p>
            <div className="modal-actions">
              <button className="remove" onClick={confirmDeleteAddOn}>
                Yes, Remove
              </button>
              <button className="secondary" onClick={closeDeleteAddOnConfirm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Picker (Create) */}
      {showIngredientPicker && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && closeIngredientPicker()
          }
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

      {/* Ingredient Picker (Edit) */}
      {showIngredientPickerEdit && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && closeIngredientPickerEdit()
          }
        >
          <div className="modal">
            <h2>Select Ingredients</h2>
            <div className="ingredients-list">
              {inventory.length === 0 && (
                <small>No inventory items available.</small>
              )}
              {inventory.map((inv) => (
                <div key={inv._id} className="ingredient-check">
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
                </div>
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
