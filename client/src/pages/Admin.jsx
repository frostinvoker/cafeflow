import { useEffect, useState } from "react";
import "../styles/Admin.css";

const API = "http://localhost:5000/api";

export default function Admin() {
  // change manager password
  const [currentPassword, setcurrentPassword] = useState("");
  const [newPassword, setnewPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [passwordMsg, setpasswordMsg] = useState("");

  // create barista
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bPassword, setbPassword] = useState("");
  const [bConfirmPassword, setbConfirmPassword] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  // list baristas
  const [baristas, setBaristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // confirm modal state
  const [confirm, setConfirm] = useState({
    open: false,
    id: null,
    name: "",
    currentStatus: "",
  });

  const loadBaristas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/admin/baristas`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load baristas");
      setBaristas(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaristas();
  }, []);

  const submitManagerPassword = async (e) => {
    e.preventDefault();
    setpasswordMsg("");
    if (newPassword !== confirmPassword)
      return setpasswordMsg("New passwords do not match");
    try {
      const res = await fetch(`${API}/admin/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");
      setpasswordMsg("Password updated");
      setcurrentPassword("");
      setnewPassword("");
      setconfirmPassword("");
    } catch (e) {
      setpasswordMsg(e.message);
    }
  };

  const createBarista = async (e) => {
    e.preventDefault();
    setCreateMsg("");
    if (bPassword !== bConfirmPassword)
      return setCreateMsg("Passwords do not match");
    try {
      const res = await fetch(`${API}/admin/baristas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: bName,
          email: bEmail,
          password: bPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Create Barista account failed");
      setCreateMsg("Barista account created");
      setBName("");
      setBEmail("");
      setbPassword("");
      setbConfirmPassword("");
      loadBaristas();
    } catch (e) {
      setCreateMsg(e.message);
    }
  };

  const toggleStatus = async (id, status) => {
    try {
      const next = status === "active" ? "disabled" : "active";
      const res = await fetch(`${API}/admin/baristas/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");
      setBaristas((list) => list.map((u) => (u._id === id ? data : u)));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleClick = (u) => {
    const next =
      u.status === "active" || u.status === true ? "disabled" : "active";
    if (next === "disabled") {
      setConfirm({
        open: true,
        id: u._id,
        name: u.name,
        currentStatus: u.status,
      });
    } else {
      toggleStatus(u._id, u.status);
    }
  };

  const confirmDisable = async () => {
    await toggleStatus(confirm.id, confirm.currentStatus);
    setConfirm({ open: false, id: null, name: "", currentStatus: "" });
  };

  const closeModal = () =>
    setConfirm({ open: false, id: null, name: "", currentStatus: "" });

  return (
    <div className="default-container admin-container">
      <h2>Admin Management</h2>
      <p>Manager-only access to security and user control settings.</p>

      <div className="management-container">
        {/* Manager password */}
        <div className="manager-account">
          <form
            className="manager-password-form"
            onSubmit={submitManagerPassword}
          >
            <h3>Change Manager Password</h3>
            {passwordMsg && (
              <small
                style={{
                  color:
                    passwordMsg === "Password updated" ? "#4CAF50" : "#b91c1c",
                }}
              >
                {passwordMsg}
              </small>
            )}
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setcurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setnewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setconfirmPassword(e.target.value)}
            />
            <button className="admin-long-button">Update Password</button>
          </form>
        </div>

        {/* Barista management */}
        <div className="barista-management">
          <form className="barista-new-account" onSubmit={createBarista}>
            <h3>Barista Management</h3>
            {createMsg && (
              <small
                style={{
                  color:
                    createMsg === "Barista account created"
                      ? "#4CAF50"
                      : "#b91c1c",
                }}
              >
                {createMsg}
              </small>
            )}
            <input
              type="text"
              placeholder="Enter Barista Name"
              value={bName}
              onChange={(e) => setBName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Enter Barista Email"
              value={bEmail}
              onChange={(e) => setBEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter Password"
              value={bPassword}
              onChange={(e) => setbPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={bConfirmPassword}
              onChange={(e) => setbConfirmPassword(e.target.value)}
            />
            <button className="admin-long-button">
              Create Barista Account
            </button>
          </form>

          <div className="table-scroll">
            {loading ? (
              <div style={{ padding: "1rem" }}>Loading…</div>
            ) : err ? (
              <div style={{ padding: "1rem", color: "#b91c1c" }}>{err}</div>
            ) : (
              <table className="barista-table" cellSpacing={0} cellPadding={0}>
                <thead>
                  <tr className="table-header-barista">
                    <th>Name</th>
                    <th>Barista Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {baristas.map((u) => {
                    const isActive = u.status === "active" || u.status === true;
                    return (
                      <tr key={u._id} className="table-body">
                        <td>{u.name}</td>
                        <td>{u.email}</td>

                        <td
                          className={`availability ${
                            isActive ? "available" : "unavailable"
                          }`}
                        >
                          <span className="badge">
                            {isActive ? "Active" : "Disabled"}
                          </span>
                        </td>

                        <td className="buttons-barista">
                          <button
                                className={`disable-account ${isActive ? "is-active" : "is-disabled"}`}
                            onClick={() => handleToggleClick(u)}
                          >
                            {isActive ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {baristas.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: ".75rem" }}>
                        No baristas yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirm.open && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Disable Account</h2>
            <p>
              Are you sure you want to disable <strong>{confirm.name}</strong>'s
              account?
            </p>
            <div className="modal-actions">
              <button className="remove" onClick={confirmDisable}>
                Disable
              </button>
              <button className="secondary" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
