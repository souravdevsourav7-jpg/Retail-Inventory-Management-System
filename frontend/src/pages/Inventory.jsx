import "./Admin.css";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Boxes,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Package,
  X,
  IndianRupee,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Restock Modal
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [minStockValue, setMinStockValue] = useState("10");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState("");

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

      const [invRes, catRes] = await Promise.all([
        axios.get("http://localhost:5000/api/inventory", getAuthConfig()),
        axios.get("http://localhost:5000/api/categories", getAuthConfig()),
      ]);

      setInventory(invRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("INVENTORY LOAD ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load inventory details"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, selectedCategory, stockStatusFilter, itemsPerPage]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function openRestockModal(item) {
    setRestockProduct(item);
    const currentStock = item.stock !== undefined ? item.stock : (item.quantity || 0);
    setRestockQuantity(String(currentStock));
    setMinStockValue(String(item.min_stock || 10));
    setUpdateError("");
  }

  function closeRestockModal() {
    setRestockProduct(null);
    setRestockQuantity("");
    setMinStockValue("10");
    setUpdateError("");
  }

  function handleQuickIncrement(amount) {
    const current = Number(restockQuantity) || 0;
    setRestockQuantity(String(current + amount));
  }

  async function handleQuickRowRestock(item, amount) {
    const current = Number(item.stock !== undefined ? item.stock : (item.quantity || 0));
    const minStk = Number(item.min_stock || 10);
    const newStock = current + amount;
    const productId = item.product_id || item.id;
    const productName = item.name || item.product_name || "Product";

    try {
      await axios.put(
        `http://localhost:5000/api/inventory/stock/${productId}`,
        {
          stock: newStock,
          min_stock: minStk,
        },
        getAuthConfig()
      );
      showToast(`+${amount} units added to "${productName}" (New total: ${newStock})`);
      loadData();
    } catch (err) {
      console.error("QUICK RESTOCK ERROR:", err);
      showToast(err.response?.data?.message || "Failed to update stock quantity.");
    }
  }

  async function handleRestockSubmit(e) {
    e.preventDefault();
    if (!restockProduct) return;

    const newStock = parseInt(restockQuantity, 10);
    const minStk = parseInt(minStockValue, 10);

    if (isNaN(newStock) || newStock < 0) {
      setUpdateError("Stock must be a non-negative number.");
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      const productId = restockProduct.product_id || restockProduct.id;
      const productName = restockProduct.name || restockProduct.product_name || "Product";

      await axios.put(
        `http://localhost:5000/api/inventory/stock/${productId}`,
        {
          stock: newStock,
          min_stock: isNaN(minStk) ? 10 : minStk,
        },
        getAuthConfig()
      );

      showToast(`Stock updated to ${newStock} units for "${productName}"!`);
      closeRestockModal();
      loadData();
    } catch (err) {
      console.error("RESTOCK ERROR:", err);
      setUpdateError(
        err.response?.data?.message || "Failed to update stock quantity."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // Calculate Metrics from real backend data
  const totalItemsCount = inventory.length;
  const totalStockUnits = inventory.reduce(
    (sum, item) => sum + Number(item.stock || item.quantity || 0),
    0
  );

  const lowStockCount = inventory.filter((item) => {
    const s = Number(item.stock || item.quantity || 0);
    const m = Number(item.min_stock || 10);
    return s > 0 && s <= m;
  }).length;

  const outOfStockCount = inventory.filter((item) => {
    const s = Number(item.stock || item.quantity || 0);
    return s === 0;
  }).length;

  const healthyCount = Math.max(0, totalItemsCount - lowStockCount - outOfStockCount);

  const inventoryValue = inventory.reduce((sum, item) => {
    const s = Number(item.stock || item.quantity || 0);
    const p = Number(item.price || 0);
    return sum + s * p;
  }, 0);

  // Filter List
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const itemName = (item.name || item.product_name || "").toLowerCase();
      const itemCat = (item.category || "").toLowerCase();
      const itemIdStr = String(item.product_id || item.id || "");
      const matchesSearch =
        !q ||
        itemName.includes(q) ||
        itemCat.includes(q) ||
        itemIdStr.includes(q);

      const matchesCategory =
        selectedCategory === "all" ||
        itemCat === selectedCategory.toLowerCase();

      const stock = Number(item.stock !== undefined ? item.stock : (item.quantity || 0));
      const minStk = Number(item.min_stock || 10);

      let matchesStatus = true;
      if (stockStatusFilter === "in_stock") {
        matchesStatus = stock > minStk;
      } else if (stockStatusFilter === "low_stock") {
        matchesStatus = stock > 0 && stock <= minStk;
      } else if (stockStatusFilter === "out_of_stock") {
        matchesStatus = stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchQuery, selectedCategory, stockStatusFilter]);

  // Paginated Inventory Items
  const totalFiltered = filteredInventory.length;
  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(totalFiltered / itemsPerPage) || 1;

  const paginatedInventory = useMemo(() => {
    if (itemsPerPage === "all") return filteredInventory;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventory, currentPage, itemsPerPage]);

  // Checkbox helpers
  const allCurrentSelected =
    paginatedInventory.length > 0 &&
    paginatedInventory.every((item) =>
      selectedIds.includes(item.product_id || item.id)
    );

  function handleSelectAllToggle() {
    if (allCurrentSelected) {
      const currentIds = paginatedInventory.map((i) => i.product_id || i.id);
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      const currentIds = paginatedInventory.map((i) => i.product_id || i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  }

  function handleRowSelectToggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function getProductImage(item) {
    if (item.image && item.image.trim() !== "") {
      if (item.image.startsWith("http")) return item.image;
      return `http://localhost:5000${item.image}`;
    }
    const displayName = item.name || item.product_name || "Item";
    return `https://placehold.co/100x100?text=${encodeURIComponent(
      displayName
    )}`;
  }

  function getCatColor(catName = "") {
    const n = (catName || "").toLowerCase();
    if (n.includes("elect") || n.includes("tech") || n.includes("gadget") || n.includes("phone")) {
      return { bg: "rgba(37, 99, 235, 0.08)", text: "#1d4ed8", border: "rgba(37, 99, 235, 0.2)" };
    }
    if (n.includes("cloth") || n.includes("apparel") || n.includes("fashion") || n.includes("wear")) {
      return { bg: "rgba(124, 58, 237, 0.08)", text: "#6d28d9", border: "rgba(124, 58, 237, 0.2)" };
    }
    if (n.includes("home") || n.includes("furn") || n.includes("living") || n.includes("decor")) {
      return { bg: "rgba(5, 150, 105, 0.08)", text: "#047857", border: "rgba(5, 150, 105, 0.2)" };
    }
    if (n.includes("food") || n.includes("grocer") || n.includes("snack") || n.includes("bev")) {
      return { bg: "rgba(217, 119, 6, 0.08)", text: "#b45309", border: "rgba(217, 119, 6, 0.2)" };
    }
    if (n.includes("access") || n.includes("jewel") || n.includes("watch")) {
      return { bg: "rgba(219, 39, 119, 0.08)", text: "#be185d", border: "rgba(219, 39, 119, 0.2)" };
    }
    return { bg: "rgba(79, 70, 229, 0.08)", text: "#4338ca", border: "rgba(79, 70, 229, 0.2)" };
  }

  return (
    <div className="admin-inventory-page">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="cart-feedback-toast">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODERN INVENTORY HEADER */}
      <div className="inventory-page-header">
        <div className="admin-header-main">
          <div className="admin-section-eyebrow">
            <Boxes size={13} className="text-blue" />
            <span>Warehouse Stock Audit &amp; Replenishment</span>
          </div>
          <h2>Inventory Management</h2>
          <p>Monitor and manage available stock.</p>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={loadData}
            className="btn-refresh-inventory"
            disabled={loading}
            title="Sync Stock Data"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Sync Stock Data</span>
          </button>
        </div>
      </div>

      {/* FOUR SUMMARY CARDS */}
      <div className="inventory-kpi-grid">
        {/* 1. Total Inventory Items (Blue) */}
        <div className="inv-kpi-card kpi-blue">
          <div className="kpi-icon-wrap bg-blue-subtle">
            <Package size={22} className="text-blue" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Inventory Items</span>
            <strong>{totalItemsCount} Items</strong>
            <span className="kpi-meta-tag tag-blue">Tracked SKUs</span>
          </div>
        </div>

        {/* 2. Total Units in Stock (Purple) */}
        <div className="inv-kpi-card kpi-purple">
          <div className="kpi-icon-wrap bg-purple-subtle">
            <Layers size={22} className="text-purple" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Units in Stock</span>
            <strong className="text-purple">{totalStockUnits.toLocaleString()} Units</strong>
            <span className="kpi-meta-tag tag-purple">On-Hand Volume</span>
          </div>
        </div>

        {/* 3. Low Stock Items (Orange) */}
        <div className="inv-kpi-card kpi-orange">
          <div className="kpi-icon-wrap bg-orange-subtle">
            <AlertTriangle size={22} className="text-orange" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Low Stock Items</span>
            <strong className="text-orange">{lowStockCount} Items</strong>
            <span className="kpi-meta-tag tag-orange">&le; Reorder Point</span>
          </div>
        </div>

        {/* 4. Out of Stock Items (Red) */}
        <div className="inv-kpi-card kpi-red">
          <div className="kpi-icon-wrap bg-red-subtle">
            <XCircle size={22} className="text-red" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Out of Stock Items</span>
            <strong className="text-red">{outOfStockCount} Items</strong>
            <span className="kpi-meta-tag tag-red">0 Units Available</span>
          </div>
        </div>
      </div>

      {/* QUICK STATUS FILTER TABS */}
      <div className="admin-quick-filter-bar">
        <div className="filter-tab-pills">
          <button
            className={`filter-tab-pill ${stockStatusFilter === "all" ? "active" : ""}`}
            onClick={() => setStockStatusFilter("all")}
          >
            <span>All Items</span>
            <span className="pill-count">{totalItemsCount}</span>
          </button>
          <button
            className={`filter-tab-pill pill-in ${stockStatusFilter === "in_stock" ? "active" : ""}`}
            onClick={() => setStockStatusFilter("in_stock")}
          >
            <span className="dot dot-emerald"></span>
            <span>Healthy Stock</span>
            <span className="pill-count">{healthyCount}</span>
          </button>
          <button
            className={`filter-tab-pill pill-low ${stockStatusFilter === "low_stock" ? "active" : ""}`}
            onClick={() => setStockStatusFilter("low_stock")}
          >
            <span className="dot dot-amber"></span>
            <span>Low Stock Alerts</span>
            <span className="pill-count">{lowStockCount}</span>
          </button>
          <button
            className={`filter-tab-pill pill-out ${stockStatusFilter === "out_of_stock" ? "active" : ""}`}
            onClick={() => setStockStatusFilter("out_of_stock")}
          >
            <span className="dot dot-rose"></span>
            <span>Out of Stock</span>
            <span className="pill-count">{outOfStockCount}</span>
          </button>
        </div>
        <span className="filter-results-counter">
          Showing <strong>{filteredInventory.length}</strong> of {totalItemsCount} items
        </span>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="inventory-controls-panel">
        <div className="search-box-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by product name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="clear-btn" title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns-group">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="admin-select"
            title="Filter by category"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Dropdown */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="admin-select"
            title="Filter by stock status"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (Healthy)</option>
            <option value="low_stock">Low Stock (≤ Reorder)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Items-per-page Selector */}
          <div className="items-per-page-wrapper">
            <span className="per-page-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="admin-select items-per-page-select"
              title="Items per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="btn-toolbar-refresh"
            title="Refresh Inventory Data"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {(searchQuery || selectedCategory !== "all" || stockStatusFilter !== "all") && (
            <button
              className="btn-reset-filters"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setStockStatusFilter("all");
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* BATCH SELECTION BANNER */}
      {selectedIds.length > 0 && (
        <div className="batch-selection-banner">
          <span>{selectedIds.length} item(s) selected across current view</span>
          <button
            className="btn-clear-selection"
            onClick={() => setSelectedIds([])}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* LOADING & ERROR */}
      {loading && (
        <div className="admin-loading-card">
          <div className="spinner"></div>
          <p>Auditing warehouse inventory levels...</p>
        </div>
      )}

      {error && (
        <div className="admin-error-box">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* INVENTORY TABLE */}
      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th style={{ width: "42px" }} className="text-center">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={allCurrentSelected}
                    onChange={handleSelectAllToggle}
                    title="Select all on this page"
                  />
                </th>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock Quantity</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((item) => {
                const stock = Number(item.stock !== undefined ? item.stock : (item.quantity || 0));
                const minStk = Number(item.min_stock || 10);
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= minStk;
                const displayName = item.name || item.product_name || "Product";
                const displayId = item.product_id || item.id;
                const catStyle = getCatColor(item.category);
                const stockPercent = Math.min(100, Math.round((stock / Math.max(minStk * 3, 30)) * 100));
                const deficit = minStk - stock;
                const isSelected = selectedIds.includes(displayId);

                return (
                  <tr key={displayId} className={`admin-table-row ${isSelected ? "row-selected" : ""}`}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelectToggle(displayId)}
                      />
                    </td>
                    <td>
                      <div className="product-thumb-container">
                        <img
                          src={getProductImage(item)}
                          alt={displayName}
                          className="product-table-thumb"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/100x100?text=${encodeURIComponent(
                              displayName
                            )}`;
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <strong className="product-cell-name">{displayName}</strong>
                    </td>
                    <td>
                      <span className="table-sku-badge">SKU-#{displayId}</span>
                    </td>
                    <td>
                      <span
                        className="badge-cat-tag"
                        style={{
                          backgroundColor: catStyle.bg,
                          color: catStyle.text,
                          border: `1px solid ${catStyle.border}`,
                        }}
                      >
                        {item.category || "General"}
                      </span>
                    </td>
                    <td>
                      <strong className="table-price-val">
                        ₹{Number(item.price || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <div className="table-stock-cell">
                        <strong className={`stock-number ${isOut ? "text-red" : isLow ? "text-amber" : "text-emerald"}`}>
                          {stock} units
                        </strong>
                        <div className="stock-progress-track">
                          <div
                            className={`stock-progress-fill ${isOut ? "fill-red" : isLow ? "fill-amber" : "fill-emerald"}`}
                            style={{ width: isOut ? "4%" : `${stockPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="safety-threshold-cell">
                        <span className="threshold-pill">Min: {minStk} units</span>
                        {isOut ? (
                          <span className="deficit-tag tag-out">Deficit: -{minStk}</span>
                        ) : isLow ? (
                          <span className="deficit-tag tag-low">Deficit: -{deficit}</span>
                        ) : (
                          <span className="deficit-tag tag-ok">Safe (+{stock - minStk})</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {isOut ? (
                        <span className="badge-stock out">
                          <XCircle size={13} className="mr-1 inline" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="badge-stock low">
                          <AlertTriangle size={13} className="mr-1 inline" /> Low Stock ({stock})
                        </span>
                      ) : (
                        <span className="badge-stock in">
                          <CheckCircle2 size={13} className="mr-1 inline" /> In Stock
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="stock-update-actions-cell">
                        <button
                          className="btn-quick-add-inline"
                          onClick={() => handleQuickRowRestock(item, 10)}
                          title="Instant +10 units replenishment"
                        >
                          +10
                        </button>
                        <button
                          className="btn-restock-action"
                          onClick={() => openRestockModal(item)}
                          title="Open stock replenishment controls"
                        >
                          <Plus size={14} />
                          <span>Update Stock</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="10" className="table-empty-row">
                    <div className="empty-catalog-box">
                      <Boxes size={38} className="text-slate-muted" />
                      <h4>No inventory records found</h4>
                      <p>No inventory items match the current search or status filter.</p>
                      <button
                        className="btn-reset-filters"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("all");
                          setStockStatusFilter("all");
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

          {/* PAGINATION BAR */}
          {totalFiltered > 0 && itemsPerPage !== "all" && (
            <div className="admin-pagination-bar">
              <span className="pagination-info">
                Showing{" "}
                <strong>
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    totalFiltered
                  )}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(currentPage * itemsPerPage, totalFiltered)}
                </strong>{" "}
                of <strong>{totalFiltered}</strong> items
              </span>

              <div className="pagination-controls">
                <button
                  className="btn-page-nav"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-num-pill ${pageNum === currentPage ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className="btn-page-nav"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESTOCK MODAL */}
      {restockProduct && (
        <div className="modal-backdrop-overlay" onClick={closeRestockModal}>
          <div
            className="admin-modal-card admin-inventory-restock-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-line">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge bg-blue-subtle">
                  <Boxes size={18} className="text-blue" />
                </div>
                <div>
                  <h3>Update Product Stock</h3>
                  <p className="modal-sub-desc">
                    {restockProduct.name || restockProduct.product_name || "Product"} &bull; SKU #{restockProduct.product_id || restockProduct.id}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeRestockModal} title="Close">
                <X size={18} />
              </button>
            </div>

            {updateError && (
              <div className="modal-error-banner">
                <AlertTriangle size={16} />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="admin-modal-form">
              <div className="restock-meta-box">
                <div className="meta-pill">
                  <span>Current Available:</span>
                  <strong>{restockProduct.stock !== undefined ? restockProduct.stock : (restockProduct.quantity || 0)} units</strong>
                </div>
                <div className="meta-pill">
                  <span>Department:</span>
                  <strong>{restockProduct.category || "General"}</strong>
                </div>
                <div className="meta-pill">
                  <span>Target Update:</span>
                  <strong className="text-blue">
                    {restockQuantity !== "" ? `${restockQuantity} units` : "--"}
                    {Number(restockQuantity) > Number(restockProduct.stock !== undefined ? restockProduct.stock : (restockProduct.quantity || 0)) && (
                      <span className="text-emerald text-xs ml-1 font-semibold">
                        (+{Number(restockQuantity) - Number(restockProduct.stock !== undefined ? restockProduct.stock : (restockProduct.quantity || 0))})
                      </span>
                    )}
                  </strong>
                </div>
                <div className="meta-pill">
                  <span>Unit Price:</span>
                  <strong className="text-emerald">₹{Number(restockProduct.price || 0).toLocaleString()}</strong>
                </div>
              </div>

              {/* QUICK INCREMENT BUTTONS */}
              <div className="form-group-item">
                <label>Quick Increment Options</label>
                <div className="quick-add-btn-group">
                  <button
                    type="button"
                    className="btn-quick-qty"
                    onClick={() => handleQuickIncrement(5)}
                  >
                    +5 Units
                  </button>
                  <button
                    type="button"
                    className="btn-quick-qty"
                    onClick={() => handleQuickIncrement(10)}
                  >
                    +10 Units
                  </button>
                  <button
                    type="button"
                    className="btn-quick-qty"
                    onClick={() => handleQuickIncrement(25)}
                  >
                    +25 Units
                  </button>
                  <button
                    type="button"
                    className="btn-quick-qty"
                    onClick={() => handleQuickIncrement(50)}
                  >
                    +50 Units
                  </button>
                  <button
                    type="button"
                    className="btn-quick-qty"
                    onClick={() => handleQuickIncrement(100)}
                  >
                    +100 Units
                  </button>
                </div>
              </div>

              <div className="form-duo-row">
                <div className="form-group-item">
                  <label>New Stock Quantity <span className="text-red">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-item">
                  <label>Reorder Level (Min Stock) <span className="text-red">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={minStockValue}
                    onChange={(e) => setMinStockValue(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeRestockModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="btn-loading-flex">
                      <RefreshCw size={14} className="animate-spin mr-1" /> Saving Stock...
                    </span>
                  ) : (
                    "Update Stock"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;