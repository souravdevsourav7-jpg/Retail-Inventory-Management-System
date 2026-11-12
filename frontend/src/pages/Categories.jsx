
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Tags,
  Edit2,
  Trash2,
  Search,
  Package,
  Layers,
  Boxes,
  X,
  RefreshCw,
  FolderPlus,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Eye,
  LayoutGrid,
  List,
  Smartphone,
  Shirt,
  Home,
  Utensils,
  Watch,
  IndianRupee,
  XCircle,
  BookOpen,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import Footer from "../components/Footer";
import "./Categories.css";

// Curated high-resolution royalty-free photography for department categories
const CATEGORY_CURATED_IMAGES = {
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
  clothing: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
  accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  stationery: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
  home: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  books: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80",
};

// Rich domain-tailored descriptions for departments when database description is blank
const CATEGORY_DEFAULT_DESCRIPTIONS = {
  electronics: "Premium smartphones, laptops, audio gear, high-performance gadgets, and modern tech accessories.",
  clothing: "Trendsetting apparel, casual wear, premium cotton t-shirts, and stylish everyday wardrobe staples.",
  accessories: "Classic timepieces, fine jewelry, designer bags, sunglasses, and curated lifestyle accessories.",
  food: "Fresh gourmet foods, snacks, pantry provisions, beverages, and handcrafted delicious delicacies.",
  stationery: "High-grade writing instruments, notebooks, fine journals, and modern office productivity essentials.",
  home: "Contemporary home decor, living room accents, aesthetic ambient lighting, and modern homeware.",
  sports: "High-performance fitness gear, athletic sportswear, training equipment, and outdoor recreation.",
  beauty: "Personal grooming, skincare, wellness essentials, fragrances, and premium self-care products.",
};

function Categories({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Modal State (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const token = localStorage.getItem("token");

  function getAuthConfig() {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [catRes, prodRes] = await Promise.all([
        axios.get("http://localhost:5000/api/categories", getAuthConfig()),
        axios.get("http://localhost:5000/api/products", getAuthConfig()),
      ]);

      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error("ERROR FETCHING CATEGORIES:", err);
      setError(
        err.response?.data?.message || "Failed to load product categories"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3200);
  }

  // Count products per category
  function getProductCount(catName) {
    return products.filter(
      (p) => (p.category || "").toLowerCase() === (catName || "").toLowerCase()
    ).length;
  }

  // Helper for image url
  function getProductImage(product) {
    if (product && product.image && product.image.trim() !== "") {
      if (product.image.startsWith("http")) return product.image;
      const normalized = product.image.startsWith("/") ? product.image : `/${product.image}`;
      return `http://localhost:5000${normalized}`;
    }
    return `https://placehold.co/500x400?text=${encodeURIComponent(
      product?.name || "Product"
    )}`;
  }

  function handleOpenAdd() {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setFormError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat) {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      if (editingCategory) {
        await axios.put(
          `http://localhost:5000/api/categories/${editingCategory.id}`,
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
          },
          getAuthConfig()
        );
        showToast("Category updated successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/categories",
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
          },
          getAuthConfig()
        );
        showToast("New category created successfully!");
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      console.error("SAVE CATEGORY ERROR:", err);
      setFormError(
        err.response?.data?.message || "Failed to save category."
      );
    } finally {
      setFormSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deletingCategory) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/categories/${deletingCategory.id}`,
        getAuthConfig()
      );
      showToast(`Category "${deletingCategory.name}" removed.`);
      setDeletingCategory(null);
      loadData();
    } catch (err) {
      console.error("DELETE CATEGORY ERROR:", err);
      showToast(err.response?.data?.message || "Failed to delete category.");
      setDeletingCategory(null);
    }
  }

  // User click on category to browse products
  function handleSelectUserCategory(catName) {
    if (!catName || catName.toLowerCase() === "all") {
      sessionStorage.removeItem("selectedCategory");
    } else {
      sessionStorage.setItem("selectedCategory", catName);
    }
    if (onNavigate) {
      onNavigate("products");
    }
  }

  // User View: Search and Filter State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userInStockOnly, setUserInStockOnly] = useState(false);

  // Helper: Resolve Category Display Image (prioritizes actual product image from database, then curated photography)
  function getCategoryDisplayImage(catName) {
    if (!catName) {
      return "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80";
    }
    const targetCat = catName.toLowerCase().trim();

    // 1. Prefer an actual product image uploaded in the database for this category
    const productWithImg = products.find(
      (p) =>
        (p.category || "").toLowerCase().trim() === targetCat &&
        p.image &&
        p.image.trim() !== ""
    );

    if (productWithImg) {
      if (productWithImg.image.startsWith("http")) return productWithImg.image;
      const normalizedPath = productWithImg.image.startsWith("/")
        ? productWithImg.image
        : `/${productWithImg.image}`;
      return `http://localhost:5000${normalizedPath}`;
    }

    // 2. Curated high-resolution royalty-free photography for this category
    for (const [key, url] of Object.entries(CATEGORY_CURATED_IMAGES)) {
      if (targetCat.includes(key)) {
        return url;
      }
    }

    // 3. Clean retail fallback
    return "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80";
  }

  // Graceful Image Error handling
  function handleImageError(e, catName) {
    const targetCat = (catName || "").toLowerCase().trim();
    const curated = Object.entries(CATEGORY_CURATED_IMAGES).find(([key]) =>
      targetCat.includes(key)
    )?.[1];

    if (curated && e.currentTarget.src !== curated) {
      e.currentTarget.src = curated;
      return;
    }

    // If fallback image already tried or unavailable, reveal styled visual banner
    e.currentTarget.style.display = "none";
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const fallbackBox = parent.querySelector(".ecom-card-fallback-visual");
      if (fallbackBox) {
        fallbackBox.style.display = "flex";
      }
    }
  }

  // Department icon badge
  function getCategoryThemedBadge(catName = "") {
    const n = (catName || "").toLowerCase();
    if (n.includes("elect") || n.includes("tech") || n.includes("gadget") || n.includes("phone")) {
      return {
        icon: <Smartphone size={14} />,
        label: "Electronics",
        color: "#2563eb",
      };
    }
    if (n.includes("cloth") || n.includes("apparel") || n.includes("fashion") || n.includes("wear")) {
      return {
        icon: <Shirt size={14} />,
        label: "Fashion & Apparel",
        color: "#7c3aed",
      };
    }
    if (n.includes("access") || n.includes("jewel") || n.includes("watch")) {
      return {
        icon: <Watch size={14} />,
        label: "Accessories",
        color: "#db2777",
      };
    }
    if (n.includes("food") || n.includes("grocer") || n.includes("snack") || n.includes("bev")) {
      return {
        icon: <Utensils size={14} />,
        label: "Food & Grocery",
        color: "#d97706",
      };
    }
    if (n.includes("stat") || n.includes("book") || n.includes("pen") || n.includes("office")) {
      return {
        icon: <BookOpen size={14} />,
        label: "Stationery & Office",
        color: "#059669",
      };
    }
    if (n.includes("home") || n.includes("furn") || n.includes("living") || n.includes("decor")) {
      return {
        icon: <Home size={14} />,
        label: "Home & Living",
        color: "#0891b2",
      };
    }
    return {
      icon: <Tags size={14} />,
      label: "Department",
      color: "#4f46e5",
    };
  }

  // Category short description helper
  function getCategoryDescription(cat) {
    if (cat.description && cat.description.trim() !== "") {
      return cat.description;
    }
    const n = (cat.name || "").toLowerCase().trim();
    for (const [key, desc] of Object.entries(CATEGORY_DEFAULT_DESCRIPTIONS)) {
      if (n.includes(key)) return desc;
    }
    return `Discover our curated collection of verified authentic ${cat.name} products with guaranteed stock and quality.`;
  }

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  // Calculate metrics
  const categoriesWithProducts = categories.filter((c) => getProductCount(c.name) > 0).length;
  const emptyCategories = categories.length - categoriesWithProducts;

  // Filtered categories for Customer Storefront view
  const userFilteredCategories = categories.filter((cat) => {
    const q = userSearchQuery.toLowerCase().trim();
    const count = getProductCount(cat.name);

    if (userInStockOnly && count === 0) {
      return false;
    }

    if (!q) return true;
    const desc = getCategoryDescription(cat).toLowerCase();
    const name = (cat.name || "").toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  // =====================================================
  // RENDER USER VIEW (PREMIUM E-COMMERCE CATEGORIES)
  // =====================================================
  if (!isAdmin) {
    return (
      <div className="ecom-categories-container">
        {/* HEADER SECTION */}
        <header className="ecom-categories-header">
          <div className="ecom-header-badge">
            <Sparkles size={14} />
            <span>Curated Catalog</span>
          </div>
          <h1 className="ecom-header-title">Shop by Category</h1>
          <p className="ecom-header-subtitle">
            Discover products across all your favorite categories. Browse verified inventory with instant availability and fast checkout.
          </p>

          {/* TOOLBAR: SEARCH & STATS */}
          <div className="ecom-header-toolbar">
            <div className="ecom-search-wrapper">
              <Search size={18} className="ecom-search-icon" />
              <input
                type="text"
                placeholder="Search categories (e.g., Electronics, Clothing)..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="ecom-search-input"
              />
              {userSearchQuery && (
                <button
                  className="ecom-search-clear"
                  onClick={() => setUserSearchQuery("")}
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="ecom-header-stats-group">
              <span className="ecom-stat-chip">
                <Boxes size={15} className="text-blue" />
                <span>
                  <strong>{categories.length}</strong> Departments
                </span>
              </span>
              <span className="ecom-stat-chip">
                <Package size={15} className="text-emerald" />
                <span>
                  <strong>{products.length}</strong> Products
                </span>
              </span>
              <button
                className={`ecom-filter-toggle-btn ${userInStockOnly ? "active" : ""}`}
                onClick={() => setUserInStockOnly((prev) => !prev)}
                title="Toggle In-Stock Only Categories"
              >
                <CheckCircle2 size={15} />
                <span>In Stock Only</span>
              </button>
            </div>
          </div>
        </header>

        {/* QUICK CATEGORY NAVIGATION STRIP */}
        <div className="ecom-quick-nav-strip">
          <button
            className={`ecom-quick-nav-pill ${!userSearchQuery && !userInStockOnly ? "active" : ""}`}
            onClick={() => {
              setUserSearchQuery("");
              setUserInStockOnly(false);
            }}
          >
            <span>All Departments</span>
            <span className="pill-badge-count">{categories.length}</span>
          </button>
          {categories.map((c) => {
            const count = getProductCount(c.name);
            const isMatch =
              userSearchQuery &&
              (c.name || "").toLowerCase().includes(userSearchQuery.toLowerCase());
            return (
              <button
                key={c.id || c.name}
                className={`ecom-quick-nav-pill ${isMatch ? "active" : ""}`}
                onClick={() => handleSelectUserCategory(c.name)}
                title={`Browse ${c.name} (${count} products)`}
              >
                <span>{c.name}</span>
                <span className="pill-badge-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* LOADING SKELETON CARDS */}
        {loading && (
          <div className="ecom-skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="ecom-skeleton-card">
                <div className="ecom-skeleton-img"></div>
                <div className="ecom-skeleton-body">
                  <div className="ecom-skeleton-bar title"></div>
                  <div className="ecom-skeleton-bar desc-1"></div>
                  <div className="ecom-skeleton-bar desc-2"></div>
                  <div className="ecom-skeleton-bar btn"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="ecom-error-banner">
            <div className="ecom-error-icon-box">
              <AlertTriangle size={28} />
            </div>
            <h3>Unable to Load Categories</h3>
            <p>{error}</p>
            <button className="ecom-btn-retry" onClick={loadData}>
              <RefreshCw size={15} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && userFilteredCategories.length === 0 && (
          <div className="ecom-empty-categories-box">
            <div className="ecom-empty-icon-wrap">
              <Tags size={32} />
            </div>
            <h3>No Categories Found</h3>
            <p>
              {userSearchQuery
                ? `No departmental categories matched "${userSearchQuery}".`
                : "There are currently no categories available in the store catalog."}
            </p>
            {userSearchQuery ? (
              <button
                className="ecom-btn-reset-search"
                onClick={() => {
                  setUserSearchQuery("");
                  setUserInStockOnly(false);
                }}
              >
                Clear Filters
              </button>
            ) : (
              <button className="ecom-btn-reset-search" onClick={loadData}>
                <RefreshCw size={15} />
                <span>Refresh Catalog</span>
              </button>
            )}
          </div>
        )}

        {/* CATEGORIES GRID */}
        {!loading && !error && userFilteredCategories.length > 0 && (
          <div className="ecom-categories-grid">
            {userFilteredCategories.map((cat) => {
              const count = getProductCount(cat.name);
              const totalStock = products
                .filter(
                  (p) => (p.category || "").toLowerCase() === (cat.name || "").toLowerCase()
                )
                .reduce((sum, p) => sum + Number(p.stock || 0), 0);
              const displayImg = getCategoryDisplayImage(cat.name);
              const themed = getCategoryThemedBadge(cat.name);
              const description = getCategoryDescription(cat);
              const isEmpty = count === 0;

              return (
                <div
                  key={cat.id || cat.name}
                  className={`ecom-category-card ${isEmpty ? "card-is-empty" : ""}`}
                  onClick={() => handleSelectUserCategory(cat.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectUserCategory(cat.name);
                    }
                  }}
                >
                  {/* CARD IMAGE BOX */}
                  <div className="ecom-card-image-box">
                    <img
                      src={displayImg}
                      alt={cat.name}
                      className="ecom-card-img"
                      loading="lazy"
                      onError={(e) => handleImageError(e, cat.name)}
                    />

                    {/* Gradient scrim overlay */}
                    <div className="ecom-card-scrim"></div>

                    {/* Department badge pill */}
                    <div className="ecom-card-department-pill">
                      <span style={{ color: themed.color, display: "flex", alignItems: "center" }}>
                        {themed.icon}
                      </span>
                      <span>{cat.name}</span>
                    </div>

                    {/* Product count badge */}
                    <div
                      className={`ecom-card-count-badge ${
                        count > 0 ? "has-stock" : "empty-stock"
                      }`}
                    >
                      {count > 0 ? (
                        <span>
                          {count} {count === 1 ? "Product" : "Products"}
                        </span>
                      ) : (
                        <span>0 Products</span>
                      )}
                    </div>

                    {/* Fallback visual banner when image fails */}
                    <div
                      className="ecom-card-fallback-visual"
                      style={{ display: "none" }}
                    >
                      <div className="ecom-fallback-icon-wrap">{themed.icon}</div>
                      <span className="ecom-fallback-category-name">{cat.name}</span>
                    </div>
                  </div>

                  {/* CARD CONTENT BODY */}
                  <div className="ecom-card-body">
                    <h3 className="ecom-card-category-name">{cat.name}</h3>
                    <p className="ecom-card-description">{description}</p>

                    <div className="ecom-card-meta-row">
                      <div
                        className={`ecom-stock-indicator ${
                          count > 0 ? "in-stock" : "empty"
                        }`}
                      >
                        <span className="ecom-stock-dot"></span>
                        <span>
                          {count > 0
                            ? `In Stock • ${totalStock} units`
                            : "Catalog updating soon"}
                        </span>
                      </div>
                      <span className="ecom-card-department-tag">{themed.label}</span>
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="ecom-card-action">
                      <button
                        className="ecom-btn-explore"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUserCategory(cat.name);
                        }}
                      >
                        <span>{count > 0 ? "Explore Category" : "View Collection"}</span>
                        <ArrowRight size={16} className="ecom-explore-arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* E-COMMERCE TRUST HIGHLIGHTS BAR */}
        <div className="ecom-trust-bar">
          <div className="ecom-trust-item">
            <div className="ecom-trust-icon-box">
              <ShieldCheck size={22} />
            </div>
            <div className="ecom-trust-text">
              <strong>100% Genuine Inventory</strong>
              <span>Direct verified retail catalog with full authenticity warranty</span>
            </div>
          </div>

          <div className="ecom-trust-item">
            <div className="ecom-trust-icon-box">
              <Truck size={22} />
            </div>
            <div className="ecom-trust-text">
              <strong>Instant Warehouse Dispatch</strong>
              <span>All catalog products are in-stock and dispatched within 24 hours</span>
            </div>
          </div>

          <div className="ecom-trust-item">
            <div className="ecom-trust-icon-box">
              <RotateCcw size={22} />
            </div>
            <div className="ecom-trust-text">
              <strong>Easy 7-Day Returns</strong>
              <span>Simple and hassle-free returns on all standard retail orders</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <Footer onNavigate={onNavigate} categories={categories} />
      </div>
    );
  }

  // =====================================================
  // RENDER ADMIN VIEW (CATEGORY MANAGEMENT)
  // =====================================================
  const getCategoryThemedIcon = (catName = "") => {
    const n = (catName || "").toLowerCase();
    if (n.includes("elect") || n.includes("tech") || n.includes("gadget") || n.includes("phone")) {
      return {
        icon: <Smartphone size={20} />,
        bg: "rgba(37, 99, 235, 0.1)",
        text: "#1d4ed8",
        border: "rgba(37, 99, 235, 0.25)",
      };
    }
    if (n.includes("cloth") || n.includes("apparel") || n.includes("fashion") || n.includes("wear")) {
      return {
        icon: <Shirt size={20} />,
        bg: "rgba(124, 58, 237, 0.1)",
        text: "#6d28d9",
        border: "rgba(124, 58, 237, 0.25)",
      };
    }
    if (n.includes("home") || n.includes("furn") || n.includes("living") || n.includes("decor")) {
      return {
        icon: <Home size={20} />,
        bg: "rgba(5, 150, 105, 0.1)",
        text: "#047857",
        border: "rgba(5, 150, 105, 0.25)",
      };
    }
    if (n.includes("food") || n.includes("grocer") || n.includes("snack") || n.includes("bev")) {
      return {
        icon: <Utensils size={20} />,
        bg: "rgba(217, 119, 6, 0.1)",
        text: "#b45309",
        border: "rgba(217, 119, 6, 0.25)",
      };
    }
    if (n.includes("access") || n.includes("jewel") || n.includes("watch")) {
      return {
        icon: <Watch size={20} />,
        bg: "rgba(219, 39, 119, 0.1)",
        text: "#be185d",
        border: "rgba(219, 39, 119, 0.25)",
      };
    }
    return {
      icon: <Tags size={20} />,
      bg: "rgba(79, 70, 229, 0.1)",
      text: "#4338ca",
      border: "rgba(79, 70, 229, 0.25)",
    };
  };

  return (
    <div className="admin-categories-page">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="cart-feedback-toast">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODERN ADMIN HEADER */}
      <div className="admin-page-header">
        <div className="admin-header-main">
          <div className="admin-section-eyebrow">
            <Tags size={13} className="text-blue" />
            <span>Catalog Taxonomy &amp; Department Classification</span>
          </div>
          <h2>Category Management</h2>
          <p>Organize and manage product categories.</p>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={loadData}
            className="btn-admin-refresh"
            title="Sync Categories"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button className="btn-add-primary" onClick={handleOpenAdd}>
            <FolderPlus size={18} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY KPI METRICS */}
      <div className="admin-kpi-strip">
        <div className="admin-mini-kpi kpi-blue">
          <div className="kpi-icon-wrap bg-blue-subtle">
            <Tags size={22} className="text-blue" />
          </div>
          <div className="kpi-content">
            <span className="mini-label">Total Categories</span>
            <strong>{categories.length} Categories</strong>
            <span className="kpi-meta-tag tag-blue">Catalog Departments</span>
          </div>
        </div>

        <div className="admin-mini-kpi kpi-emerald">
          <div className="kpi-icon-wrap bg-emerald-subtle">
            <Package size={22} className="text-emerald" />
          </div>
          <div className="kpi-content">
            <span className="mini-label">Categories Containing Products</span>
            <strong className="text-emerald">{categoriesWithProducts} Categories</strong>
            <span className="kpi-meta-tag tag-emerald">With Products</span>
          </div>
        </div>

        <div className="admin-mini-kpi kpi-amber">
          <div className="kpi-icon-wrap bg-amber-subtle">
            <Boxes size={22} className="text-amber" />
          </div>
          <div className="kpi-content">
            <span className="mini-label">Empty Categories</span>
            <strong className="text-amber">{emptyCategories} Categories</strong>
            <span className="kpi-meta-tag tag-amber">No Products Yet</span>
          </div>
        </div>

        <div className="admin-mini-kpi kpi-indigo">
          <div className="kpi-icon-wrap bg-indigo-subtle">
            <Layers size={22} className="text-indigo" />
          </div>
          <div className="kpi-content">
            <span className="mini-label">Total Classified Items</span>
            <strong>{products.length} Products</strong>
            <span className="kpi-meta-tag tag-indigo">Across All Categories</span>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="admin-table-controls">
        <div className="search-box-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search category name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="clear-btn" title="Clear Search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="controls-right-actions">
          <span className="filter-results-counter">
            Showing <strong>{filteredCategories.length}</strong> of {categories.length} categories
          </span>

          <div className="view-mode-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* LOADING & ERROR */}
      {loading && (
        <div className="admin-loading-card">
          <div className="spinner"></div>
          <p>Loading category departments...</p>
        </div>
      )}

      {error && (
        <div className="admin-error-box">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* CONTENT: TABLE VIEW */}
      {!loading && !error && viewMode === "table" && (
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Department Category</th>
                <th>Description</th>
                <th>Assigned SKUs</th>
                <th>Total Stock Units</th>
                <th>Inventory Valuation</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => {
                const count = getProductCount(cat.name);
                const assignedProds = products.filter(
                  (p) => (p.category || "").toLowerCase() === (cat.name || "").toLowerCase()
                );
                const totalStock = assignedProds.reduce((sum, p) => sum + Number(p.stock || 0), 0);
                const valuation = assignedProds.reduce(
                  (sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0),
                  0
                );
                const themed = getCategoryThemedIcon(cat.name);

                return (
                  <tr key={cat.id} className="admin-table-row">
                    <td>
                      <div className="cat-table-name">
                        <div
                          className="cat-icon-avatar"
                          style={{
                            backgroundColor: themed.bg,
                            color: themed.text,
                            border: `1px solid ${themed.border}`,
                          }}
                        >
                          {themed.icon}
                        </div>
                        <div className="cat-cell-meta">
                          <strong className="cat-cell-title">{cat.name}</strong>
                          <span className="cell-id">ID: #{cat.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cell-desc">
                        {cat.description || "Standard retail inventory classification."}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-count-pill ${count > 0 ? "has-items" : "no-items"}`}>
                        {count} Products
                      </span>
                    </td>
                    <td>
                      <strong className="table-stock-val">{totalStock.toLocaleString()} units</strong>
                    </td>
                    <td>
                      <strong className="table-price-val text-emerald">
                        ₹{valuation.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge-stock ${count > 0 ? "in" : "low"}`}>
                        {count > 0 ? (
                          <>
                            <CheckCircle2 size={12} className="inline mr-1" /> Active ({count})
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="inline mr-1" /> Empty
                          </>
                        )}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          className="btn-action-view"
                          onClick={() => setViewingCategory(cat)}
                          title="View Category Details & Products"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-action-edit"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => setDeletingCategory(cat)}
                          title="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="7" className="table-empty-row">
                    <div className="empty-catalog-box">
                      <Tags size={38} className="text-slate-muted" />
                      <h4>No categories found</h4>
                      <p>No department categories match your search query.</p>
                      <button
                        className="btn-reset-filters"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTENT: GRID CARDS VIEW */}
      {!loading && !error && viewMode === "grid" && (
        <div className="admin-categories-cards-grid">
          {filteredCategories.map((cat) => {
            const count = getProductCount(cat.name);
            const assignedProds = products.filter(
              (p) => (p.category || "").toLowerCase() === (cat.name || "").toLowerCase()
            );
            const totalStock = assignedProds.reduce((sum, p) => sum + Number(p.stock || 0), 0);
            const valuation = assignedProds.reduce(
              (sum, p) => sum + Number(p.stock || 0) * Number(p.price || 0),
              0
            );
            const themed = getCategoryThemedIcon(cat.name);
            const sharePercent = products.length > 0 ? Math.round((count / products.length) * 100) : 0;

            return (
              <div key={cat.id} className="admin-category-card">
                <div className="admin-cat-card-header">
                  <div className="admin-cat-image-thumb-box">
                    <img
                      src={getCategoryDisplayImage(cat.name)}
                      alt={cat.name}
                      className="admin-cat-thumb-img"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div
                      className="cat-icon-badge-overlay"
                      style={{
                        backgroundColor: themed.bg,
                        color: themed.text,
                        border: `1px solid ${themed.border}`,
                      }}
                    >
                      {themed.icon}
                    </div>
                  </div>
                  <span className={`badge-stock ${count > 0 ? "in" : "low"}`}>
                    {count > 0 ? "Active" : "Empty"}
                  </span>
                </div>

                <h3 className="admin-cat-title">{cat.name}</h3>
                <p className="admin-cat-desc">
                  {cat.description || "Standard retail inventory classification."}
                </p>

                <div className="admin-cat-stats-row">
                  <div className="admin-cat-stat">
                    <span className="stat-label">Assigned Items</span>
                    <strong>{count} Products</strong>
                  </div>
                  <div className="admin-cat-stat">
                    <span className="stat-label">Total Stock</span>
                    <strong>{totalStock.toLocaleString()} Units</strong>
                  </div>
                  <div className="admin-cat-stat col-span-2">
                    <span className="stat-label">Department Valuation</span>
                    <strong className="text-emerald">₹{valuation.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="department-share-bar">
                  <div className="share-labels">
                    <span>Catalog Share</span>
                    <span>{sharePercent}%</span>
                  </div>
                  <div className="share-track">
                    <div
                      className="share-fill"
                      style={{
                        width: `${Math.max(4, sharePercent)}%`,
                        backgroundColor: themed.text,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="admin-cat-card-actions">
                  <button
                    className="btn-card-action view"
                    onClick={() => setViewingCategory(cat)}
                    title="View Assigned Products"
                  >
                    <Eye size={14} />
                    <span>View ({count})</span>
                  </button>
                  <button
                    className="btn-card-action edit"
                    onClick={() => handleOpenEdit(cat)}
                    title="Edit Category"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn-card-action delete"
                    onClick={() => setDeletingCategory(cat)}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="empty-catalog-box col-span-full">
              <Tags size={38} className="text-slate-muted" />
              <h4>No categories found</h4>
              <p>No department categories match your search query.</p>
              <button
                className="btn-reset-filters"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}
      {isModalOpen && (
        <div className="modal-backdrop-overlay" onClick={handleCloseModal}>
          <div
            className="admin-modal-card admin-category-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-line">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge bg-blue-subtle">
                  <FolderPlus size={18} className="text-blue" />
                </div>
                <div>
                  <h3>{editingCategory ? "Edit Category Details" : "Add New Category"}</h3>
                  <p className="modal-sub-desc">
                    {editingCategory
                      ? "Update department classification name and descriptive summary."
                      : "Create a new catalog classification to organize inventory SKUs."}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal} title="Close">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-error-banner">
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="form-group-item">
                <label>Category Name <span className="text-red">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Footwear & Accessories"
                  required
                />
              </div>

              <div className="form-group-item">
                <label>Department Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief summary of items classified under this departmental category..."
                ></textarea>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <span className="btn-loading-flex">
                      <RefreshCw size={14} className="animate-spin mr-1" /> Saving Category...
                    </span>
                  ) : editingCategory ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW CATEGORY DETAILS MODAL
      ====================================================== */}
      {viewingCategory && (
        <div
          className="modal-backdrop-overlay"
          onClick={() => setViewingCategory(null)}
        >
          <div
            className="admin-modal-card admin-category-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-line">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge bg-blue-subtle">
                  <Tags size={18} className="text-blue" />
                </div>
                <div>
                  <h3>Category: {viewingCategory.name}</h3>
                  <p className="modal-sub-desc">Assigned Catalog Items &amp; Department Audit</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setViewingCategory(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="category-view-content">
              <div className="category-view-desc-card">
                <span className="desc-title">Description</span>
                <p>
                  {viewingCategory.description && viewingCategory.description.trim() !== ""
                    ? viewingCategory.description
                    : "Standard retail inventory classification. No additional description provided."}
                </p>
              </div>

              <div className="category-kpi-summary-row">
                <div className="meta-pill">
                  <Package size={16} className="text-blue" />
                  <span>Assigned Products:</span>
                  <strong>{getProductCount(viewingCategory.name)} Products</strong>
                </div>
                <div className="meta-pill">
                  <Layers size={16} className="text-indigo" />
                  <span>Total Stock Units:</span>
                  <strong>
                    {products
                      .filter(
                        (p) =>
                          (p.category || "").toLowerCase() ===
                          (viewingCategory.name || "").toLowerCase()
                      )
                      .reduce((sum, p) => sum + Number(p.stock || 0), 0)}{" "}
                    Units
                  </strong>
                </div>
                <div className="meta-pill">
                  <IndianRupee size={16} className="text-emerald" />
                  <span>Department Valuation:</span>
                  <strong className="text-emerald">
                    ₹
                    {products
                      .filter(
                        (p) =>
                          (p.category || "").toLowerCase() ===
                          (viewingCategory.name || "").toLowerCase()
                      )
                      .reduce(
                        (sum, p) =>
                          sum + Number(p.stock || 0) * Number(p.price || 0),
                        0
                      )
                      .toLocaleString()}
                  </strong>
                </div>
              </div>

              <h4 className="assigned-products-heading">
                Associated Products ({getProductCount(viewingCategory.name)})
              </h4>

              <div className="assigned-products-list">
                {products
                  .filter(
                    (p) =>
                      (p.category || "").toLowerCase() ===
                      (viewingCategory.name || "").toLowerCase()
                  )
                  .map((prod) => {
                    const stk = Number(prod.stock || 0);
                    const isOut = stk === 0;
                    const isLow = stk > 0 && stk <= 10;

                    return (
                      <div key={prod.id} className="assigned-product-item">
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          className="assigned-prod-thumb"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/80x80?text=${encodeURIComponent(
                              prod.name || "Product"
                            )}`;
                          }}
                        />
                        <div className="assigned-prod-info">
                          <strong className="assigned-prod-name">{prod.name}</strong>
                          <span className="assigned-prod-sku">SKU #{prod.id}</span>
                        </div>
                        <div className="assigned-prod-price">
                          <strong>₹{Number(prod.price || 0).toLocaleString()}</strong>
                        </div>
                        <div className="assigned-prod-stock">
                          <span
                            className={`badge-stock ${
                              isOut ? "out" : isLow ? "low" : "in"
                            }`}
                          >
                            {isOut
                              ? "Out of Stock"
                              : isLow
                              ? `Low (${stk})`
                              : `${stk} in stock`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {products.filter(
                  (p) =>
                    (p.category || "").toLowerCase() ===
                    (viewingCategory.name || "").toLowerCase()
                ).length === 0 && (
                  <div className="empty-assigned-placeholder">
                    <Package size={28} className="text-slate-muted" />
                    <p>No products currently assigned to this department category.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setViewingCategory(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-confirm"
                  onClick={() => {
                    const cat = viewingCategory;
                    setViewingCategory(null);
                    handleOpenEdit(cat);
                  }}
                >
                  <Edit2 size={15} />
                  <span>Edit Category</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}
      {deletingCategory && (() => {
        const count = getProductCount(deletingCategory.name);
        const hasProducts = count > 0;
        return (
          <div
            className="modal-backdrop-overlay"
            onClick={() => setDeletingCategory(null)}
          >
            <div
              className="confirm-dialog-card admin-category-delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`confirm-icon-box ${
                  hasProducts ? "bg-amber-subtle" : "bg-red-subtle"
                }`}
              >
                {hasProducts ? (
                  <AlertTriangle size={24} className="text-amber" />
                ) : (
                  <Trash2 size={24} className="text-red" />
                )}
              </div>
              <h3>
                {hasProducts ? "Cannot Delete Category" : "Delete Category"}
              </h3>

              {hasProducts ? (
                <div className="delete-prevention-alert">
                  <p>
                    Category <strong>"{deletingCategory.name}"</strong> cannot be deleted because it is currently assigned to{" "}
                    <strong>{count} product(s)</strong>.
                  </p>
                  <div className="prevention-tip-box text-sm mb-4">
                    <AlertTriangle size={15} className="text-amber flex-shrink-0" />
                    <span>
                      To prevent orphaned products and catalog inconsistency, please reassign or remove these products first.
                    </span>
                  </div>
                </div>
              ) : (
                <p>
                  Are you sure you want to delete category{" "}
                  <strong>"{deletingCategory.name}"</strong>? This category has 0 associated products and can be safely removed.
                </p>
              )}

              <div className="confirm-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setDeletingCategory(null)}
                >
                  {hasProducts ? "Close" : "Cancel"}
                </button>
                {hasProducts ? (
                  <button
                    className="btn-confirm"
                    onClick={() => {
                      const cat = deletingCategory;
                      setDeletingCategory(null);
                      setViewingCategory(cat);
                    }}
                  >
                    <Eye size={15} />
                    <span>View {count} Product(s)</span>
                  </button>
                ) : (
                  <button
                    className="btn-delete-confirm"
                    onClick={confirmDelete}
                  >
                    Yes, Delete Category
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Categories;
