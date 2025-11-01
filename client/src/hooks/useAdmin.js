import { useCallback, useEffect, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL ?? "http://localhost:5000") + "/api";

// Small helpers
const normalizeActive = (status) => status === "active" || status === true;

export function useAdmin() {
  // ---- Manager password ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // ---- Create barista ----
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bPassword, setBPassword] = useState("");
  const [bConfirmPassword, setBConfirmPassword] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  // ---- List baristas ----
  const [baristas, setBaristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---- Confirm modal (disable account) ----
  const [confirm, setConfirm] = useState({
    open: false,
    id: null,
    name: "",
    currentStatus: "",
  });

  // ============ Load ============
  const loadBaristas = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/admin/baristas`, {
        credentials: "include",
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load baristas");
      setBaristas(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.name !== "AbortError")
        setErr(e.message || "Could not load baristas");
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cleanup = loadBaristas();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [loadBaristas]);

  // ============ Manager password ============
  const submitManagerPassword = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setPasswordMsg("");
      if (newPassword !== confirmPassword) {
        setPasswordMsg("New passwords do not match");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/me/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Update failed");
        setPasswordMsg("Password updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (e2) {
        setPasswordMsg(e2.message || "Update failed");
      }
    },
    [currentPassword, newPassword, confirmPassword]
  );

  // ============ Create barista ============
  const createBarista = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setCreateMsg("");
      if (bPassword !== bConfirmPassword) {
        setCreateMsg("Passwords do not match");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/baristas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: bName,
            email: bEmail,
            password: bPassword,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(data?.message || "Create Barista account failed");
        setCreateMsg("Barista account created");
        setBName("");
        setBEmail("");
        setBPassword("");
        setBConfirmPassword("");
        // refresh list to pick up normalized status from server
        await loadBaristas();
      } catch (e2) {
        setCreateMsg(e2.message || "Create Barista account failed");
      }
    },
    [bName, bEmail, bPassword, bConfirmPassword, loadBaristas]
  );

  // ============ Toggle status ============
  const patchStatus = useCallback(async (id, nextStatus) => {
    const res = await fetch(`${API_BASE}/admin/baristas/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Update failed");
    return data; // updated user
  }, []);

  const toggleStatus = useCallback(
    async (id, currentStatus) => {
      // server uses "active"/"disabled" (also seen boolean true/false in UI)
      const next =
        normalizeActive(currentStatus) || currentStatus === "active"
          ? "disabled"
          : "active";
      const updated = await patchStatus(id, next);
      setBaristas((list) => list.map((u) => (u._id === id ? updated : u)));
    },
    [patchStatus]
  );

  // Click handler that either opens confirm or enables directly
  const handleToggleClick = useCallback(
    (u) => {
      const isActive = normalizeActive(u.status);
      const next = isActive ? "disabled" : "active";
      if (next === "disabled") {
        setConfirm({
          open: true,
          id: u._id,
          name: u.name,
          currentStatus: u.status,
        });
      } else {
        // enabling — do it directly
        toggleStatus(u._id, u.status).catch((e) => alert(e.message));
      }
    },
    [toggleStatus]
  );

  const confirmDisable = useCallback(async () => {
    try {
      await toggleStatus(confirm.id, confirm.currentStatus);
    } catch (e) {
      alert(e.message);
    } finally {
      setConfirm({ open: false, id: null, name: "", currentStatus: "" });
    }
  }, [confirm, toggleStatus]);

  const closeModal = useCallback(() => {
    setConfirm({ open: false, id: null, name: "", currentStatus: "" });
  }, []);

  return {
    // list/meta
    baristas,
    loading,
    err,
    setErr,
    loadBaristas,

    // manager password
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordMsg,
    submitManagerPassword,

    // create barista
    bName,
    setBName,
    bEmail,
    setBEmail,
    bPassword,
    setBPassword,
    bConfirmPassword,
    setBConfirmPassword,
    createMsg,
    createBarista,

    // toggle/confirm
    handleToggleClick,
    confirm,
    confirmDisable,
    closeModal,
    normalizeActive,
  };
}
