import "../styles/Admin.css";
import { useAdmin } from "../hooks/useAdmin";

export default function Admin() {
  const {
    // list/meta
    baristas,
    loading,
    err,

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
  } = useAdmin();

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
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              onChange={(e) => setBPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={bConfirmPassword}
              onChange={(e) => setBConfirmPassword(e.target.value)}
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
                    const isActive = normalizeActive(u.status);
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
                            className={`disable-account ${
                              isActive ? "is-active" : "is-disabled"
                            }`}
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
