import "../styles/Admin.css";

export default function Admin() {
  return(
    <div className="default-container admin-container">
      <h2>Admin Management</h2>
      <p>Manager-only access to security and user control settings.</p>
      <div className="management-container">
        <div className="manager-account">
          <form className="manager-password-form">
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
        </div>

        <div className="barista-management">
          <form className="barista-new-account">
            <h3>Barista Management</h3>
                <input
                  type="text"
                  placeholder="Enter Barista Name"
                />
                <input
                  type="email"
                  placeholder="Enter Barista Email"
                />
                <input
                  type="password"
                  placeholder="Enter Password"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                />
            <button className="admin-long-button">Create Barista Account</button>
          </form>
          
          <div className="table-scroll">
            <table className="barista-table" cellSpacing={0} cellPadding={0}>
              <thead>
                <tr className="table-header-barista">
                  <th>Barista Email</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr className="table-body">
                  <td>juan@gmail.com</td>
                  <td className="buttons-barista">
                    <button className="edit-password">Edit Password</button>
                    <button className="disable-account">Disable</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        

      </div>
    </div>
  )
}