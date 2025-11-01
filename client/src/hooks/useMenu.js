import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

// ---------- utils ----------
export const DP = 3; // keep 3dp for kg→grams precision; change per unit if needed

export const quantize = (n, dp = DP) =>
  Math.round((Number(n) + Number.EPSILON) * 10 ** dp) / 10 ** dp;

export const formatQty = (n, unit = "") => {
  const rounded = quantize(n);
  const s = rounded
    .toFixed(DP) // "4.420"
    .replace(/(\.\d*?[1-9])0+$/, "$1") // "4.42"
    .replace(/\.0+$/, ""); // "4"
  return unit ? `${s} ${unit}` : s;
};

const toNumber = (x, fb = 0) => (Number.isFinite(Number(x)) ? Number(x) : fb);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const formatPHP = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number.isFinite(n) ? n : 0
  );

const getRow = (list, id) =>
  list.find((r) => String(r.ingredient) === String(id)) || {
    ingredient: id,
    qtyPerUnit: 0,
    perSize: {},
  };

const buildRecipePayload = (selectedIds, recipeState, isDrink) => {
  const allow = new Set((selectedIds || []).map(String));
  return (recipeState || [])
    .filter((r) => allow.has(String(r.ingredient)))
    .map((r) => {
      const base = { ingredient: r.ingredient };
      if (!isDrink) {
        const q = quantize(toNumber(r.qtyPerUnit, 0), 3);
        base.qtyPerUnit = q >= 0 ? q : 0;
      } else {
        const oz12 = quantize(toNumber(r.perSize?.oz12, 0), 3);
        const oz16 = quantize(toNumber(r.perSize?.oz16, 0), 3);
        const perSize = {
          ...(Number.isFinite(oz12) && oz12 >= 0 ? { oz12 } : {}),
          ...(Number.isFinite(oz16) && oz16 >= 0 ? { oz16 } : {}),
        };
        if (Object.keys(perSize).length) base.perSize = perSize;
      }
      return base;
    });
};

// ---------- hook ----------
export function useMenu() {
  // data
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const inventoryById = useMemo(() => {
    const map = Object.create(null);
    for (const i of inventory) map[String(i._id)] = i;
    return map;
  }, [inventory]);
  const [addons, setAddons] = useState([]);

  // meta
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [addonsLoaded, setAddonsLoaded] = useState(false);

  // options
  const categoryOptions = useMemo(() => ["Drinks", "Snacks", "Meals"], []);

  // modals (menu items)
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // ingredient pickers
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [showIngredientPickerEdit, setShowIngredientPickerEdit] =
    useState(false);

  // modals (addons)
  const [showAddOn, setShowAddOn] = useState(false);
  const [showEditAddOn, setShowEditAddOn] = useState(false);
  const [showDeleteAddOn, setShowDeleteAddOn] = useState(false);

  // forms (menu)
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    size12: "",
    size16: "",
  });
  const [formRecipe, setFormRecipe] = useState([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);
  const [tempSelectedIngredientIds, setTempSelectedIngredientIds] = useState(
    []
  );

  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    category: "",
    price: "",
    size12: "",
    size16: "",
    available: true,
  });
  const [editRecipe, setEditRecipe] = useState([]);
  const [editSelectedIngredientIds, setEditSelectedIngredientIds] = useState(
    []
  );
  const [tempEditSelectedIngredientIds, setTempEditSelectedIngredientIds] =
    useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // forms (addons)
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    category: "",
    price: "",
    active: true,
  });
  const [editAddOnForm, setEditAddOnForm] = useState({
    _id: "",
    name: "",
    category: "",
    price: "",
    active: true,
  });
  const [deleteAddOnTarget, setDeleteAddOnTarget] = useState(null);

  // derived
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

  // ---------- loaders ----------
  const listMenu = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/menu-items`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load menu");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureInventory = useCallback(async () => {
    if (inventory.length) return;
    try {
      const res = await fetch(`${API_BASE}/inventory?available=true`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setInventory(
        (Array.isArray(data) ? data : []).map((i) => ({
          ...i,
          quantity: quantize(i.quantity ?? 0, 3),
        }))
      );
    } catch (e) {
      setError(e.message || "Could not load inventory");
    }
  }, [inventory.length]);

  const ensureAddons = useCallback(async () => {
    if (addonsLoaded) return;
    try {
      const res = await fetch(`${API_BASE}/addons`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load add-ons");
      setAddons(await res.json());
      setAddonsLoaded(true);
    } catch (e) {
      setError(e.message || "Could not load add-ons");
    }
  }, [addonsLoaded]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await listMenu();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [listMenu]);

  useEffect(() => {
    (async () => {
      await ensureInventory();
    })();
  }, [ensureInventory]);

  useEffect(() => {
    if (activeTab === "Add-on") ensureAddons();
  }, [activeTab, ensureAddons]);

  // keep price vs size fields exclusive when category toggles
  useEffect(() => {
    const isDrink = (form.category || "").toLowerCase() === "drinks";
    setForm((f) =>
      isDrink ? { ...f, price: "" } : { ...f, size12: "", size16: "" }
    );
  }, [form.category]);

  useEffect(() => {
    const isDrink = (editForm.category || "").toLowerCase() === "drinks";
    setEditForm((f) =>
      isDrink ? { ...f, price: "" } : { ...f, size12: "", size16: "" }
    );
  }, [editForm.category]);

  // ---------- ingredient pickers ----------
  const openIngredientPicker = useCallback(async () => {
    await ensureInventory();
    setTempSelectedIngredientIds(selectedIngredientIds);
    setShowIngredientPicker(true);
  }, [ensureInventory, selectedIngredientIds]);

  const closeIngredientPicker = useCallback(
    () => setShowIngredientPicker(false),
    []
  );

  const confirmIngredientPicker = useCallback(() => {
    setSelectedIngredientIds(tempSelectedIngredientIds);
    setFormRecipe((prev) => {
      const setIds = new Set(tempSelectedIngredientIds.map(String));
      const kept = prev.filter((r) => setIds.has(String(r.ingredient)));
      const existing = new Set(kept.map((r) => String(r.ingredient)));
      const isDrink = (form.category || "").toLowerCase() === "drinks";
      const added = tempSelectedIngredientIds
        .filter((id) => !existing.has(String(id)))
        .map((id) =>
          isDrink
            ? { ingredient: id, perSize: { oz12: 0, oz16: 0 } }
            : { ingredient: id, qtyPerUnit: 0 }
        );
      return [...kept, ...added];
    });
    setShowIngredientPicker(false);
  }, [tempSelectedIngredientIds, form.category]);

  const openIngredientPickerEdit = useCallback(async () => {
    await ensureInventory();
    setTempEditSelectedIngredientIds(editSelectedIngredientIds);
    setShowIngredientPickerEdit(true);
  }, [ensureInventory, editSelectedIngredientIds]);

  const closeIngredientPickerEdit = useCallback(
    () => setShowIngredientPickerEdit(false),
    []
  );

  const confirmIngredientPickerEdit = useCallback(() => {
    setEditSelectedIngredientIds(tempEditSelectedIngredientIds);
    setEditRecipe((prev) => {
      const setIds = new Set(tempEditSelectedIngredientIds.map(String));
      const kept = prev.filter((r) => setIds.has(String(r.ingredient)));
      const existing = new Set(kept.map((r) => String(r.ingredient)));
      const isDrink = (editForm.category || "").toLowerCase() === "drinks";
      const added = tempEditSelectedIngredientIds
        .filter((id) => !existing.has(String(id)))
        .map((id) =>
          isDrink
            ? { ingredient: id, perSize: { oz12: 0, oz16: 0 } }
            : { ingredient: id, qtyPerUnit: 0 }
        );
      return [...kept, ...added];
    });
    setShowIngredientPickerEdit(false);
  }, [tempEditSelectedIngredientIds, editForm.category]);

  // ---------- menu: create/update/delete ----------
  const openAddMenu = useCallback(async () => {
    setForm({ name: "", category: "", price: "", size12: "", size16: "" });
    setFormRecipe([]);
    setSelectedIngredientIds([]);
    await ensureInventory();
    setShowAddMenu(true);
  }, [ensureInventory]);

  const closeAddMenu = useCallback(() => {
    setShowAddMenu(false);
    setSelectedIngredientIds([]);
    setFormRecipe([]);
  }, []);

  const onFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  const createMenuItem = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      if (selectedIngredientIds.length === 0) {
        setError("Please select at least one ingredient.");
        return;
      }

      const isDrink = (form.category || "").toLowerCase() === "drinks";
      const body = {
        name: form.name.trim(),
        category: form.category,
        ingredients: selectedIngredientIds,
        recipe: buildRecipePayload(selectedIngredientIds, formRecipe, isDrink),
        ...(isDrink
          ? {
              sizePrices: {
                oz12: toNumber(form.size12),
                oz16: toNumber(form.size16),
              },
            }
          : { price: toNumber(form.price) }),
      };

      try {
        const res = await fetch(`${API_BASE}/menu-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const created = await res.json().catch(() => null);
        if (!res.ok) throw new Error(created?.message || "Failed to add item");
        // refresh list to respect server computed fields
        await listMenu();
        closeAddMenu();
      } catch (e2) {
        setError(e2.message || "Failed to add item");
      }
    },
    [form, formRecipe, selectedIngredientIds, listMenu, closeAddMenu]
  );

  const openEditMenu = useCallback(
    async (item) => {
      await ensureInventory(); // <-- ensure names are available on first render

      const isDrink = (item.category || "").toLowerCase() === "drinks";
      setEditForm({
        _id: item._id,
        name: item.name ?? "",
        category: item.category ?? "",
        price: String(item.price ?? ""),
        size12: isDrink ? String(item.sizePrices?.oz12 ?? "") : "",
        size16: isDrink ? String(item.sizePrices?.oz16 ?? "") : "",
        available: !!(item.available ?? true),
      });
      setEditSelectedIngredientIds(item.ingredients || []);
      setEditRecipe(
        Array.isArray(item.recipe) && item.recipe.length
          ? item.recipe.map((r) => ({
              ingredient: r.ingredient,
              qtyPerUnit: toNumber(r.qtyPerUnit, 0),
              perSize: r.perSize
                ? {
                    ...(Number.isFinite(Number(r.perSize.oz12))
                      ? { oz12: Number(r.perSize.oz12) }
                      : {}),
                    ...(Number.isFinite(Number(r.perSize.oz16))
                      ? { oz16: Number(r.perSize.oz16) }
                      : {}),
                  }
                : undefined,
            }))
          : (item.ingredients || []).map((id) => ({
              ingredient: id,
              qtyPerUnit: 0,
            }))
      );
      setShowEdit(true);
    },
    [ensureInventory]
  );

  const closeEditMenu = useCallback(() => setShowEdit(false), []);

  const onEditFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const updateMenuItem = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      const isDrink = (editForm.category || "").toLowerCase() === "drinks";
      const body = {
        name: editForm.name.trim(),
        category: editForm.category,
        available: !!editForm.available,
        ingredients: editSelectedIngredientIds,
        recipe: buildRecipePayload(
          editSelectedIngredientIds,
          editRecipe,
          isDrink
        ),
        ...(isDrink
          ? {
              sizePrices: {
                oz12: toNumber(editForm.size12),
                oz16: toNumber(editForm.size16),
              },
            }
          : { price: toNumber(editForm.price) }),
      };
      try {
        const res = await fetch(`${API_BASE}/menu-items/${editForm._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const updated = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(updated?.message || "Failed to update item");
        setItems((list) =>
          list.map((it) => (it._id === updated._id ? updated : it))
        );
        closeEditMenu();
      } catch (e2) {
        setError(e2.message || "Failed to update item");
      }
    },
    [editForm, editRecipe, editSelectedIngredientIds, closeEditMenu]
  );

  const openDeleteConfirm = useCallback((item) => {
    setDeleteTarget(item);
    setShowDelete(true);
  }, []);
  const closeDeleteConfirm = useCallback(() => setShowDelete(false), []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/menu-items/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete item");
      setItems((list) => list.filter((it) => it._id !== deleteTarget._id));
      closeDeleteConfirm();
    } catch (e2) {
      setError(e2.message || "Failed to delete item");
    }
  }, [deleteTarget, closeDeleteConfirm]);

  // ---------- addons: create/update/delete ----------
  const openAddOnModal = useCallback(() => {
    setAddOnForm({ name: "", category: "", price: "", active: true });
    setShowAddOn(true);
  }, []);
  const closeAddOnModal = useCallback(() => setShowAddOn(false), []);

  const onAddOnChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setAddOnForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const createAddOn = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      try {
        const body = {
          name: addOnForm.name.trim(),
          category: addOnForm.category,
          price: toNumber(addOnForm.price),
          active: !!addOnForm.active,
          applicableTo: "drink",
        };
        const res = await fetch(`${API_BASE}/addons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const created = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(created?.message || "Failed to add add-on");
        setAddons((list) => [created, ...list]);
        closeAddOnModal();
      } catch (e2) {
        setError(e2.message || "Failed to add add-on");
      }
    },
    [addOnForm, closeAddOnModal]
  );

  const openEditAddOn = useCallback((a) => {
    setEditAddOnForm({
      _id: a._id,
      name: a.name ?? "",
      category: a.category ?? "",
      price: String(a.price ?? ""),
      active: !!a.active,
    });
    setShowEditAddOn(true);
  }, []);
  const closeEditAddOn = useCallback(() => setShowEditAddOn(false), []);

  const onEditAddOnChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setEditAddOnForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const updateAddOn = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      try {
        const body = {
          name: editAddOnForm.name.trim(),
          category: editAddOnForm.category,
          price: toNumber(editAddOnForm.price),
          active: !!editAddOnForm.active,
        };
        const res = await fetch(`${API_BASE}/addons/${editAddOnForm._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const updated = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(updated?.message || "Failed to update add-on");
        setAddons((list) =>
          list.map((x) => (x._id === updated._id ? updated : x))
        );
        closeEditAddOn();
      } catch (e2) {
        setError(e2.message || "Failed to update add-on");
      }
    },
    [editAddOnForm, closeEditAddOn]
  );

  const openDeleteAddOnConfirm = useCallback((addon) => {
    setDeleteAddOnTarget(addon);
    setShowDeleteAddOn(true);
  }, []);
  const closeDeleteAddOnConfirm = useCallback(
    () => setShowDeleteAddOn(false),
    []
  );
  const confirmDeleteAddOn = useCallback(async () => {
    if (!deleteAddOnTarget) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/addons/${deleteAddOnTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete add-on");
      setAddons((list) => list.filter((a) => a._id !== deleteAddOnTarget._id));
      closeDeleteAddOnConfirm();
    } catch (e2) {
      setError(e2.message || "Failed to delete add-on");
    }
  }, [deleteAddOnTarget, closeDeleteAddOnConfirm]);

  // ---------- API for component ----------
  return {
    // data
    items,
    inventory,
    inventoryById,
    addons,

    // meta
    loading,
    error,
    setError,
    activeTab,
    setActiveTab,

    // options/util
    categoryOptions,
    cap,
    formatPHP,
    getRow,
    quantize,

    // create
    showAddMenu,
    openAddMenu,
    closeAddMenu,
    form,
    onFormChange,
    selectedIngredientIds,
    setSelectedIngredientIds,
    formRecipe,
    setFormRecipe,
    openIngredientPicker,
    closeIngredientPicker,
    showIngredientPicker,
    tempSelectedIngredientIds,
    setTempSelectedIngredientIds,
    confirmIngredientPicker,
    createMenuItem,

    // edit
    showEdit,
    openEditMenu,
    closeEditMenu,
    editForm,
    onEditFormChange,
    editSelectedIngredientIds,
    setEditSelectedIngredientIds,
    editRecipe,
    setEditRecipe,
    openIngredientPickerEdit,
    closeIngredientPickerEdit,
    showIngredientPickerEdit,
    tempEditSelectedIngredientIds,
    setTempEditSelectedIngredientIds,
    confirmIngredientPickerEdit,
    updateMenuItem,

    // delete
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
  };
}
