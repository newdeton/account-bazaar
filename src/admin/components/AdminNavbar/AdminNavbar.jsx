import {
  FiBell,
  FiUser,
} from "react-icons/fi";

import "./AdminNavbar.css";

function AdminNavbar() {
  return (
    <header className="admin-navbar">

      <div>
        <h2>Admin Dashboard</h2>
        <p>Manage your Account Bazaar marketplace</p>
      </div>

      <div className="admin-navbar-actions">

        <button
          type="button"
          className="admin-notification"
        >
          <FiBell />
          <span></span>
        </button>

        <div className="admin-profile">
          <div className="admin-profile-icon">
            <FiUser />
          </div>

          <div>
            <strong>Administrator</strong>
            <small>Admin</small>
          </div>
        </div>

      </div>

    </header>
  );
}

export default AdminNavbar;