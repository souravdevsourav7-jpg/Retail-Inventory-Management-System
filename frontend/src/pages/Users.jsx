import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users as UsersIcon,
  Shield,
  User,
  RefreshCw,
  Search,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  Eye,
  X,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Selected customer for order details modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const token = localStorage.getItem("token");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data);
    } catch (err) {
      console.error("USERS FETCH ERROR:", err);
      setError(err.response?.data?.message || "Failed to load customers and users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function openCustomerOrders(customer) {
    setSelectedCustomer(customer);
    setCustomerOrders([]);
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await axios.get(
        `/api/customers/${customer.id}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCustomerOrders(response.data);
    } catch (err) {
      console.error("CUSTOMER ORDERS FETCH ERROR:", err);
      setOrdersError(
        err.response?.data?.message || "Failed to load customer orders"
      );
    } finally {
      setOrdersLoading(false);
    }
  }

  function closeCustomerOrders() {
    setSelectedCustomer(null);
    setCustomerOrders([]);
    setOrdersError("");
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.mobile && u.mobile.includes(searchQuery)) ||
      String(u.id).includes(searchQuery);

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "customer" && u.role === "user") ||
      (roleFilter === "admin" && u.role === "admin");

    return matchesSearch && matchesRole;
  });

  // Metrics
  const totalUsersCount = users.length;
  const customersCount = users.filter((u) => u.role === "user").length;
  const totalOrdersCount = users.reduce(
    (sum, u) => sum + Number(u.total_orders || 0),
    0
  );
  const totalCustomerSpend = users.reduce(
    (sum, u) => sum + Number(u.total_spent || 0),
    0
  );

  return (
    <div className="users-page-container">
      {/* HEADER ROW */}
      <div className="users-header-row">
        <div>
          <h2>Customers & User Accounts</h2>
          <p className="users-subtitle">
            Manage registered customers, track purchase history, and inspect individual order details.
          </p>
        </div>
        <button onClick={loadUsers} className="btn-refresh-dashboard">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="customer-stats-grid">
        <div className="customer-stat-card">
          <div className="stat-card-icon icon-blue">
            <UsersIcon size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Accounts</span>
            <h3 className="stat-value">{totalUsersCount}</h3>
            <span className="stat-sub">{customersCount} Active Shoppers</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-card-icon icon-purple">
            <User size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Registered Customers</span>
            <h3 className="stat-value">{customersCount}</h3>
            <span className="stat-sub">Store buyers</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-card-icon icon-amber">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Orders Placed</span>
            <h3 className="stat-value">{totalOrdersCount}</h3>
            <span className="stat-sub">Across all customers</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-card-icon icon-emerald">
            <IndianRupee size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Customer Revenue</span>
            <h3 className="stat-value">₹{totalCustomerSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
            <span className="stat-sub">Total lifetime spend</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="table-controls-bar">
        <div className="search-box-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search customer by name, email, phone or ID..."
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
          <label className="filter-label">Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles ({totalUsersCount})</option>
            <option value="customer">Customers Only ({customersCount})</option>
            <option value="admin">Administrators ({totalUsersCount - customersCount})</option>
          </select>
        </div>
      </div>

      {/* MAIN TABLE */}
      {loading ? (
        <div className="dashboard-loading-container">
          <div className="spinner"></div>
          <p>Loading customers & user records...</p>
        </div>
      ) : error ? (
        <div className="dashboard-error-box">
          <p>{error}</p>
        </div>
      ) : (
        <div className="dashboard-widget">
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Role</th>
                  <th>Contact Details</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Latest Order</th>
                  <th>Customer Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table-cell">
                      <div className="empty-table-state">
                        <UsersIcon size={36} className="empty-icon" />
                        <p>No customers match your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const initials = (u.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="customer-profile-cell">
                            <div className="customer-avatar-badge">
                              {initials}
                            </div>
                            <div className="customer-info-meta">
                              <span className="customer-name-bold">
                                {u.name || "Customer"}
                              </span>
                              <span className="customer-id-pill">ID #{u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              u.role === "admin"
                                ? "badge-purple"
                                : "badge-info"
                            }`}
                          >
                            {u.role === "admin" ? (
                              <>
                                <Shield size={12} style={{ marginRight: "4px" }} /> Admin
                              </>
                            ) : (
                              <>
                                <User size={12} style={{ marginRight: "4px" }} /> Customer
                              </>
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="contact-details-cell">
                            <span className="contact-email">
                              <Mail size={13} /> {u.email}
                            </span>
                            {u.mobile ? (
                              <span className="contact-phone">
                                <Phone size={13} /> {u.mobile}
                              </span>
                            ) : (
                              <span className="contact-phone-na">No phone added</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="order-count-pill">
                            <ShoppingBag size={14} />
                            <span>{u.total_orders || 0}</span>
                          </div>
                        </td>

                        <td>
                          <span className="spend-amount-bold">
                            ₹{Number(u.total_spent || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        <td>
                          {u.latest_order_date ? (
                            <span className="latest-order-date">
                              <Calendar size={13} />
                              {new Date(u.latest_order_date).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="no-activity-text">—</span>
                          )}
                        </td>

                        <td>
                          {u.role === "admin" ? (
                            <span className="status-badge badge-purple">
                              Admin Staff
                            </span>
                          ) : Number(u.total_orders || 0) > 0 ? (
                            <span className="status-badge badge-success">
                              Active Buyer
                            </span>
                          ) : (
                            <span className="status-badge badge-neutral">
                              Registered
                            </span>
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => openCustomerOrders(u)}
                            className="btn-action-primary"
                            title="View Customer Order Details"
                          >
                            <Eye size={14} /> View Orders ({u.total_orders || 0})
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER + PRODUCT + ORDER DETAILS MODAL / DRAWER */}
      {selectedCustomer && (
        <div className="modal-backdrop-overlay" onClick={closeCustomerOrders}>
          <div
            className="customer-orders-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="modal-header">
              <div className="modal-title-box">
                <div className="customer-modal-avatar">
                  {(selectedCustomer.name || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="modal-customer-heading">
                    <h3>{selectedCustomer.name}</h3>
                    <span
                      className={`status-badge ${
                        selectedCustomer.role === "admin"
                          ? "badge-purple"
                          : "badge-info"
                      }`}
                    >
                      {selectedCustomer.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </div>
                  <div className="modal-customer-contact">
                    <span>
                      <Mail size={13} /> {selectedCustomer.email}
                    </span>
                    {selectedCustomer.mobile && (
                      <span>
                        <Phone size={13} /> {selectedCustomer.mobile}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={closeCustomerOrders}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* CUSTOMER STAT SUMMARY */}
            <div className="modal-summary-strip">
              <div className="summary-pill-item">
                <span className="summary-pill-label">Total Orders</span>
                <strong className="summary-pill-value">
                  {selectedCustomer.total_orders || customerOrders.length}
                </strong>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Total Spend</span>
                <strong className="summary-pill-value spend-green">
                  ₹{Number(selectedCustomer.total_spent || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="summary-pill-item">
                <span className="summary-pill-label">Customer ID</span>
                <strong className="summary-pill-value">#{selectedCustomer.id}</strong>
              </div>
            </div>

            {/* MODAL CONTENT: ORDERS LIST */}
            <div className="modal-orders-body">
              <h4 className="orders-section-title">
                <ShoppingBag size={16} /> Order & Product History
              </h4>

              {ordersLoading ? (
                <div className="modal-loading-box">
                  <div className="spinner"></div>
                  <p>Loading customer order details...</p>
                </div>
              ) : ordersError ? (
                <div className="dashboard-error-box">
                  <p>{ordersError}</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="modal-empty-state">
                  <Package size={40} className="empty-box-icon" />
                  <h4>No Orders Found</h4>
                  <p>This customer has not placed any orders in the store yet.</p>
                </div>
              ) : (
                <div className="customer-order-cards-list">
                  {customerOrders.map((order) => (
                    <div className="order-detail-card" key={order.id}>
                      {/* CARD TOP BAR */}
                      <div className="order-card-header">
                        <div className="order-card-id-block">
                          <span className="order-number-badge">
                            Order #{order.id}
                          </span>
                          <span className="order-timestamp">
                            <Clock size={13} />
                            {new Date(order.created_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>

                        <div className="order-badges-block">
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
                              order.order_status || "Processing"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            Status: {order.order_status || "Processing"}
                          </span>
                        </div>
                      </div>

                      {/* PRODUCT & PRICING DETAILS */}
                      <div className="order-card-product-row">
                        <div className="order-product-thumb">
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

                        <div className="order-product-info">
                          <div className="product-title-row">
                            <h4 className="order-product-name">
                              {order.product_name || `Product #${order.product_id}`}
                            </h4>
                            {order.product_category && (
                              <span className="category-pill-sm">
                                {order.product_category}
                              </span>
                            )}
                          </div>

                          <div className="order-calculation-grid">
                            <div className="calc-item">
                              <span className="calc-label">Quantity:</span>
                              <span className="calc-value font-semibold">
                                {order.quantity} units
                              </span>
                            </div>
                            <div className="calc-item">
                              <span className="calc-label">Unit Price:</span>
                              <span className="calc-value">
                                ₹{Number(order.price || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <div className="calc-item total-highlight">
                              <span className="calc-label">Total Amount:</span>
                              <span className="calc-value-bold">
                                ₹{Number(order.amount || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DELIVERY / LOCATION FOOTER */}
                      <div className="order-card-footer">
                        <div className="location-indicator">
                          <MapPin size={14} className="pin-icon" />
                          <span>
                            Current Stage: <strong>{order.current_location || "Warehouse"}</strong>
                          </span>
                        </div>
                        <div className="order-security-pill">
                          <CheckCircle2 size={13} /> Verified Transaction
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-footer">
              <button onClick={closeCustomerOrders} className="btn-modal-close">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
