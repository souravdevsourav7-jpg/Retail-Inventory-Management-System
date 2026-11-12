import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShoppingBag,
  IndianRupee,
  CreditCard,
  Truck,
  Search,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  AlertCircle,
  X,
} from "lucide-react";

function Sales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Updating feedback tracking by order ID
  const [updatingId, setUpdatingId] = useState(null);
  const [successId, setSuccessId] = useState(null);

  const token = localStorage.getItem("token");

  function getAuthConfig() {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "/api/orders",
        getAuthConfig()
      );

      setOrders(response.data);
    } catch (err) {
      console.error("SALES FETCH ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load customer orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function handleFieldChange(id, field, value) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, [field]: value } : order
      )
    );
  }

  async function handleUpdateOrder(order) {
    try {
      setUpdatingId(order.id);
      setSuccessId(null);

      await axios.put(
        `/api/orders/${order.id}`,
        {
          payment_status: order.payment_status || "Pending",
          order_status: order.order_status || "Processing",
          current_location: order.current_location || "Warehouse",
        },
        getAuthConfig()
      );

      setSuccessId(order.id);
      setTimeout(() => {
        setSuccessId((curr) => (curr === order.id ? null : curr));
      }, 3000);
    } catch (err) {
      console.error("UPDATE ORDER ERROR:", err);
      alert(
        err.response?.data?.message || "Order update failed. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      String(order.id).includes(q) ||
      (order.user_name && order.user_name.toLowerCase().includes(q)) ||
      (order.user_email && order.user_email.toLowerCase().includes(q)) ||
      (order.user_phone && order.user_phone.includes(q)) ||
      (order.product_name && order.product_name.toLowerCase().includes(q));

    const currentDelivery = (
      order.order_status ||
      order.status ||
      "Processing"
    ).toLowerCase();

    let matchesTab = true;
    if (statusTab !== "all") {
      matchesTab = currentDelivery === statusTab.toLowerCase();
    }

    let matchesPayment = true;
    if (paymentFilter !== "all") {
      matchesPayment =
        (order.payment_status || "Pending").toLowerCase() ===
        paymentFilter.toLowerCase();
    }

    return matchesSearch && matchesTab && matchesPayment;
  });

  // KPI Calculations
  const totalOrdersCount = orders.length;
  const totalSalesRevenue = orders.reduce((sum, o) => {
    if (o.payment_status !== "Failed") {
      return sum + Number(o.amount || o.total || 0);
    }
    return sum;
  }, 0);
  const paidOrdersCount = orders.filter((o) => o.payment_status === "Paid").length;
  const deliveredOrdersCount = orders.filter(
    (o) => (o.order_status || o.status) === "Delivered"
  ).length;

  return (
    <div className="sales-page-container">
      {/* HEADER */}
      <div className="users-header-row">
        <div>
          <h2>Sales & Order Fulfillment</h2>
          <p className="users-subtitle">
            Comprehensive audit of all customer transactions: verify who purchased what, update delivery stages, and record payments.
          </p>
        </div>
        <button onClick={loadOrders} className="btn-refresh-dashboard">
          <RefreshCw size={16} /> Refresh Orders
        </button>
      </div>

      {/* KPI STATS STRIP */}
      <div className="customer-stats-grid">
        <div className="customer-stat-card">
          <div className="stat-card-icon icon-blue">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Orders</span>
            <h3 className="stat-value">{totalOrdersCount}</h3>
            <span className="stat-sub">Across all shoppers</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-card-icon icon-emerald">
            <IndianRupee size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Sales Revenue</span>
            <h3 className="stat-value">
              ₹{totalSalesRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <span className="stat-sub">Excluding failed payments</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-card-icon icon-purple">
            <CreditCard size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Paid Transactions</span>
            <h3 className="stat-value">{paidOrdersCount}</h3>
            <span className="stat-sub">
              {totalOrdersCount > 0
                ? `${Math.round((paidOrdersCount / totalOrdersCount) * 100)}% payment success`
                : "0%"}
            </span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-card-icon icon-amber">
            <Truck size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Delivered Orders</span>
            <h3 className="stat-value">{deliveredOrdersCount}</h3>
            <span className="stat-sub">Completed customer deliveries</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="sales-tabs-strip">
        <button
          className={`sales-tab-btn ${statusTab === "all" ? "active" : ""}`}
          onClick={() => setStatusTab("all")}
        >
          All Orders ({totalOrdersCount})
        </button>
        <button
          className={`sales-tab-btn ${statusTab === "processing" ? "active" : ""}`}
          onClick={() => setStatusTab("processing")}
        >
          Processing (
          {
            orders.filter(
              (o) => (o.order_status || o.status || "Processing") === "Processing"
            ).length
          }
          )
        </button>
        <button
          className={`sales-tab-btn ${statusTab === "shipped" ? "active" : ""}`}
          onClick={() => setStatusTab("shipped")}
        >
          Shipped (
          {
            orders.filter(
              (o) => (o.order_status || o.status) === "Shipped"
            ).length
          }
          )
        </button>
        <button
          className={`sales-tab-btn ${statusTab === "out for delivery" ? "active" : ""}`}
          onClick={() => setStatusTab("out for delivery")}
        >
          Out for Delivery (
          {
            orders.filter(
              (o) => (o.order_status || o.status) === "Out for Delivery"
            ).length
          }
          )
        </button>
        <button
          className={`sales-tab-btn ${statusTab === "delivered" ? "active" : ""}`}
          onClick={() => setStatusTab("delivered")}
        >
          Delivered ({deliveredOrdersCount})
        </button>
        <button
          className={`sales-tab-btn ${statusTab === "cancelled" ? "active" : ""}`}
          onClick={() => setStatusTab("cancelled")}
        >
          Cancelled (
          {
            orders.filter(
              (o) => (o.order_status || o.status) === "Cancelled"
            ).length
          }
          )
        </button>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by order #, customer, email, phone, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="search-clear-btn"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <label className="filter-label">Payment:</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* ORDERS LIST */}
      {loading ? (
        <div className="dashboard-loading-container">
          <div className="spinner"></div>
          <p>Loading real-time order history...</p>
        </div>
      ) : error ? (
        <div className="dashboard-error-box">
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="dashboard-widget empty-state-box">
          <ShoppingBag size={48} className="empty-icon-lg" />
          <h3>No Orders Found</h3>
          <p>No customer orders match your chosen filters.</p>
        </div>
      ) : (
        <div className="modern-order-cards-stack">
          {filteredOrders.map((order) => {
            const customerInitials = (order.user_name || "C")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const isCurrentlyUpdating = updatingId === order.id;
            const isJustUpdated = successId === order.id;

            return (
              <div className="modern-order-row-card" key={order.id}>
                {/* CARD TOP INFO BAR */}
                <div className="order-row-topbar">
                  <div className="order-id-group">
                    <span className="order-id-highlight">Order #{order.id}</span>
                    <span className="order-date-text">
                      <Calendar size={13} />
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </span>
                  </div>

                  <div className="order-badges-group">
                    <span
                      className={`status-badge payment-${(
                        order.payment_status || "Pending"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      Payment: {order.payment_status || "Pending"}
                    </span>
                    <span
                      className={`status-badge delivery-${(
                        order.order_status || order.status || "Processing"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      Status: {order.order_status || order.status || "Processing"}
                    </span>
                  </div>
                </div>

                {/* MAIN CONTENT 3-COLUMN GRID */}
                <div className="order-row-grid">
                  {/* COLUMN 1: CUSTOMER DETAILS */}
                  <div className="order-col-section col-customer">
                    <div className="col-header-label">
                      <User size={14} /> Customer Information
                    </div>
                    <div className="customer-info-content">
                      <div className="customer-avatar-badge">{customerInitials}</div>
                      <div className="customer-text-meta">
                        <strong className="customer-name-lg">
                          {order.user_name || "Customer"}
                        </strong>
                        <span className="customer-email-line">
                          <Mail size={12} /> {order.user_email || "N/A"}
                        </span>
                        {order.user_phone ? (
                          <span className="customer-phone-line">
                            <Phone size={12} /> {order.user_phone}
                          </span>
                        ) : (
                          <span className="customer-phone-muted">No phone recorded</span>
                        )}
                        <span className="customer-id-tag">User ID: #{order.user_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: PRODUCT DETAILS */}
                  <div className="order-col-section col-product">
                    <div className="col-header-label">
                      <Package size={14} /> Purchased Product
                    </div>
                    <div className="product-info-content">
                      <div className="product-thumb-box">
                        {order.product_image ? (
                          <img
                            src={
                              order.product_image.startsWith("http")
                                ? order.product_image
                                : `${order.product_image}`
                            }
                            alt={order.product_name || "Product"}
                          />
                        ) : (
                          <div className="product-placeholder">📦</div>
                        )}
                      </div>

                      <div className="product-text-meta">
                        <h4 className="product-title-bold">
                          {order.product_name || `Product #${order.product_id}`}
                        </h4>
                        {order.product_category && (
                          <span className="category-pill-sm">
                            {order.product_category}
                          </span>
                        )}
                        <div className="product-math-row">
                          <span>
                            Quantity: <strong>{order.quantity || 1} units</strong>
                          </span>
                          <span>
                            Price: ₹{Number(order.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="order-total-price-tag">
                          Total: ₹{Number(order.amount || order.total || 0).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 3: STATUS CONTROL & LOCATION */}
                  <div className="order-col-section col-status-controls">
                    <div className="col-header-label">
                      <MapPin size={14} /> Order Management & Stages
                    </div>

                    <div className="status-form-group">
                      <div className="control-item">
                        <label>Delivery Status:</label>
                        <select
                          value={order.order_status || order.status || "Processing"}
                          onChange={(e) =>
                            handleFieldChange(order.id, "order_status", e.target.value)
                          }
                          className="status-select-control"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="control-item">
                        <label>Payment Status:</label>
                        <select
                          value={order.payment_status || "Pending"}
                          onChange={(e) =>
                            handleFieldChange(order.id, "payment_status", e.target.value)
                          }
                          className="status-select-control"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>

                      <div className="control-item">
                        <label>Current Location:</label>
                        <select
                          value={order.current_location || "Warehouse"}
                          onChange={(e) =>
                            handleFieldChange(order.id, "current_location", e.target.value)
                          }
                          className="status-select-control"
                        >
                          <option value="Warehouse">Warehouse</option>
                          <option value="Processing Center">Processing Center</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivery Hub">Delivery Hub</option>
                          <option value="Customer">Customer</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleUpdateOrder(order)}
                        disabled={isCurrentlyUpdating}
                        className={`btn-save-order-status ${isJustUpdated ? "btn-success" : ""}`}
                      >
                        {isCurrentlyUpdating ? (
                          <>
                            <div className="mini-spinner"></div> Updating...
                          </>
                        ) : isJustUpdated ? (
                          <>
                            <Check size={16} /> Saved Successfully
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Update Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Sales;