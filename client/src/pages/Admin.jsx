import "../styles/Admin.css";

export default function Admin() {
  return(
    <div className="default-container admin-container">
      <h2>Admin Management</h2>
      <p>Manager-only access to security and user control settings.</p>

    <form className="manager-account">
      <h3>Change Manager Password</h3>
          <input
            type="password"
            placeholder="Current Password"
          />
          <input
            type="password"
            placeholder="New Password"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
          />
      <button className="admin-long-button">Update Password</button>
    </form>

    <div className="barista-account">

    </div>
    </div>
  )
}