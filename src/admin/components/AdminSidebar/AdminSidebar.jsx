import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiShoppingBag,
  FiUser,
  FiGlobe,
  FiBookOpen,
  FiBriefcase,
  FiMail,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

import "./AdminSidebar.css";

function AdminSidebar() {
  const links = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <FiGrid />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <FiShoppingBag />,
    },
    {
      name: "Accounts",
      path: "/admin/accounts",
      icon: <FiUser />,
    },
    {
      name: "Proxies",
      path: "/admin/proxies",
      icon: <FiGlobe />,
    },
    {
      name: "Training",
      path: "/admin/training",
      icon: <FiBookOpen />,
    },
    {
      name: "Services",
      path: "/admin/services",
      icon: <FiBriefcase />,
    },
    {
      name: "Messages",
      path: "/admin/messages",
      icon: <FiMail />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <FiSettings />,
    },
  ];

  return (
    <aside className="admin-sidebar">

      <div className="admin-sidebar-logo">
        Account <span>Bazaar</span>
      </div>

      <div className="admin-sidebar-label">
        MANAGEMENT
      </div>

      <nav className="admin-sidebar-nav">

        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/admin"}
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}

      </nav>

      <div className="admin-sidebar-bottom">

        <button type="button">
          <FiLogOut />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default AdminSidebar;