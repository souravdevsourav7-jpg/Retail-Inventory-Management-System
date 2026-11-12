import "./Admin.css";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  SlidersHorizontal,
  ShoppingCart,
  Zap,
  Heart,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  IndianRupee,
  Layers,
  ArrowUpDown,
  Upload,
  Image as ImageIcon,
  List,
  LayoutGrid,
} from "lucide-react";
import ProductDetailModal from "../components/ProductDetailModal";
import Footer from "../components/Footer";

function Products({ onNavigate, initialSearch = "" }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem("selectedCategory") || "all";
  });
  const [maxPrice, setMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'in' | 'low' | 'out'
  const [sortBy, setSortBy] = useState("featured");

  // Sync initialSearch if prop changes
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Sync selectedCategory from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("selectedCategory");
    if (saved) {
      setSelectedCategory(saved);
    }
  }, []);

  // User Interactive Modals
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("retail_wishlist") || "[]");
    } catch {
      return [];
    }
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState("");

  // Admin View & Modal state
  const [adminViewMode, setAdminViewMode] = useState("table"); // 'table' | 'grid'
  const [viewingProduct, setViewingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Admin Delete confirmation
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Admin Checkbox selection & Pagination
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [prodRes, catRes] = await Promise.all([
  axios.get("/api/products", authConfig),
  axios.get("/api/categories", authConfig),
    ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError(err.response?.data?.message || "Failed to load product catalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => { setToastMessage(""); }, 3200);
  }

  // ===============================
  // USER: WISHLIST TOGGLE
  // ===============================
  function toggleWishlist(product) {
    const exists = wishlist.some((item) => item.id === product.id);
    let updated;
    if (exists) {
      updated = wishlist.filter((item) => item.id !== product.id);
      showToast(`Removed "${product.name}" from your wishlist.`);
    } else {
      updated = [...wishlist, product];
      showToast(`❤️ Added "${product.name}" to your wishlist!`);
    }
    setWishlist(updated);
    try {
      localStorage.setItem("retail_wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch {
      // ignore
    }
  }

  // ===============================
  // USER: ADD TO CART
  // ===============================
  function addToCart(product, quantityToAdd = 1) {
    const productStock = Number(product.stock !== undefined ? product.stock : 0);

    if (productStock <= 0) {
      showToast(`Sorry, "${product.name}" is currently out of stock!`);
      return false;
    }

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = existingCart.findIndex(
      (item) => Number(item.product_id || item.id) === Number(product.id)
    );

    let updatedCart;

    if (existingIndex > -1) {
      const currentQty = Number(existingCart[existingIndex].quantity || 1);
      const newQty = currentQty + quantityToAdd;
      if (newQty > productStock) {
        showToast(
          `Only ${productStock} unit(s) of "${product.name}" are available in stock.`
        );
        return false;
      }

      updatedCart = existingCart.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              quantity: newQty,
              stock: productStock,
            }
          : item
      );
    } else {
      if (quantityToAdd > productStock) {
        showToast(
          `Only ${productStock} unit(s) of "${product.name}" are available in stock.`
        );
        return false;
      }

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
          quantity: quantityToAdd,
        },
      ];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    showToast(`🛒 Added ${quantityToAdd} unit(s) of "${product.name}" to cart!`);
    return true;
  }

  function handleBuyNow(product, qty = 1) {
    const added = addToCart(product, qty);
    if (added && onNavigate) {
      onNavigate("checkout");
    }
  }

  function getProductImage(product) {
    if (product.image && product.image.trim() !== "") {
      if (product.image.startsWith("http")) return product.image;
      return `${product.image}`;
    }
    return `https://placehold.co/500x400?text=${encodeURIComponent(
      product.name || "Product"
    )}`;
  }

  // ===============================
  // ADMIN FORM ACTIONS
  // ===============================
  function openAddModal() {
    setEditingId(null);
    setName("");
    setCategory(categories[0]?.name || "");
    setPrice("");
    setStock("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(prod) {
    setEditingId(prod.id);
    setName(prod.name || "");
    setCategory(prod.category || "");
    setPrice(String(prod.price || 0));
    setStock(String(prod.stock || 0));
    setDescription(prod.description || "");
    setImageFile(null);
    setImagePreview(getProductImage(prod));
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError("");
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setFormError("Choose a JPG, PNG, WEBP, or GIF image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Image size must be 2MB or smaller.");
      e.target.value = "";
      return;
    }

    setFormError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (!price || Number(price) < 0) {
      setFormError("Valid product price is required.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category.trim());
      formData.append("price", price);
      formData.append("stock", stock || "0");
      formData.append("description", description.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await axios.put(
          `/api/products/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showToast("Product updated successfully!");
      } else {
        await axios.post(
          "/api/products",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showToast("Product created successfully!");
      }

      closeModal();
      loadData();
    } catch (err) {
      console.error("PRODUCT SAVE ERROR:", err);
      setFormError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function confirmDeleteProduct() {
    if (!deletingProduct) return;
    try {
      await axios.delete(
        `/api/products/${deletingProduct.id}`,
        authConfig
      );
      showToast(`Product "${deletingProduct.name}" deleted.`);
      setDeletingProduct(null);
      loadData();
    } catch (err) {
      console.error("DELETE PRODUCT ERROR:", err);
      showToast(err.response?.data?.message || "Failed to delete product.");
      setDeletingProduct(null);
    }
  }

  // ===============================
  // FILTERING & SORTING LOGIC
  // ===============================
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === "all" ||
      (p.category &&
        p.category.toLowerCase() === selectedCategory.toLowerCase());

    const stockVal = Number(p.stock !== undefined ? p.stock : 0);
    let matchStock = true;
    if (stockFilter === "in") matchStock = stockVal > 10;
    else if (stockFilter === "low") matchStock = stockVal > 0 && stockVal <= 10;
    else if (stockFilter === "out") matchStock = stockVal <= 0;

    const priceVal = Number(p.price || 0);
    const matchPrice = maxPrice ? priceVal <= Number(maxPrice) : true;

    return matchSearch && matchCategory && matchStock && matchPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "stock-low") return Number(a.stock || 0) - Number(b.stock || 0);
    return 0; // featured default
  });

  // Admin KPI metrics
  const totalStockCount = products.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0
  );
  const lowStockCount = products.filter(
    (p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 10
  ).length;
  const outOfStockCount = products.filter(
    (p) => Number(p.stock || 0) <= 0
  ).length;
  const totalValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
    0
  );

  // =====================================================
  // RENDER ADMIN VIEW
  // =====================================================
  if (isAdmin) {
    return (
      <div className="admin-products-page">
        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div className="cart-feedback-toast">
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="admin-page-header">
          <div className="admin-header-main">
            <div className="admin-section-eyebrow">
              <Package size={13} className="text-blue" />
              <span>Catalog Taxonomy &amp; SKU Management</span>
            </div>
            
            <h2>Product Catalog &amp; Inventory Management</h2>
            <p>Manage your product catalog, add new products, adjust pricing, and monitor stock availability.</p>
          </div>
          <div className="admin-header-actions">
            <button
              onClick={loadData}
              className="btn-admin-refresh"
              title="Reload Catalog"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button className="btn-add-primary" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="admin-kpi-strip">
          <div className="admin-mini-kpi kpi-blue">
            <div className="kpi-icon-wrap bg-blue-subtle">
              <Package size={22} className="text-blue" />
            </div>
            <div className="kpi-content">
              <span className="mini-label">Total SKUs</span>
              <strong>{products.length} Products</strong>
              <span className="kpi-meta-tag tag-blue">Active Catalog</span>
            </div>
          </div>

          <div className="admin-mini-kpi kpi-indigo">
            <div className="kpi-icon-wrap bg-indigo-subtle">
              <Layers size={22} className="text-indigo" />
            </div>
            <div className="kpi-content">
              <span className="mini-label">Total Stock Units</span>
              <strong>{totalStockCount.toLocaleString()} Units</strong>
              <span className="kpi-meta-tag tag-indigo">Warehouse Volume</span>
            </div>
          </div>

          <div className="admin-mini-kpi kpi-amber">
            <div className="kpi-icon-wrap bg-amber-subtle">
              <AlertTriangle size={22} className="text-amber" />
            </div>
            <div className="kpi-content">
              <span className="mini-label">Low / Out of Stock Items</span>
              <strong className="text-amber">{lowStockCount + outOfStockCount} Items</strong>
              <span className="kpi-meta-tag tag-amber">Need Attention</span>
            </div>
          </div>

          <div className="admin-mini-kpi kpi-emerald">
            <div className="kpi-icon-wrap bg-emerald-subtle">
              <IndianRupee size={22} className="text-emerald" />
            </div>
            <div className="kpi-content">
              <span className="mini-label">Catalog Value</span>
              <strong className="text-emerald">₹{totalValue.toLocaleString()}</strong>
              <span className="kpi-meta-tag tag-emerald">Asset Valuation</span>
            </div>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="admin-table-controls">
          <div className="search-box-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search product name, category, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="clear-btn" title="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-dropdowns-group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock (&gt;10)</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock (0)</option>
            </select>

            <button
              onClick={loadData}
              className="btn-toolbar-refresh"
              title="Refresh Products Catalog"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {(search || selectedCategory !== "all" || stockFilter !== "all") && (
              <button
                className="btn-reset-filters"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setStockFilter("all");
                }}
              >
                Reset
              </button>
            )}

            <div className="view-mode-toggle-group">
              <button
                className={`view-toggle-btn ${adminViewMode === "table" ? "active" : ""}`}
                onClick={() => setAdminViewMode("table")}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                className={`view-toggle-btn ${adminViewMode === "grid" ? "active" : ""}`}
                onClick={() => setAdminViewMode("grid")}
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
            <p>Loading catalog items...</p>
          </div>
        )}

        {error && (
          <div className="admin-error-box">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* CONTENT: TABLE VIEW */}
        {!loading && !error && adminViewMode === "table" && (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p) => {
                  const stk = Number(p.stock || 0);
                  const isOut = stk <= 0;
                  const isLow = stk > 0 && stk <= 10;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="product-table-cell">
                          <img
                            src={getProductImage(p)}
                            alt={p.name}
                            className="product-table-thumb"
                            onError={(e) => {
                              e.currentTarget.src = `https://placehold.co/100x100?text=${encodeURIComponent(
                                p.name
                              )}`;
                            }}
                          />
                          <div>
                            <strong className="product-cell-name">{p.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-cat-tag">{p.category || "General"}</span>
                      </td>
                      <td>
                        <span className="table-sku-badge">SKU-#{p.id}</span>
                      </td>
                      <td>
                        <strong className="table-price-val">₹{Number(p.price || 0).toLocaleString()}</strong>
                      </td>
                      <td>
                        <strong className={isOut ? "text-red" : isLow ? "text-amber" : "text-emerald"}>
                          {stk} units
                        </strong>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge-stock out">
                            <X size={12} className="inline mr-1" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="badge-stock low">
                            <AlertTriangle size={12} className="inline mr-1" /> Low ({stk})
                          </span>
                        ) : (
                          <span className="badge-stock in">
                            <CheckCircle2 size={12} className="inline mr-1" /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="table-actions-group">
                          <button
                            className="btn-action-view"
                            onClick={() => setViewingProduct(p)}
                            title="View Product Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-action-edit"
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-action-delete"
                            onClick={() => setDeletingProduct(p)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="table-empty-row">
                      <div className="empty-catalog-box">
                        <Package size={38} className="text-slate-muted" />
                        <h4>No products found</h4>
                        <p>No products match your search or filter criteria.</p>
                        <button
                          className="btn-reset-filters"
                          onClick={() => {
                            setSearch("");
                            setSelectedCategory("all");
                            setStockFilter("all");
                          }}
                        >
                          Reset Filters
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
        {!loading && !error && adminViewMode === "grid" && (
          <div className="admin-products-grid">
            {sortedProducts.map((p) => {
              const stk = Number(p.stock || 0);
              const isOut = stk <= 0;
              const isLow = stk > 0 && stk <= 10;

              return (
                <div key={p.id} className="admin-product-card">
                  <div className="admin-card-image-wrap">
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="admin-card-img"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/400x300?text=${encodeURIComponent(
                          p.name
                        )}`;
                      }}
                    />
                    <div className="admin-card-badge-stock">
                      {isOut ? (
                        <span className="badge-stock out">Out of Stock</span>
                      ) : isLow ? (
                        <span className="badge-stock low">Low ({stk})</span>
                      ) : (
                        <span className="badge-stock in">In Stock</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-card-body">
                    <div className="admin-card-header-row">
                      <span className="badge-cat-tag">{p.category || "General"}</span>
                      <span className="table-sku-badge">SKU-#{p.id}</span>
                    </div>

                    <h4 className="admin-card-title">{p.name}</h4>
                    <p className="admin-card-desc">
                      {p.description || "Verified retail inventory product."}
                    </p>

                    <div className="admin-card-pricing-row">
                      <span className="admin-card-price">
                        ₹{Number(p.price || 0).toLocaleString()}
                      </span>
                      <span className="admin-card-stock-tag">
                        {stk} units on-hand
                      </span>
                    </div>

                    <div className="admin-card-actions-bar">
                      <button
                        className="btn-card-action view"
                        onClick={() => setViewingProduct(p)}
                        title="View Details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        className="btn-card-action edit"
                        onClick={() => openEditModal(p)}
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn-card-action delete"
                        onClick={() => setDeletingProduct(p)}
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedProducts.length === 0 && (
              <div className="empty-catalog-box col-span-full">
                <Package size={38} className="text-slate-muted" />
                <h4>No products found</h4>
                <p>No products match your filter criteria.</p>
                <button
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                    setStockFilter("all");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW PRODUCT DETAIL MODAL */}
        {viewingProduct && (
          <div className="modal-backdrop-overlay" onClick={() => setViewingProduct(null)}>
            <div
              className="admin-modal-card admin-view-prod-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-line">
                <div className="modal-title-with-icon">
                  <div className="modal-icon-badge bg-blue-subtle">
                    <Package size={20} className="text-blue" />
                  </div>
                  <div>
                    <h3>{viewingProduct.name}</h3>
                    <p className="modal-sub-desc">SKU #{viewingProduct.id} &bull; {viewingProduct.category || "General"}</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setViewingProduct(null)} title="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="admin-prod-view-grid">
                <div className="admin-prod-view-media">
                  <img
                    src={getProductImage(viewingProduct)}
                    alt={viewingProduct.name}
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/400x300?text=${encodeURIComponent(
                        viewingProduct.name
                      )}`;
                    }}
                  />
                </div>

                <div className="admin-prod-view-details">
                  <div className="admin-prod-spec-row">
                    <span>Retail Price</span>
                    <strong className="text-emerald">₹{Number(viewingProduct.price || 0).toLocaleString()}</strong>
                  </div>
                  <div className="admin-prod-spec-row">
                    <span>Available Stock</span>
                    <strong>{viewingProduct.stock || 0} units</strong>
                  </div>
                  <div className="admin-prod-spec-row">
                    <span>Category Department</span>
                    <strong>{viewingProduct.category || "General"}</strong>
                  </div>
                  <div className="admin-prod-spec-row">
                    <span>Inventory Status</span>
                    {Number(viewingProduct.stock || 0) <= 0 ? (
                      <span className="badge-stock out">Out of Stock</span>
                    ) : Number(viewingProduct.stock || 0) <= 10 ? (
                      <span className="badge-stock low">Low Stock ({viewingProduct.stock})</span>
                    ) : (
                      <span className="badge-stock in">Healthy Stock</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="category-view-desc-card">
                <span className="desc-title">Product Description</span>
                <p>
                  {viewingProduct.description && viewingProduct.description.trim() !== ""
                    ? viewingProduct.description
                    : "No detailed product description entered yet."}
                </p>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setViewingProduct(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-confirm"
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    openEditModal(p);
                  }}
                >
                  <Edit2 size={15} />
                  <span>Edit Product</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            ADD / EDIT MODAL
        ====================================================== */}
        {isModalOpen && (
          <div className="modal-backdrop-overlay" onClick={closeModal}>
            <div
              className="admin-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-line">
                <h3>{editingId ? "Edit Product Details" : "Add New Product"}</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="modal-error-banner">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="admin-modal-form">
                <div className="form-group-item">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    required
                  />
                </div>

                <div className="form-duo-row">
                  <div className="form-group-item">
                    <label>Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 2499"
                      min="0"
                      step="any"
                      required
                    />
                  </div>
                </div>

                <div className="form-duo-row">
                  <div className="form-group-item">
                    <label>Initial Stock Units *</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="e.g. 50"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label>Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div className="image-preview-box">
                    <span className="preview-label">Image Preview:</span>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="preview-img"
                    />
                  </div>
                )}

                <div className="form-group-item">
                  <label>Product Description</label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter key specifications, warranty, and features..."
                  ></textarea>
                </div>

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-confirm"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? "Saving Product..." : editingId ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
            DELETE CONFIRMATION MODAL
        ====================================================== */}
        {deletingProduct && (
          <div
            className="modal-backdrop-overlay"
            onClick={() => setDeletingProduct(null)}
          >
            <div
              className="confirm-dialog-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-box bg-red">
                <Trash2 size={24} className="text-red" />
              </div>
              <h3>Delete Product</h3>
              <p>
                Are you sure you want to delete <strong>"{deletingProduct.name}"</strong>?
                This action will remove the product and its stock history from the store.
              </p>
              <div className="confirm-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setDeletingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-delete-confirm"
                  onClick={confirmDeleteProduct}
                >
                  Yes, Delete Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================
  // RENDER USER VIEW (2-COLUMN E-COMMERCE CATALOG)
  // =====================================================
  return (
    <div className="ecommerce-products-page">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="cart-feedback-toast">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BANNER */}
      <div className="products-hero-strip">
        <div className="strip-content">
          <h2>All Store Products</h2>
          <p>
            Explore our curated catalog with verified in-stock items, guaranteed authentic products, and fast checkout.
          </p>
        </div>
      </div>

      <div className="products-catalog-layout">
        {/* =====================================================
            LEFT: SIDEBAR FILTERS
        ====================================================== */}
        <aside className="products-filter-sidebar">
          <div className="sidebar-filter-header">
            <div className="filter-title">
              <SlidersHorizontal size={17} />
              <span>Filters</span>
            </div>
            {(selectedCategory !== "all" || stockFilter !== "all" || maxPrice || search) && (
              <button
                className="btn-reset-filters-link"
                onClick={() => {
                  setSelectedCategory("all");
                  sessionStorage.removeItem("selectedCategory");
                  setStockFilter("all");
                  setMaxPrice("");
                  setSearch("");
                }}
              >
                Reset All
              </button>
            )}
          </div>

          <div className="filter-sections-grid">
            {/* CATEGORIES */}
            <div className="filter-section-block">
              <h4>Categories</h4>
              <div className="filter-radio-list">
                <label className={`filter-option-item ${selectedCategory === "all" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="catFilter"
                    checked={selectedCategory === "all"}
                    onChange={() => {
                      setSelectedCategory("all");
                      sessionStorage.removeItem("selectedCategory");
                    }}
                  />
                  <span>All Categories</span>
                  <span className="count-tag">{products.length}</span>
                </label>

                {categories.map((c) => {
                  const count = products.filter(
                    (p) => (p.category || "").toLowerCase() === (c.name || "").toLowerCase()
                  ).length;

                  return (
                    <label
                      key={c.id || c.name}
                      className={`filter-option-item ${
                        selectedCategory.toLowerCase() === (c.name || "").toLowerCase()
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="catFilter"
                        checked={
                          selectedCategory.toLowerCase() === (c.name || "").toLowerCase()
                        }
                        onChange={() => {
                          setSelectedCategory(c.name);
                          sessionStorage.setItem("selectedCategory", c.name);
                        }}
                      />
                      <span>{c.name}</span>
                      <span className="count-tag">{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* STOCK STATUS FILTER */}
            {/* STOCK STATUS FILTER - ADMIN ONLY */}
{user?.role?.toLowerCase() === "admin" && (
  <div className="filter-section-block">
    <h4>Stock Availability</h4>
    <div className="filter-radio-list">
      <label className={`filter-option-item ${stockFilter === "all" ? "selected" : ""}`}>
        <input
          type="radio"
          name="stockOpt"
          checked={stockFilter === "all"}
          onChange={() => setStockFilter("all")}
        />
        <span>All Products</span>
      </label>

      <label className={`filter-option-item ${stockFilter === "in" ? "selected" : ""}`}>
        <input
          type="radio"
          name="stockOpt"
          checked={stockFilter === "in"}
          onChange={() => setStockFilter("in")}
        />
        <span>In Stock (&gt;10 units)</span>
      </label>

      <label className={`filter-option-item ${stockFilter === "low" ? "selected" : ""}`}>
        <input
          type="radio"
          name="stockOpt"
          checked={stockFilter === "low"}
          onChange={() => setStockFilter("low")}
        />
        <span>Low Stock (≤10 units)</span>
      </label>
    </div>
  </div>
)}

            {/* PRICE RANGE FILTER */}
            <div className="filter-section-block">
              <h4>Max Price</h4>
              <div className="price-filter-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                {maxPrice && (
                  <button onClick={() => setMaxPrice("")} className="clear-price-btn" title="Clear price filter">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================================
            RIGHT: MAIN CONTENT & PRODUCTS GRID
        ====================================================== */}
        <main className="products-main-content">
          {/* SEARCH & SORT HEADER */}
          <div className="catalog-top-toolbar">
            <div className="toolbar-search-wrap">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search products by title or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="clear-search-btn">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="toolbar-right-items">
              <span className="results-count">
                <strong>{sortedProducts.length}</strong> items found
              </span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-sort-styled"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* ERROR STATE */}
          {error && (
            <div className="catalog-error-box">
              <AlertTriangle size={20} />
              <p>{error}</p>
              <button onClick={loadData} className="btn-retry">
                Try Again
              </button>
            </div>
          )}

          {/* LOADING SKELETON */}
          {loading && (
            <div className="catalog-loading-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="product-skeleton-card">
                  <div className="skeleton-img"></div>
                  <div className="skeleton-line short"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line price"></div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && sortedProducts.length === 0 && (
            <div className="catalog-empty-box">
              <Package size={52} className="text-muted" />
              <h3>No products match your criteria</h3>
              <p>Try resetting filters or adjusting your search keywords.</p>
              <button
                className="btn-clear-filters"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setStockFilter("all");
                  setMaxPrice("");
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* PRODUCT CARDS GRID */}
          {!loading && !error && sortedProducts.length > 0 && (
            <div className="ecom-products-grid">
              {sortedProducts.map((product) => {
                const stock = Number(
                  product.stock !== undefined ? product.stock : 0
                );
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 10;
                const isWishlisted = wishlist.some((w) => w.id === product.id);

                return (
                  <div key={product.id} className="modern-product-card">
                    {/* TOP ACTION BUTTONS */}
                    <div className="card-top-action-bar">
                      <button
                        className={`btn-card-wishlist ${isWishlisted ? "active" : ""}`}
                        onClick={() => toggleWishlist(product)}
                        title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                      >
                        <Heart
                          size={17}
                          fill={isWishlisted ? "#ef4444" : "none"}
                          color={isWishlisted ? "#ef4444" : "#64748b"}
                        />
                      </button>

                      <button
                        className="btn-card-quickview"
                        onClick={() => setActiveModalProduct(product)}
                        title="Quick View"
                      >
                        <Eye size={17} />
                      </button>
                    </div>

                    {/* IMAGE CONTAINER WITH FIXED HEIGHT & OBJECT-FIT CONTAIN */}
                    <div
                      className="card-image-wrapper"
                      onClick={() => setActiveModalProduct(product)}
                    >
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="card-product-img"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/500x400?text=${encodeURIComponent(
                            product.name
                          )}`;
                        }}
                      />

                      {/* FLOATING STATUS BADGE */}
                      <div className="card-status-pill-float">
                        {isOutOfStock ? (
                          <span className="badge-stock out">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge-stock low">Only {stock} left!</span>
                        ) : (
                          <span className="badge-stock in">In Stock</span>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="card-product-details">
                      <span className="card-category-tag">
                        {product.category || "General"}
                      </span>

                      <h3
                        className="card-product-name"
                        onClick={() => setActiveModalProduct(product)}
                      >
                        {product.name}
                      </h3>

                      <div className="card-price-stock-row">
                        <div className="price-group">
                          <span className="current-price">
                            ₹{Number(product.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <span className="stock-info-text">
                          {isOutOfStock ? (
                            <span className="text-red">Unavailable</span>
                          ) : (
                            `${stock} units`
                          )}
                        </span>
                      </div>

                      {/* DUAL ACTION BUTTONS: ADD TO CART & BUY NOW */}
                      <div className="card-dual-actions">
                        <button
                          className="btn-add-to-cart"
                          onClick={() => addToCart(product, 1)}
                          disabled={isOutOfStock}
                        >
                          <ShoppingCart size={15} />
                          <span>Add</span>
                        </button>

                        <button
                          className="btn-buy-now"
                          onClick={() => handleBuyNow(product, 1)}
                          disabled={isOutOfStock}
                        >
                          <Zap size={15} />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <Footer onNavigate={onNavigate} categories={categories} />

      {/* PRODUCT DETAIL MODAL */}
      {activeModalProduct && (
        <ProductDetailModal
          product={activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          onAddToCart={(prod, qty) => {
            addToCart(prod, qty);
            setActiveModalProduct(null);
          }}
          onBuyNow={(prod, qty) => {
            handleBuyNow(prod, qty);
            setActiveModalProduct(null);
          }}
          isWishlisted={wishlist.some((w) => w.id === activeModalProduct.id)}
          onToggleWishlist={toggleWishlist}
          relatedProducts={products.filter(
            (p) =>
              p.category === activeModalProduct.category &&
              p.id !== activeModalProduct.id
          )}
          onSelectProduct={(p) => setActiveModalProduct(p)}
        />
      )}
    </div>
  );
}

export default Products;
