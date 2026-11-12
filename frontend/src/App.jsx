import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import AdminDashboard from "./pages/AdminDashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Sales from "./pages/Sales";
import Users from "./pages/Users";
import UserDashboard from "./pages/UserDashboard";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/Profile";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";

// Modals
import WishlistModal from "./components/WishlistModal";

function App() {
  // ===============================
  // USER STATE
  // ===============================
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // ===============================
  // PAGE & SIDEBAR STATE
  // ===============================
  const [activePage, setActivePage] = useState("dashboard");
  const [showRegister, setShowRegister] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Search query state shared with Products
  const [searchQuery, setSearchQuery] = useState("");

  // Global Wishlist Modal state
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("retail_wishlist") || "[]");
    } catch {
      return [];
    }
  });

  // Sync Wishlist from events
  useEffect(() => {
    const handleWishlistSync = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("retail_wishlist") || "[]");
        setWishlist(saved);
      } catch {
        setWishlist([]);
      }
    };

    window.addEventListener("wishlistUpdated", handleWishlistSync);
    window.addEventListener("storage", handleWishlistSync);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistSync);
      window.removeEventListener("storage", handleWishlistSync);
    };
  }, []);

  function handleRemoveWishlist(id) {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    try {
      localStorage.setItem("retail_wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch {
      // ignore
    }
  }

  function handleAddToCartFromWishlist(product, qty = 1) {
    const productStock = Number(product.stock !== undefined ? product.stock : 0);
    if (productStock <= 0) return;

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = existingCart.findIndex(
      (item) => Number(item.product_id || item.id) === Number(product.id)
    );

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = existingCart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: Number(item.quantity || 1) + qty }
          : item
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.image,
          stock: productStock,
          quantity: qty,
        },
      ];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  // ===============================
  // ROLE CHECK
  // ===============================
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // ===============================
  // LOGIN / LOGOUT
  // ===============================
  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setActivePage("dashboard");
    setShowRegister(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setActivePage("dashboard");
    setShowRegister(false);
  }

  // Helper for navigating with search query
  function handleSearchFromNavbar(query) {
    setSearchQuery(query);
    if (activePage !== "products") {
      setActivePage("products");
    }
  }

  // ===============================
  // PAGE RENDER
  // ===============================
  function renderPage() {
    // -------------------------------------------------
    // USER VIEWS
    // -------------------------------------------------
    if (!isAdmin) {
      if (activePage === "products") {
        return (
          <Products
            onNavigate={setActivePage}
            initialSearch={searchQuery}
          />
        );
      }

      if (activePage === "categories") {
        return <Categories onNavigate={setActivePage} />;
      }

      if (activePage === "cart") {
        return <Cart onNavigate={setActivePage} />;
      }

      if (activePage === "checkout") {
        return <Checkout onNavigate={setActivePage} />;
      }

      if (activePage === "my-orders") {
        return <MyOrders onNavigate={setActivePage} />;
      }

      if (activePage === "profile") {
        return (
          <Profile
            user={user}
            onNavigate={setActivePage}
            onLogout={handleLogout}
          />
        );
      }

      return <UserDashboard user={user} onNavigate={setActivePage} />;
    }

    // -------------------------------------------------
    // ADMIN VIEWS
    // -------------------------------------------------
    if (activePage === "products") {
      return <Products onNavigate={setActivePage} />;
    }

    if (activePage === "categories") {
      return <Categories onNavigate={setActivePage} />;
    }

    if (activePage === "inventory") {
      return <Inventory onNavigate={setActivePage} />;
    }

    if (activePage === "orders" || activePage === "sales") {
      return <Sales onNavigate={setActivePage} />;
    }

    if (activePage === "users" || activePage === "customers") {
      return <Users onNavigate={setActivePage} />;
    }

    if (activePage === "reports") {
      return <AdminReports onNavigate={setActivePage} />;
    }

    if (activePage === "settings") {
      return <AdminSettings onNavigate={setActivePage} />;
    }

    return <AdminDashboard onNavigate={setActivePage} />;
  }

  // ===============================
  // AUTH VIEWS
  // ===============================
  if (!user) {
    if (showRegister) {
      return (
        <Register
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onCreateAccount={() => setShowRegister(true)}
      />
    );
  }

  // ===============================
  // MAIN APPLICATION
  // ===============================
  return (
    <div className={`app-root-container ${isAdmin ? "admin-experience" : "ecom-experience"}`}>
      {/* TOP STICKY NAVBAR */}
      <Navbar
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onNavigate={setActivePage}
        activePage={activePage}
        searchQuery={searchQuery}
        onSearchChange={handleSearchFromNavbar}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      {/* ADMIN WITH SIDEBAR VS USER FULL-WIDTH SHOPPING */}
      {isAdmin ? (
        <div className="main-layout admin-layout-wrapper">
          <Sidebar
            user={user}
            activePage={activePage}
            setActivePage={setActivePage}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
          />

          {isSidebarOpen && (
            <div
              className="admin-mobile-sidebar-overlay"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar overlay"
            />
          )}

          <main className={`main-content ${isSidebarOpen ? "with-sidebar" : "full-width"}`}>
            {renderPage()}
          </main>
        </div>
      ) : (
        <main className="user-storefront-wrapper">
          {renderPage()}
        </main>
      )}

      {/* GLOBAL WISHLIST MODAL FOR CUSTOMERS */}
      {!isAdmin && (
        <WishlistModal
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          wishlist={wishlist}
          onRemoveFromWishlist={handleRemoveWishlist}
          onAddToCart={handleAddToCartFromWishlist}
        />
      )}
    </div>
  );
}

export default App;