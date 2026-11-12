import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Bell,
  Calendar,
  Home,
  Package,
  Layers,
  ClipboardList,
  Heart,
  Search,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Tags,
  Boxes,
  BarChart3,
  Settings,
} from "lucide-react";

function Navbar({
  user,
  isAdmin,
  onLogout,
  toggleSidebar,
  onNavigate,
  activePage,
  searchQuery = "",
  onSearchChange,
  onOpenWishlist,
}) {
  const [currentDate, setCurrentDate] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [adminProfileOpen, setAdminProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const adminProfileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setCurrentDate(formatted);

    // Update cart count
    const updateCartCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = saved.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    // Update wishlist count
    const updateWishlistCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("retail_wishlist") || "[]");
        setWishlistCount(saved.length);
      } catch {
        setWishlistCount(0);
      }
    };

    updateCartCount();
    updateWishlistCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("wishlistUpdated", updateWishlistCount);
    window.addEventListener("storage", () => {
      updateCartCount();
      updateWishlistCount();
    });

    // Outside click listener
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (adminProfileRef.current && !adminProfileRef.current.contains(e.target)) {
        setAdminProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (onNavigate) {
      onNavigate("products");
    }
  }

  function getAdminPageLabel(page) {
    switch (page) {
      case "dashboard":
        return "Executive Dashboard";
      case "inventory":
        return "Stock & Inventory";
      case "products":
        return "Product Catalog";
      case "categories":
        return "Product Categories";
      case "orders":
      case "sales":
        return "Orders & Sales";
      case "users":
      case "customers":
        return "Customer Accounts";
      case "reports":
        return "Reports & Analytics";
      case "settings":
        return "System Settings";
      default:
        return "Portal Overview";
    }
  }

  function handleNavClick(page) {
    if (onNavigate) onNavigate(page);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setAdminProfileOpen(false);
  }

  return (
    <header className={`modern-navbar-header ${isAdmin ? "admin-mode" : "user-mode"}`}>
      <div className="navbar-inner-wrapper">
        {/* =====================================================
            LEFT: BRAND LOGO & ADMIN SIDEBAR TOGGLE
        ====================================================== */}
        <div className="navbar-brand-section">
          {isAdmin && (
            <button
              className="btn-menu-toggle"
              onClick={toggleSidebar}
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
          )}

          <div
            className="brand-logo-container"
            onClick={() => handleNavClick("dashboard")}
            title="Retail Inventory Store"
          >
            <div className="brand-logo-icon">🛍️</div>
            <div className="brand-title-group">
              <span className="brand-main-title">Retail Inventory</span>
              <span className="brand-sub-badge">
                {isAdmin ? "Admin Portal" : "Live Retail Store"}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="navbar-admin-breadcrumbs">
              <span className="crumb-root">Admin Portal</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{getAdminPageLabel(activePage)}</span>
            </div>
          )}
        </div>

        {/* =====================================================
            CENTER: SEARCH BAR (USER ONLY)
        ====================================================== */}
        {!isAdmin && (
          <div className="navbar-search-section">
            <form onSubmit={handleSearchSubmit} className="navbar-search-form">
              <Search size={17} className="navbar-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                placeholder="Search products, brands, or categories..."
                className="navbar-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="navbar-search-clear"
                  onClick={() => onSearchChange && onSearchChange("")}
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>
        )}

        {/* =====================================================
            RIGHT: DESKTOP NAV LINKS + ACTIONS
        ====================================================== */}
        {!isAdmin ? (
          <div className="navbar-user-actions-desktop">
            {/* NAV LINKS */}
            <nav className="user-primary-nav-links">
              <button
                onClick={() => handleNavClick("dashboard")}
                className={`user-nav-link ${
                  !activePage || activePage === "dashboard" ? "active" : ""
                }`}
              >
                Home
              </button>

              <button
                onClick={() => handleNavClick("products")}
                className={`user-nav-link ${
                  activePage === "products" ? "active" : ""
                }`}
              >
                Products
              </button>

              <button
                onClick={() => handleNavClick("categories")}
                className={`user-nav-link ${
                  activePage === "categories" ? "active" : ""
                }`}
              >
                Categories
              </button>

              <button
                onClick={() => handleNavClick("my-orders")}
                className={`user-nav-link ${
                  activePage === "my-orders" ? "active" : ""
                }`}
              >
                My Orders
              </button>
            </nav>

            <div className="nav-vertical-divider"></div>

            {/* WISHLIST BUTTON */}
            <button
              className="navbar-icon-action-btn"
              onClick={onOpenWishlist}
              title="Saved Wishlist"
            >
              <Heart size={20} className={wishlistCount > 0 ? "text-red" : ""} fill={wishlistCount > 0 ? "#ef4444" : "none"} />
              {wishlistCount > 0 && (
                <span className="navbar-badge-pill wishlist-pill">{wishlistCount}</span>
              )}
            </button>

            {/* CART BUTTON */}
            <button
              className={`navbar-cart-action-btn ${
                activePage === "cart" ? "active" : ""
              }`}
              onClick={() => handleNavClick("cart")}
              title="View Shopping Cart"
            >
              <ShoppingCart size={19} />
              <span className="navbar-cart-label">Cart</span>
              <span className="navbar-badge-pill cart-pill">{cartCount}</span>
            </button>

            {/* PROFILE DROPDOWN */}
            <div className="navbar-profile-dropdown-wrapper" ref={profileRef}>
              <button
                className="btn-profile-trigger"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
              >
                <div className="user-avatar-chip">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <span className="user-name-short">{user?.name?.split(" ")[0] || "Account"}</span>
                <ChevronDown size={14} />
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-header">
                    <strong>{user?.name || "Customer"}</strong>
                    <small>{user?.email}</small>
                    <span className="dropdown-role-tag">Customer Account</span>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-menu-item"
                    onClick={() => handleNavClick("profile")}
                  >
                    <User size={15} />
                    <span>My Profile & Address</span>
                  </button>

                  <button
                    className="dropdown-menu-item"
                    onClick={() => handleNavClick("my-orders")}
                  >
                    <ClipboardList size={15} />
                    <span>My Order History</span>
                  </button>

                  <button
                    className="dropdown-menu-item"
                    onClick={() => handleNavClick("cart")}
                  >
                    <ShoppingCart size={15} />
                    <span>My Cart ({cartCount})</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-menu-item logout-link"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* MOBILE HAMBURGER TOGGLE */}
            <button
              className="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        ) : (
          /* =====================================================
              ADMIN ACTIONS
          ====================================================== */
          <div className="navbar-admin-actions">
            <div className="admin-date-pill">
              <Calendar size={15} />
              <span>{currentDate}</span>
            </div>

            {/* NOTIFICATIONS DROPDOWN */}
            <div className="admin-notifications-wrapper" ref={notifRef}>
              <button
                className="btn-admin-notif"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                title="System Notifications"
              >
                <Bell size={18} />
                <span className="notif-pulse-dot"></span>
              </button>

              {notificationsOpen && (
                <div className="admin-notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <span className="notif-count-tag">Live Feed</span>
                  </div>
                  <div className="notif-items-list">
                    <div className="notif-item-row unread">
                      <div className="notif-dot blue"></div>
                      <div>
                        <p className="notif-msg">New orders placed in real-time.</p>
                        <small className="notif-time">Just now</small>
                      </div>
                    </div>
                    <div className="notif-item-row">
                      <div className="notif-dot emerald"></div>
                      <div>
                        <p className="notif-msg">Database inventory sync active.</p>
                        <small className="notif-time">Today</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN PROFILE DROPDOWN */}
            <div className="admin-profile-dropdown-wrapper" ref={adminProfileRef}>
              <button
                className="btn-admin-profile-trigger"
                onClick={() => setAdminProfileOpen((prev) => !prev)}
                title="Admin Account Profile"
              >
                <div className="admin-avatar-box">
                  <Shield size={16} />
                </div>
                <div className="admin-details-meta">
                  <span className="admin-name-text">{user?.name || "Administrator"}</span>
                  <span className="admin-role-badge-small">Admin Portal</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`admin-chevron-icon ${adminProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {adminProfileOpen && (
                <div className="admin-profile-dropdown-menu">
                  <div className="admin-dropdown-header">
                    <strong>{user?.name || "Administrator"}</strong>
                    <small>{user?.email || "admin@retail.com"}</small>
                    <span className="admin-dropdown-role-pill">Verified Administrator</span>
                  </div>

                  <div className="admin-dropdown-menu-list">
                    <button
                      className="admin-dropdown-item"
                      onClick={() => handleNavClick("dashboard")}
                    >
                      <LayoutDashboard size={15} />
                      <span>Executive Dashboard</span>
                    </button>
                    <button
                      className="admin-dropdown-item"
                      onClick={() => handleNavClick("inventory")}
                    >
                      <Boxes size={15} />
                      <span>Stock & Inventory</span>
                    </button>
                    <button
                      className="admin-dropdown-item"
                      onClick={() => handleNavClick("products")}
                    >
                      <Package size={15} />
                      <span>Product Catalog</span>
                    </button>
                    <button
                      className="admin-dropdown-item"
                      onClick={() => handleNavClick("categories")}
                    >
                      <Tags size={15} />
                      <span>Product Categories</span>
                    </button>
                    <button
                      className="admin-dropdown-item"
                      onClick={() => handleNavClick("reports")}
                    >
                      <BarChart3 size={15} />
                      <span>Reports & Audits</span>
                    </button>
                    <button
                      className="admin-dropdown-item"
                      onClick={() => handleNavClick("settings")}
                    >
                      <Settings size={15} />
                      <span>System Settings</span>
                    </button>

                    <div className="admin-dropdown-divider"></div>

                    <button
                      className="admin-dropdown-item logout-link"
                      onClick={() => {
                        setAdminProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                    >
                      <LogOut size={15} className="text-red" />
                      <span className="text-red font-semibold">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LOGOUT */}
            <button
              className="btn-admin-logout"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout from Admin"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          ADMIN LOGOUT CONFIRMATION MODAL
      ====================================================== */}
      {isAdmin && showLogoutConfirm && (
        <div
          className="modal-backdrop-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="confirm-dialog-card admin-logout-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box bg-red-subtle">
              <LogOut size={26} className="text-red" />
            </div>
            <h3>Confirm Sign Out</h3>
            <p>
              Are you sure you want to end your administrative session as{" "}
              <strong>{user?.name || "Administrator"}</strong>?
            </p>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
              >
                <LogOut size={15} />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MOBILE DRAWER (FOR USERS)
      ====================================================== */}
      {!isAdmin && mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <div className="mobile-drawer-header">
            <div className="mobile-user-info">
              <div className="mobile-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{user?.name || "Shopper"}</strong>
                <small>{user?.email}</small>
              </div>
            </div>
            <button
              className="btn-close-drawer"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="mobile-drawer-links">
            <button
              className={`mobile-link-item ${
                activePage === "dashboard" ? "active" : ""
              }`}
              onClick={() => handleNavClick("dashboard")}
            >
              <Home size={18} />
              <span>Home Store</span>
            </button>

            <button
              className={`mobile-link-item ${
                activePage === "products" ? "active" : ""
              }`}
              onClick={() => handleNavClick("products")}
            >
              <Package size={18} />
              <span>All Products</span>
            </button>

            <button
              className={`mobile-link-item ${
                activePage === "categories" ? "active" : ""
              }`}
              onClick={() => handleNavClick("categories")}
            >
              <Layers size={18} />
              <span>Categories</span>
            </button>

            <button
              className={`mobile-link-item ${
                activePage === "my-orders" ? "active" : ""
              }`}
              onClick={() => handleNavClick("my-orders")}
            >
              <ClipboardList size={18} />
              <span>My Orders</span>
            </button>

            <button
              className={`mobile-link-item ${
                activePage === "cart" ? "active" : ""
              }`}
              onClick={() => handleNavClick("cart")}
            >
              <ShoppingCart size={18} />
              <span>Shopping Cart ({cartCount})</span>
            </button>

            <button
              className={`mobile-link-item ${
                activePage === "profile" ? "active" : ""
              }`}
              onClick={() => handleNavClick("profile")}
            >
              <User size={18} />
              <span>My Profile & Address</span>
            </button>
          </div>

          <div className="mobile-drawer-footer">
            <button
              className="btn-mobile-logout"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;