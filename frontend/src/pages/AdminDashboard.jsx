import { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Boxes,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  XCircle,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (err) {
      console.error("ADMIN DASHBOARD FETCH ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load dashboard metrics"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper for Order Status Badge
  const renderOrderStatusBadge = (status) => {
    const s = (status || "Processing").toLowerCase();
    let badgeClass = "badge-neutral";
    if (s.includes("delivered")) badgeClass = "badge-success";
    else if (s.includes("shipped") || s.includes("delivery"))
      badgeClass = "badge-info";
    else if (s.includes("processing") || s.includes("packed"))
      badgeClass = "badge-warning";
    else if (s.includes("cancel")) badgeClass = "badge-danger";

    return <span className={`status-badge ${badgeClass}`}>{status || "Processing"}</span>;
  };

  // Helper for Payment Status Badge
  const renderPaymentStatusBadge = (status) => {
    const s = (status || "Pending").toLowerCase();
    let badgeClass = "badge-neutral";
    if (s === "paid") badgeClass = "badge-success";
    else if (s === "pending") badgeClass = "badge-warning";
    else if (s === "failed") badgeClass = "badge-danger";
    else if (s === "refunded") badgeClass = "badge-purple";

    return <span className={`status-badge ${badgeClass}`}>{status || "Pending"}</span>;
  };

  if (loading && !data) {
    return (
      <div className="dashboard-loading-container">
        <div className="spinner"></div>
        <p>Loading real-time retail analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-error-box">
        <AlertTriangle size={36} color="#ef4444" />
        <h3>Failed to load store metrics</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn-retry">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const {
    totalProducts = 0,
    totalStock = 0,
    lowStock = 0,
    outOfStock = 0,
    healthyStock = 0,
    totalSales = 0,
    todaySales = 0,
    totalOrders = 0,
    pendingOrders = 0,
    deliveredOrders = 0,
    salesTimeline = [],
    recentOrders = [],
    topSellingProducts = [],
    lowStockProducts = [],
    orderStatusCounts = [],
    paymentStatusCounts = [],
  } = data || {};

  // Find max sold for top sellers progress bar calculation
  const maxSold = Math.max(
    1,
    ...topSellingProducts.map((p) => Number(p.total_sold || 0))
  );

  return (
    <div className="admin-dashboard-container">
      {/* ================= DASHBOARD HEADER ================= */}
      <div className="dashboard-welcome-banner">
        <div>
          <h1>Welcome, Admin!</h1>
          <p>Here's what's happening with your store today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-refresh-dashboard"
          title="Refresh store metrics"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ================= KPI CARDS (5 CARDS) ================= */}
      <div className="kpi-grid">
        {/* CARD 1: TOTAL PRODUCTS */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Products</span>
            <div className="kpi-icon-wrapper icon-blue">
              <Package size={22} />
            </div>
          </div>
          <div className="kpi-number">{totalProducts}</div>
          <div className="kpi-footer text-muted">
            <span className="kpi-highlight">{healthyStock}</span> in healthy stock
          </div>
        </div>

        {/* CARD 2: TOTAL STOCK */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Stock</span>
            <div className="kpi-icon-wrapper icon-emerald">
              <Boxes size={22} />
            </div>
          </div>
          <div className="kpi-number">
            {totalStock.toLocaleString("en-IN")}{" "}
            <span className="kpi-unit">units</span>
          </div>
          <div className="kpi-footer text-muted">
            Across {totalProducts} catalog products
          </div>
        </div>

        {/* CARD 3: TODAY'S SALES */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Today's Sales</span>
            <div className="kpi-icon-wrapper icon-amber">
              <IndianRupee size={22} />
            </div>
          </div>
          <div className="kpi-number">
            ₹{Number(todaySales).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="kpi-footer text-muted">
            Lifetime revenue: ₹{Number(totalSales).toLocaleString("en-IN")}
          </div>
        </div>

        {/* CARD 4: LOW STOCK PRODUCTS */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Low Stock</span>
            <div className="kpi-icon-wrapper icon-rose">
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="kpi-number text-danger">{lowStock}</div>
          <div className="kpi-footer text-danger">
            {outOfStock > 0 ? `${outOfStock} items out of stock` : "Needs inventory restocking"}
          </div>
        </div>

        {/* CARD 5: TOTAL ORDERS */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Orders</span>
            <div className="kpi-icon-wrapper icon-purple">
              <ShoppingBag size={22} />
            </div>
          </div>
          <div className="kpi-number">{totalOrders}</div>
          <div className="kpi-footer text-muted">
            <span className="kpi-highlight" style={{ color: pendingOrders > 0 ? "#d97706" : "#059669" }}>
              {pendingOrders}
            </span>{" "}
            pending fulfillment
          </div>
        </div>
      </div>

      {/* ================= MIDDLE ROW: SALES OVERVIEW + INVENTORY STATUS ================= */}
      <div className="dashboard-two-col">
        {/* SALES OVERVIEW CHART */}
        <div className="dashboard-widget sales-overview-widget">
          <div className="widget-header">
            <div>
              <h3>Sales Overview</h3>
              <p className="widget-subtitle">Revenue trend for recent days</p>
            </div>
            <div className="widget-badge">
              <TrendingUp size={16} /> Real Orders
            </div>
          </div>

          <div className="chart-wrapper">
            {salesTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={salesTimeline}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toFixed(2)}`, "Revenue"]}
                    labelStyle={{ fontWeight: "bold", color: "#111827" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">
                <ShoppingBag size={40} strokeWidth={1.5} color="#9ca3af" />
                <p>No sales activity recorded in recent days yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* INVENTORY STATUS CARD */}
        <div className="dashboard-widget inventory-status-widget">
          <div className="widget-header">
            <div>
              <h3>Inventory Status</h3>
              <p className="widget-subtitle">Live health across catalog units</p>
            </div>
            <span className="units-badge">{totalStock} Total Units</span>
          </div>

          <div className="inventory-breakdown-list">
            <div className="inventory-status-bar">
              <div
                className="bar-segment bar-healthy"
                style={{
                  width: `${totalProducts > 0 ? (healthyStock / totalProducts) * 100 : 0}%`,
                }}
                title={`Healthy: ${healthyStock}`}
              ></div>
              <div
                className="bar-segment bar-low"
                style={{
                  width: `${totalProducts > 0 ? (lowStock / totalProducts) * 100 : 0}%`,
                }}
                title={`Low Stock: ${lowStock}`}
              ></div>
              <div
                className="bar-segment bar-out"
                style={{
                  width: `${totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0}%`,
                }}
                title={`Out of Stock: ${outOfStock}`}
              ></div>
            </div>

            <div className="inventory-metric-row">
              <div className="metric-left">
                <span className="dot dot-emerald"></span>
                <span className="metric-name">In Stock (Healthy)</span>
              </div>
              <span className="metric-val">{healthyStock} products</span>
            </div>

            <div className="inventory-metric-row">
              <div className="metric-left">
                <span className="dot dot-amber"></span>
                <span className="metric-name">Low Stock (≤ 10 units)</span>
              </div>
              <span className="metric-val text-amber">{lowStock} products</span>
            </div>

            <div className="inventory-metric-row">
              <div className="metric-left">
                <span className="dot dot-rose"></span>
                <span className="metric-name">Out of Stock (0 units)</span>
              </div>
              <span className="metric-val text-danger">{outOfStock} products</span>
            </div>

            <div className="inventory-metric-row total-row">
              <div className="metric-left">
                <span className="dot dot-blue"></span>
                <span className="metric-name">Total Stock Units</span>
              </div>
              <span className="metric-val font-bold">{totalStock} units</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate("inventory")}
            className="widget-action-link"
          >
            Manage Inventory <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ================= RECENT ORDERS TABLE ================= */}
      <div className="dashboard-widget recent-orders-widget">
        <div className="widget-header">
          <div>
            <h3>Recent Orders</h3>
            <p className="widget-subtitle">Latest customer purchases</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("sales")}
            className="widget-header-btn"
          >
            View All Orders ({totalOrders}) <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-semibold">#{order.id}</td>
                    <td>
                      <div className="table-product-cell">
                        {order.product_image ? (
                          <img
                            src={`${order.product_image}`}
                            alt={order.product_name}
                            className="table-product-thumb"
                          />
                        ) : (
                          <div className="table-product-placeholder">📦</div>
                        )}
                        <span className="table-product-name" title={order.product_name}>
                          {order.product_name || `Product #${order.product_id}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table-customer-cell">
                        <span className="customer-name">{order.user_name || "Customer"}</span>
                        {order.user_email && (
                          <span className="customer-email">{order.user_email}</span>
                        )}
                      </div>
                    </td>
                    <td className="font-semibold">
                      ₹{Number(order.amount || 0).toFixed(2)}
                    </td>
                    <td>{renderOrderStatusBadge(order.order_status)}</td>
                    <td>{renderPaymentStatusBadge(order.payment_status)}</td>
                    <td className="text-muted">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-muted">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BOTTOM ROW: TOP SELLING & LOW STOCK TABLES ================= */}
      <div className="dashboard-two-col">
        {/* TOP SELLING PRODUCTS */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <div>
              <h3>Top Selling Products</h3>
              <p className="widget-subtitle">By total quantity sold</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate("products")}
              className="widget-header-btn"
            >
              Catalog <ArrowRight size={14} />
            </button>
          </div>

          <div className="top-sellers-list">
            {topSellingProducts.length > 0 ? (
              topSellingProducts.map((prod) => {
                const sold = Number(prod.total_sold || 0);
                const pct = Math.round((sold / maxSold) * 100);
                return (
                  <div key={prod.id} className="top-seller-item">
                    <div className="top-seller-img-box">
                      {prod.image ? (
                        <img
                          src={`${prod.image}`}
                          alt={prod.name}
                        />
                      ) : (
                        <div className="thumb-placeholder">📦</div>
                      )}
                    </div>
                    <div className="top-seller-info">
                      <div className="top-seller-title-row">
                        <span className="seller-name">{prod.name}</span>
                        <span className="seller-qty">
                          <strong>{sold}</strong> sold
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        ></div>
                      </div>
                      <span className="seller-sub">
                        ₹{Number(prod.price || 0).toFixed(2)} • Stock: {prod.stock}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-text">No sales data yet.</p>
            )}
          </div>
        </div>

        {/* LOW STOCK PRODUCTS TABLE */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <div>
              <h3>Low Stock Alerts</h3>
              <p className="widget-subtitle">Products requiring attention</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate("products")}
              className="widget-header-btn"
            >
              Restock <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="modern-table compact-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td className="font-semibold">{prod.name}</td>
                      <td className="text-muted">{prod.category || "General"}</td>
                      <td className="font-semibold text-danger">
                        {prod.stock} units
                      </td>
                      <td>
                        {prod.stock === 0 ? (
                          <span className="status-badge badge-danger">Out of Stock</span>
                        ) : (
                          <span className="status-badge badge-warning">Low Stock</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-emerald">
                      ✓ All products have healthy stock levels!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= ORDER & PAYMENT STATUS OVERVIEW ================= */}
      <div className="dashboard-widget status-summary-widget">
        <div className="widget-header">
          <div>
            <h3>Order & Payment Status Overview</h3>
            <p className="widget-subtitle">Summary distribution across lifecycle stages</p>
          </div>
        </div>

        <div className="status-cards-grid">
          {/* ORDER STAGES */}
          <div className="status-group-card">
            <h4>Order Fulfillment Stages</h4>
            <div className="status-chips-wrap">
              {[
                { label: "Pending", icon: Clock, color: "chip-amber" },
                { label: "Processing", icon: RefreshCw, color: "chip-blue" },
                { label: "Shipped", icon: Truck, color: "chip-cyan" },
                { label: "Out for Delivery", icon: Truck, color: "chip-indigo" },
                { label: "Delivered", icon: CheckCircle, color: "chip-emerald" },
                { label: "Cancelled", icon: XCircle, color: "chip-rose" },
              ].map(({ label, icon: Icon, color }) => {
                const countObj = orderStatusCounts.find(
                  (c) => c.status_name?.toLowerCase() === label.toLowerCase()
                );
                const count = countObj ? countObj.count : 0;
                return (
                  <div key={label} className={`status-chip ${color}`}>
                    <Icon size={16} />
                    <span className="chip-label">{label}</span>
                    <strong className="chip-count">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PAYMENT STAGES */}
          <div className="status-group-card">
            <h4>Payment Settlement Stages</h4>
            <div className="status-chips-wrap">
              {[
                { label: "Paid", icon: CheckCircle, color: "chip-emerald" },
                { label: "Pending", icon: Clock, color: "chip-amber" },
                { label: "Failed", icon: XCircle, color: "chip-rose" },
                { label: "Refunded", icon: RotateCcw, color: "chip-purple" },
              ].map(({ label, icon: Icon, color }) => {
                const countObj = paymentStatusCounts.find(
                  (c) => c.status_name?.toLowerCase() === label.toLowerCase()
                );
                const count = countObj ? countObj.count : 0;
                return (
                  <div key={label} className={`status-chip ${color}`}>
                    <Icon size={16} />
                    <span className="chip-label">{label}</span>
                    <strong className="chip-count">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
