
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

function Sidebar({ user, activePage, setActivePage, onLogout, isOpen, onCloseMobile }) {
  const isAdmin = user?.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "orders", label: "Orders / Sales", icon: ClipboardList },
    { id: "users", label: "Customers", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  function handleItemClick(id) {
    setActivePage(id);
    if (window.innerWidth <= 768 && onCloseMobile) {
      onCloseMobile();
    }
  }

  return (
    <aside className={`admin-enterprise-sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-brand-block">
        <div className="sidebar-brand-badge">🏬</div>
        <div className="sidebar-brand-info">
          <h3>Retail Inventory</h3>
          <span className="sidebar-brand-sub">Management Portal</span>
        </div>
      </div>

      <div className="sidebar-nav-section">
        <div className="sidebar-section-title">ADMIN CONTROLS</div>

        <div className="sidebar-nav-list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePage === item.id ||
              (item.id === "orders" && activePage === "sales") ||
              (item.id === "users" && activePage === "customers");

            return (
              <button
                key={item.id}
                className={`sidebar-nav-link ${isActive ? "active" : ""}`}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
              >
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isActive && <ChevronRight size={14} className="active-arrow" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-bottom-footer">
        <button className="sidebar-nav-link logout-btn" onClick={onLogout}>
          <LogOut size={19} className="nav-icon" />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
