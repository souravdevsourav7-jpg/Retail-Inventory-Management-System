import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShoppingBag,
  ShoppingCart,
  Zap,
  Search,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  Package,
  Layers,
  Check,
  AlertTriangle,
  X,
  Heart,
  Eye,
  Flame,
  Award,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import ProductDetailModal from "../components/ProductDetailModal";
import WishlistModal from "../components/WishlistModal";
import Footer from "../components/Footer";

function UserDashboard({ user, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Cart toast
  const [toastMessage, setToastMessage] = useState("");

  // Product Detail Modal state
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  // Wishlist state
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("retail_wishlist") || "[]");
    } catch {
      return [];
    }
  });
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("retail_recently_viewed") || "[]");
    } catch {
      return [];
    }
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const [prodRes, catRes] = await Promise.all([
        axios.get("/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("LOAD USER DASHBOARD DATA ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please check your connection."
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
    setTimeout(() => {
      setToastMessage("");
    }, 3200);
  }

  // ===============================
  // WISHLIST TOGGLE
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

  function removeFromWishlist(id) {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    try {
      localStorage.setItem("retail_wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch {
      // ignore
    }
  }

  // ===============================
  // ADD TO CART
  // ===============================
  function addToCart(product, quantityToAdd = 1) {
    const productStock = Number(
      product.stock !== undefined ? product.stock : 0
    );

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

  // ===============================
  // BUY NOW
  // ===============================
  function handleBuyNow(product, qty = 1) {
    const added = addToCart(product, qty);
    if (added && onNavigate) {
      onNavigate("checkout");
    }
  }

  // ===============================
  // OPEN PRODUCT MODAL & RECORD VIEW
  // ===============================
  function openProductDetail(product) {
    setActiveModalProduct(product);

    // Save to recently viewed
    try {
      const filtered = recentlyViewed.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      setRecentlyViewed(updated);
      localStorage.setItem("retail_recently_viewed", JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // Helper for image url
  function getProductImage(product) {
    if (product && product.image && product.image.trim() !== "") {
      if (product.image.startsWith("http") || product.image.startsWith("data:")) return product.image;
      const normalized = product.image.startsWith("/") ? product.image : `/${product.image}`;
      return `${normalized}`;
    }
    return `https://placehold.co/500x400?text=${encodeURIComponent(
      product?.name || "Product"
    )}`;
  }

  // Dynamic Category Thumbnail: uses first product image in this category, or null for clean fallback
  function getCategoryThumbnail(categoryName) {
    if (!categoryName) return null;
    const targetCat = categoryName.toLowerCase().trim();
    const prodWithImg = products.find(
      (p) =>
        (p.category || "").toLowerCase().trim() === targetCat &&
        p.image &&
        p.image.trim() !== ""
    );
    if (prodWithImg) {
      return getProductImage(prodWithImg);
    }
    return null;
  }

  // Calculate Product count per Category
  const categoryCounts = categories.map((cat) => {
    const count = products.filter(
      (p) => (p.category || "").toLowerCase() === (cat.name || "").toLowerCase()
    ).length;
    return { ...cat, count };
  });

  // Filtered & Sorted Products
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
    const matchStock = inStockOnly ? stockVal > 0 : true;

    return matchSearch && matchCategory && matchStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
    return 0; // featured default
  });

  // Best Sellers (real stock volume or top available items)
  const bestSellers = [...products]
    .filter((p) => Number(p.stock || 0) > 0)
    .slice(0, 4);

  return (
    <div className="ecommerce-home-container">
      {/* =====================================================
          TOAST FEEDBACK
      ====================================================== */}
      {toastMessage && (
        <div className="cart-feedback-toast">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================
          A. HERO BANNER SECTION
      ====================================================== */}
      <section className="ecom-hero-banner">
        <div className="hero-content-column">
          <div className="hero-badge">
            <Sparkles size={14} className="text-amber" />
            <span>Summer Sale & Genuine Retail Store</span>
          </div>

          <h1 className="hero-heading">
            Welcome back, {user?.name ? user.name.split(" ")[0] : "Shopper"} 👋
          </h1>

          <p className="hero-subtext">
            Discover verified inventory, transparent pricing, and rapid doorstep delivery.
            Everything in our catalog is backed by real warehouse stock.
          </p>

          <div className="hero-cta-group">
            <button
              className="btn-hero-primary"
              onClick={() => {
                const el = document.getElementById("catalog-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>Shop Now</span>
              <ArrowRight size={17} />
            </button>

            <button
              className="btn-hero-secondary"
              onClick={() => {
                const el = document.getElementById("categories-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>View Categories</span>
            </button>
          </div>

          <div className="hero-trust-metrics">
            <div className="metric-pill">
              <strong>{products.length}+</strong>
              <span>Verified SKUs</span>
            </div>
            <div className="metric-pill">
              <strong>100%</strong>
              <span>Live Stock</span>
            </div>
            <div className="metric-pill">
              <strong>Fast</strong>
              <span>Express Delivery</span>
            </div>
          </div>
        </div>

        <div className="hero-graphic-column">
          <div className="hero-floating-card">
            <div className="float-card-header">
              <ShoppingBag size={24} className="text-blue" />
              <div>
                <strong>Express Storefront</strong>
                <small>Ready to dispatch</small>
              </div>
            </div>
            <div className="float-card-price">
              <span className="price-tag">Up to 100% In-Stock Reliability</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          G. TRUST / SERVICE PERKS STRIP
      ====================================================== */}
      <section className="store-perks-strip">
        <div className="perk-box">
          <div className="perk-icon-circle bg-blue">
            <Truck size={20} />
          </div>
          <div>
            <strong>Fast & Free Delivery</strong>
            <p>On all domestic customer orders</p>
          </div>
        </div>

        <div className="perk-box">
          <div className="perk-icon-circle bg-emerald">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>100% Authentic Quality</strong>
            <p>Direct from verified inventory</p>
          </div>
        </div>

        <div className="perk-box">
          <div className="perk-icon-circle bg-amber">
            <RotateCcw size={20} />
          </div>
          <div>
            <strong>7-Day Easy Returns</strong>
            <p>Hassle-free guarantee</p>
          </div>
        </div>

        <div className="perk-box">
          <div className="perk-icon-circle bg-indigo">
            <Clock size={20} />
          </div>
          <div>
            <strong>Live Order Tracking</strong>
            <p>From warehouse to doorstep</p>
          </div>
        </div>
      </section>

      {/* =====================================================
          C. POPULAR CATEGORIES SECTION
      ====================================================== */}
      <section id="categories-section" className="ecom-section-block">
        <div className="section-header-row">
          <div>
            <span className="section-eyebrow">Explore Collections</span>
            <h2 className="section-main-title">Shop by Category</h2>
          </div>
          <button
            className="btn-section-link"
            onClick={() => onNavigate && onNavigate("categories")}
          >
            <span>All Categories</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="category-cards-grid">
          {categoryCounts.map((cat) => {
            const thumbUrl = getCategoryThumbnail(cat.name);
            const isActive =
              selectedCategory.toLowerCase() === (cat.name || "").toLowerCase();

            return (
              <div
                key={cat.id || cat.name}
                className={`category-feature-card ${isActive ? "active" : ""}`}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  const el = document.getElementById("catalog-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="cat-card-thumb-box">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={cat.name}
                      className="cat-card-thumb-img"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const placeholder = e.currentTarget.parentElement.querySelector(
                          ".cat-card-no-img"
                        );
                        if (placeholder) placeholder.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="cat-card-no-img"
                    style={{ display: thumbUrl ? "none" : "flex" }}
                  >
                    <Package size={28} className="placeholder-icon" />
                    <span className="placeholder-label">No Image</span>
                  </div>
                </div>

                <div className="cat-card-info">
                  <h3 className="cat-card-name">{cat.name}</h3>
                  <span className="cat-card-count">
                    {cat.count} {cat.count === 1 ? "Product" : "Products"} Available
                  </span>
                </div>
              </div>
            );
          })}
          {categoryCounts.length === 0 && (
            <p className="text-muted">Loading categories...</p>
          )}
        </div>
      </section>

      {/* =====================================================
          E. CURATED OFFERS & DEALS BANNER
      ====================================================== */}
      <section className="ecom-promo-banner">
        <div className="promo-banner-inner">
          <div className="promo-badge">
            <Flame size={16} className="text-red" />
            <span>Featured Store Spotlight</span>
          </div>
          <h2>Special Seasonal Picks & Fast Dispatch</h2>
          <p>
            Browse trending products handpicked from our latest stock updates.
            Enjoy secure payments, instant order confirmations, and prompt dispatch.
          </p>
          <button
            className="btn-promo-cta"
            onClick={() => {
              setSelectedCategory("all");
              const el = document.getElementById("catalog-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>Explore All Products</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* =====================================================
          B. FEATURED PRODUCTS & CATALOG
      ====================================================== */}
      <section id="catalog-section" className="ecom-section-block">
        <div className="section-header-row">
          <div>
            <span className="section-eyebrow">Genuine Inventory</span>
            <h2 className="section-main-title">Featured Products Catalog</h2>
          </div>

          <span className="results-counter-pill">
            Showing {sortedProducts.length} of {products.length} Products
          </span>
        </div>

        {/* SEARCH, FILTER & SORT CONTROL BAR */}
        <div className="ecom-controls-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="search-clear-btn"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-controls-right">
            {/* CATEGORY PILLS */}
            <div className="category-pill-group">
              <button
                className={`pill-btn ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                All
              </button>
              {categories.slice(0, 4).map((c) => (
                <button
                  key={c.id || c.name}
                  className={`pill-btn ${
                    selectedCategory.toLowerCase() === (c.name || "").toLowerCase()
                      ? "active"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* SORT SELECTOR */}
            <div className="sort-selector-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-sort"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            {/* IN-STOCK ONLY TOGGLE */}
            <label className="stock-toggle-label">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
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
            {[1, 2, 3, 4].map((n) => (
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
            <h3>No products found</h3>
            <p>
              We couldn't find any products matching your search or filter criteria.
            </p>
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* PRODUCTS GRID */}
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
                  {/* CARD TOP ACTIONS */}
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
                      onClick={() => openProductDetail(product)}
                      title="Quick View"
                    >
                      <Eye size={17} />
                    </button>
                  </div>

                  {/* PRODUCT IMAGE CONTAINER */}
                  <div
                    className="card-image-wrapper"
                    onClick={() => openProductDetail(product)}
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
                      onClick={() => openProductDetail(product)}
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
                        title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
                      >
                        <ShoppingCart size={15} />
                        <span>Add</span>
                      </button>

                      <button
                        className="btn-buy-now"
                        onClick={() => handleBuyNow(product, 1)}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? "Out of Stock" : "Buy Now"}
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
      </section>

      {/* =====================================================
          D. BEST SELLERS SECTION
      ====================================================== */}
      {bestSellers.length > 0 && (
        <section className="ecom-section-block">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">Customer Favorites</span>
              <h2 className="section-main-title">Trending & Best Sellers</h2>
            </div>
          </div>

          <div className="ecom-products-grid">
            {bestSellers.map((product) => {
              const isWishlisted = wishlist.some((w) => w.id === product.id);
              return (
                <div key={`best-${product.id}`} className="modern-product-card">
                  <div className="card-top-action-bar">
                    <span className="best-seller-tag">
                      <Award size={13} /> Best Seller
                    </span>
                    <button
                      className={`btn-card-wishlist ${isWishlisted ? "active" : ""}`}
                      onClick={() => toggleWishlist(product)}
                    >
                      <Heart
                        size={17}
                        fill={isWishlisted ? "#ef4444" : "none"}
                        color={isWishlisted ? "#ef4444" : "#64748b"}
                      />
                    </button>
                  </div>

                  <div
                    className="card-image-wrapper"
                    onClick={() => openProductDetail(product)}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="card-product-img"
                    />
                  </div>

                  <div className="card-product-details">
                    <span className="card-category-tag">{product.category}</span>
                    <h3
                      className="card-product-name"
                      onClick={() => openProductDetail(product)}
                    >
                      {product.name}
                    </h3>
                    <div className="card-price-stock-row">
                      <span className="current-price">
                        ₹{Number(product.price || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="card-dual-actions">
                      <button
                        className="btn-add-to-cart"
                        onClick={() => addToCart(product, 1)}
                      >
                        <ShoppingCart size={15} />
                        <span>Add</span>
                      </button>
                      <button
                        className="btn-buy-now"
                        onClick={() => handleBuyNow(product, 1)}
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
        </section>
      )}

      {/* =====================================================
          F. RECENTLY VIEWED PRODUCTS
      ====================================================== */}
      {recentlyViewed.length > 0 && (
        <section className="ecom-section-block">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">Your History</span>
              <h2 className="section-main-title">Recently Viewed</h2>
            </div>
            <button
              className="btn-clear-history"
              onClick={() => {
                setRecentlyViewed([]);
                localStorage.removeItem("retail_recently_viewed");
              }}
            >
              Clear History
            </button>
          </div>

          <div className="recently-viewed-row">
            {recentlyViewed.map((prod) => (
              <div
                key={`recent-${prod.id}`}
                className="recent-product-pill"
                onClick={() => openProductDetail(prod)}
              >
                <img
                  src={getProductImage(prod)}
                  alt={prod.name}
                  className="recent-prod-thumb"
                />
                <div className="recent-prod-meta">
                  <span className="recent-name">{prod.name}</span>
                  <strong className="recent-price">
                    ₹{Number(prod.price || 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          H. FOOTER
      ====================================================== */}
      <Footer onNavigate={onNavigate} categories={categories} />

      {/* =====================================================
          INTERACTIVE MODALS
      ====================================================== */}
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
          onSelectProduct={(p) => openProductDetail(p)}
        />
      )}

      {/* WISHLIST MODAL */}
      <WishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={removeFromWishlist}
        onAddToCart={(prod, qty) => addToCart(prod, qty)}
      />
    </div>
  );
}

export default UserDashboard;
