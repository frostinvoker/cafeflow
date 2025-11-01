import { useCallback, useEffect, useMemo, useState } from "react";

const API =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

function toNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function useInventory() {
  // core state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // options / constants
  const unitOptions = useMemo(() => ["pc", "grams", "kg", "ml", "liters"], []);
  const defaultThreshold = 3;

  // modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // forms
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    price: "",
    unit: "",
    lowStockThreshold: "",
  });

  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    quantity: "",
    price: "",
    unit: "pc",
    lowStockThreshold: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  // read
  const list = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/inventory`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await list();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [list]);

  // create
  const openCreate = useCallback(() => {
    setForm({
      name: "",
      quantity: "",
      price: "",
      unit: "",
      lowStockThreshold: "",
    });
    setCreateOpen(true);
  }, []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  const onFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const create = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");

      const body = {
        name: form.name.trim(),
        unit: form.unit,
        quantity: toNumber(form.quantity),
      };
      if (form.price !== "") body.price = toNumber(form.price);
      if (form.lowStockThreshold !== "")
        body.lowStockThreshold = Math.max(0, toNumber(form.lowStockThreshold));

      try {
        const res = await fetch(`${API}/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const created = await res.json().catch(() => null);
        if (!res.ok) throw new Error(created?.message || "Failed to add item");
        setItems((prev) => [created, ...prev]);
        closeCreate();
      } catch (e) {
        setError(e.message || "Failed to add item");
      }
    },
    [form, closeCreate]
  );

  // edit
  const openEdit = useCallback((it) => {
    setEditForm({
      _id: it._id,
      name: it.name ?? "",
      quantity: String(it.quantity ?? ""),
      price: it.price != null ? String(it.price) : "",
      unit: it.unit ?? "pc",
      lowStockThreshold:
        it.lowStockThreshold != null ? String(it.lowStockThreshold) : "",
    });
    setEditOpen(true);
  }, []);
  const closeEdit = useCallback(() => setEditOpen(false), []);

  const onEditFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const update = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");

      const body = {
        name: editForm.name.trim(),
        unit: editForm.unit,
        quantity: toNumber(editForm.quantity),
      };
      if (editForm.price !== "") body.price = toNumber(editForm.price);
      if (editForm.lowStockThreshold !== "")
        body.lowStockThreshold = Math.max(
          0,
          toNumber(editForm.lowStockThreshold)
        );

      try {
        const res = await fetch(`${API}/inventory/${editForm._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const updated = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(updated?.message || "Failed to update item");

        setItems((prev) =>
          prev.map((x) => (x._id === updated._id ? updated : x))
        );
        closeEdit();
      } catch (e) {
        setError(e.message || "Failed to update item");
      }
    },
    [editForm, closeEdit]
  );

  // delete
  const openDelete = useCallback((it) => {
    setDeleteTarget(it);
    setDeleteOpen(true);
  }, []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API}/inventory/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to delete item");
      setItems((prev) => prev.filter((x) => x._id !== deleteTarget._id));
      closeDelete();
    } catch (e) {
      setError(e.message || "Failed to delete item");
    }
  }, [deleteTarget, closeDelete]);

  // derived
  const lowItems = useMemo(() => {
    return items.filter((it) => {
      const t = toNumber(it.lowStockThreshold, defaultThreshold);
      const threshold = t > 0 ? t : defaultThreshold;
      return toNumber(it.quantity) <= threshold;
    });
  }, [items]);

  return {
    // state
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
    list,
    // create
    openCreate,
    closeCreate,
    onFormChange,
    create,
    // edit
    openEdit,
    closeEdit,
    onEditFormChange,
    update,
    // delete
    openDelete,
    closeDelete,
    confirmDelete,

    // misc
    setError,
  };
}
