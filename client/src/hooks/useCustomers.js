import { useCallback, useEffect, useState } from "react";

const API =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

export function useCustomers() {
  // data/meta
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // forms
  const [form, setForm] = useState({ name: "", email: "" });
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    email: "",
    loyaltyPoints: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ------- load -------
  const list = useCallback(async () => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/customers`, {
        credentials: "include",
        signal: abort.signal,
      });
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.name !== "AbortError") setError("Could not load customer");
    } finally {
      setLoading(false);
    }
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const cleanup = list();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [list]);

  // ------- create -------
  const openAdd = useCallback(() => {
    setForm({ name: "", email: "" });
    setShowAdd(true);
  }, []);
  const closeAdd = useCallback(() => setShowAdd(false), []);
  const onFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);
  const create = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      const body = { name: form.name.trim(), email: form.email.trim() };
      try {
        const res = await fetch(`${API}/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const created = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(created?.message || "Failed to add customer");
        setItems((list) => [created, ...list]);
        closeAdd();
      } catch (e2) {
        setError(e2.message || "Failed to add customer");
      }
    },
    [form, closeAdd]
  );

  // ------- edit -------
  const openEdit = useCallback((item) => {
    setEditForm({
      _id: item._id,
      name: item.name ?? "",
      email: item.email ?? "",
      loyaltyPoints: Number(item.loyaltyPoints ?? 0),
    });
    setShowEdit(true);
  }, []);
  const closeEdit = useCallback(() => setShowEdit(false), []);
  const onEditChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "email") return; // keep read-only behavior
    setEditForm((f) => ({
      ...f,
      [name]: name === "loyaltyPoints" ? Number(value) : value,
    }));
  }, []);
  const update = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      const body = {
        name: editForm.name.trim(),
        email: editForm.email,
        loyaltyPoints: Number(editForm.loyaltyPoints) || 0,
      };
      try {
        const res = await fetch(`${API}/customers/${editForm._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const updated = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(updated?.message || "Failed to update customer");
        setItems((list) =>
          list.map((it) => (it._id === updated._id ? updated : it))
        );
        closeEdit();
      } catch (e2) {
        setError(e2.message || "Failed to update customer");
      }
    },
    [editForm, closeEdit]
  );

  // ------- delete -------
  const openDelete = useCallback((item) => {
    setDeleteTarget(item);
    setShowDelete(true);
  }, []);
  const closeDelete = useCallback(() => setShowDelete(false), []);
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      const res = await fetch(`${API}/customers/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete customer");
      setItems((list) => list.filter((it) => it._id !== deleteTarget._id));
      closeDelete();
    } catch (e2) {
      setError(e2.message || "Failed to delete customer");
    }
  }, [deleteTarget, closeDelete]);

  return {
    // data/meta
    items,
    loading,
    error,
    setError,

    // create
    showAdd,
    openAdd,
    closeAdd,
    form,
    onFormChange,
    create,

    // edit
    showEdit,
    openEdit,
    closeEdit,
    editForm,
    onEditChange,
    update,

    // delete
    showDelete,
    openDelete,
    closeDelete,
    confirmDelete,
  };
}
