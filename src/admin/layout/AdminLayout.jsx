import { Outlet } from "react-router-dom";

import AdminNavbar from "../components/AdminNavbar/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar/AdminSidebar";

import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">

      <AdminSidebar />

      <div className="admin-main">

        <AdminNavbar />

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;