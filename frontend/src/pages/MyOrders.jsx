import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Package,
  ShoppingBag,
  Truck,
  RefreshCw,
  CalendarDays,
  MapPin,
  IndianRupee,
  ReceiptText,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import "./MyOrders.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("userToken") ||
  "";

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getOrderId = (order) =>
  order?._id || order?.orderId || order?.id || order?.OrderID || "";

const getOrderStatus = (order) =>
  String(
    order?.status ||
      order?.orderStatus ||
      order?.OrderStatus ||
      "Processing"
  ).toLowerCase().replace(/_/g, " ");

const getPaymentStatus = (order) =>
  String(
    order?.paymentStatus || order?.payment_status || order?.PaymentStatus || "Pending"
  ).toLowerCase();

const getItems = (order) => {
  const items =
    order?.items ||
    order?.orderItems ||
    order?.products ||
    order?.OrderItems ||
    [];

  if (Array.isArray(items)) return items;

  return [];
};

const getProductName = (item) =>
  item?.productName ||
  item?.name ||
  item?.product?.name ||
  item?.ProductName ||
  "Product";

const getProductImage = (item) =>
  item?.image ||
  item?.productImage ||
  item?.product?.image ||
  item?.imageUrl ||
  item?.ImageURL ||
  "";

const getQuantity = (item) =>
  Number(item?.quantity ?? item?.qty ?? item?.Quantity ?? 1);

const getItemPrice = (item) =>
  Number(
    item?.price ??
      item?.unitPrice ??
      item?.product?.price ??
      item?.Price ??
      0
  );

const getOrderTotal = (order) => {
  const total =
    order?.totalAmount ??
    order?.total ??
    order?.grandTotal ??
    order?.TotalAmount ??
    order?.amount;

  if (total !== undefined && total !== null) {
    return Number(total) || 0;
  }

  return getItems(order).reduce(
    (sum, item) => sum + getItemPrice(item) * getQuantity(item),
    0
  );
};

const getStatusClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("deliver")) return "status-delivered";
  if (normalized.includes("cancel")) return "status-cancelled";
  if (normalized.includes("ship")) return "status-shipped";
  if (normalized.includes("out for")) return "status-out-for-delivery";
  if (normalized.includes("fail")) return "status-cancelled";

  return "status-processing";
};

const getPaymentClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("paid") ||
    normalized.includes("success") ||
    normalized.includes("complete")
  ) {
    return "payment-paid";
  }

  if (normalized.includes("fail") || normalized.includes("cancel")) {
    return "payment-failed";
  }

  return "payment-pending";
};

function MyOrders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState("");

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = getToken();

      const response = await axios.get(`${API_BASE}/my-orders`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      const responseData = response.data;

      const fetchedOrders = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.orders)
        ? responseData.orders
        : Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData?.data?.orders)
        ? responseData.data.orders
        : [];

      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;

    return orders.filter((order) => {
      const status = getOrderStatus(order);

      if (activeFilter === "processing") {
        return (
          status.includes("processing") ||
          status.includes("pending") ||
          status.includes("confirm")
        );
      }

      if (activeFilter === "shipped") {
        return (
          status.includes("ship") ||
          status.includes("transit") ||
          status.includes("out for")
        );
      }

      if (activeFilter === "delivered") {
        return status.includes("deliver");
      }

      if (activeFilter === "cancelled") {
        return status.includes("cancel");
      }

      return true;
    });
  }, [orders, activeFilter]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      delivered: orders.filter((order) =>
        getOrderStatus(order).includes("deliver")
      ).length,
      inProgress: orders.filter((order) => {
        const status = getOrderStatus(order);

        return (
          status.includes("processing") ||
          status.includes("pending") ||
          status.includes("ship") ||
          status.includes("transit") ||
          status.includes("out for")
        );
      }).length,
    }),
    [orders]
  );

  const openModal = (order, type) => {
    setSelectedOrder(order);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType("");
  };

  const handleContinueShopping = () => {
    if (typeof onNavigate === "function") {
      onNavigate("products");
      return;
    }

    window.location.href = "/products";
  };

  const getOrderDate = (order) =>
    order?.createdAt ||
    order?.orderDate ||
    order?.date ||
    order?.OrderDate;

  const getOrderItemsLabel = (order) => {
    const items = getItems(order);
    const quantity = items.reduce(
      (sum, item) => sum + getQuantity(item),
      0
    );

    return `${quantity} item${quantity === 1 ? "" : "s"}`;
  };

  const trackingSteps = [
    {
      title: "Order placed",
      description: "Your order has been received.",
      done: true,
    },
    {
      title: "Processing",
      description: "Your items are being prepared.",
      done: ["processing", "shipped", "out for delivery", "delivered"].some(
        (status) => getOrderStatus(selectedOrder).includes(status)
      ),
    },
    {
      title: "Shipped",
      description: "Your package is on its way.",
      done: ["shipped", "out for delivery", "delivered"].some((status) =>
        getOrderStatus(selectedOrder).includes(status)
      ),
    },
    {
      title: "Delivered",
      description: "Your package has reached its destination.",
      done: getOrderStatus(selectedOrder).includes("deliver"),
    },
  ];

  return (
    <main className="user-orders-page-container">
      <section className="user-orders-hero-banner">
        <div>
          <div className="orders-hero-tag">
            <ShoppingBag size={17} />
            YOUR SHOPPING JOURNEY
          </div>

          <h1 className="orders-main-title">My Orders</h1>

          <p className="orders-hero-subtitle">
            Track your purchases, check order status and view your receipts.
          </p>
        </div>

        <button
          className="btn-refresh-user-orders"
          onClick={() => fetchOrders(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "orders-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Orders"}
        </button>
      </section>

      <section className="user-orders-summary-strip">
        <div className="order-summary-card">
          <div className="summary-icon-box bg-blue text-blue">
            <Package size={25} />
          </div>

          <div className="summary-info-box">
            <span className="summary-card-label">Total Orders</span>
            <strong>{summary.total}</strong>
          </div>
        </div>

        <div className="order-summary-card">
          <div className="summary-icon-box bg-emerald text-emerald">
            <CheckCircle2 size={25} />
          </div>

          <div className="summary-info-box">
            <span className="summary-card-label">Delivered</span>
            <strong>{summary.delivered}</strong>
          </div>
        </div>

        <div className="order-summary-card">
          <div className="summary-icon-box bg-purple text-purple">
            <Truck size={25} />
          </div>

          <div className="summary-info-box">
            <span className="summary-card-label">In Progress</span>
            <strong>{summary.inProgress}</strong>
          </div>
        </div>
      </section>

      <section className="orders-filter-tabs-bar">
        {[
          { id: "all", label: "All Orders" },
          { id: "processing", label: "Processing" },
          { id: "shipped", label: "Shipped" },
          { id: "delivered", label: "Delivered" },
          { id: "cancelled", label: "Cancelled" },
        ].map((filter) => {
          const count =
            filter.id === "all"
              ? orders.length
              : orders.filter((order) => {
                  const status = getOrderStatus(order);

                  if (filter.id === "processing") {
                    return (
                      status.includes("processing") ||
                      status.includes("pending") ||
                      status.includes("confirm")
                    );
                  }

                  if (filter.id === "shipped") {
                    return (
                      status.includes("ship") ||
                      status.includes("transit") ||
                      status.includes("out for")
                    );
                  }

                  return status.includes(filter.id.slice(0, -1));
                }).length;

          return (
            <button
              key={filter.id}
              className={`order-filter-tab ${
                activeFilter === filter.id ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
              <span className="tab-counter-badge">{count}</span>
            </button>
          );
        })}
      </section>

      {loading ? (
        <div className="orders-loading-card">
          <RefreshCw size={30} className="orders-spin" />
          <h3>Loading your orders...</h3>
          <p>Please wait while we fetch your order history.</p>
        </div>
      ) : error ? (
        <div className="orders-error-card">
          <AlertCircle size={25} />
          <div>
            <strong>Couldn't load orders</strong>
            <p>{error}</p>
          </div>
          <button
            className="btn-retry-orders"
            onClick={() => fetchOrders()}
          >
            <RotateCcw size={15} />
            Try Again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty-card">
          <div className="orders-empty-icon">
            <Package size={38} />
          </div>

          <h3>
            {orders.length === 0
              ? "No orders yet"
              : "No orders in this category"}
          </h3>

          <p>
            {orders.length === 0
              ? "Your purchases will appear here once you place an order."
              : "Try selecting another status to see your orders."}
          </p>

          {orders.length === 0 ? (
            <button
              className="btn-start-shopping"
              onClick={handleContinueShopping}
            >
              Start Shopping <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn-show-all-orders"
              onClick={() => setActiveFilter("all")}
            >
              Show All Orders
            </button>
          )}
        </div>
      ) : (
        <section className="user-orders-list-grid">
          {filteredOrders.map((order, index) => {
            const orderId = getOrderId(order) || `order-${index + 1}`;
            const items = getItems(order);
            const firstItem = items[0] || {};
            const status = getOrderStatus(order);
            const paymentStatus = getPaymentStatus(order);

            return (
              <article className="premium-order-card" key={orderId}>
                <header className="order-card-top-bar">
                  <div className="order-header-main">
                    <span className="order-tag-num">
                      Order #{String(orderId).slice(-8)}
                    </span>

                    <span className="order-date-chip">
                      <CalendarDays size={14} />
                      {formatDate(getOrderDate(order))}
                    </span>
                  </div>

                  <div className="order-status-pills-row">
                    <div className="badge-item-wrap">
                      <span className="badge-prefix-label">Order:</span>
                      <span
                        className={`pill-badge ${getStatusClass(status)}`}
                      >
                        {status.replace(/\b\w/g, (char) =>
                          char.toUpperCase()
                        )}
                      </span>
                    </div>

                    <div className="badge-item-wrap">
                      <span className="badge-prefix-label">Payment:</span>
                      <span
                        className={`pill-badge ${getPaymentClass(
                          paymentStatus
                        )}`}
                      >
                        {paymentStatus.replace(/\b\w/g, (char) =>
                          char.toUpperCase()
                        )}
                      </span>
                    </div>
                  </div>
                </header>

                <div className="order-card-main-content">
                  <div className="order-thumb-container">
                    {getProductImage(firstItem) ? (
                      <img
                        className="order-product-image"
                        src={getProductImage(firstItem)}
                        alt={getProductName(firstItem)}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="order-image-placeholder">
                        <Package size={35} />
                      </div>
                    )}
                  </div>

                  <div className="order-details-info">
                    <span className="order-category-tag">
                      {items.length > 1
                        ? `${items.length} different products`
                        : "Order item"}
                    </span>

                    <h3 className="order-product-title">
                      {getProductName(firstItem)}
                      {items.length > 1 ? ` + ${items.length - 1} more` : ""}
                    </h3>

                    <div className="order-spec-line">
                      <span className="spec-badge">
                        <Package size={14} />
                        Qty: <strong>{getOrderItemsLabel(order)}</strong>
                      </span>

                      {items.length > 0 && (
                        <span className="spec-badge">
                          Unit price:{" "}
                          <strong>{formatPrice(getItemPrice(firstItem))}</strong>
                        </span>
                      )}
                    </div>

                    <div className="order-hub-location">
                      <MapPin size={14} />
                      <span>Delivery details</span>
                      <strong>
                        {order?.shippingAddress?.city ||
                          order?.address?.city ||
                          order?.city ||
                          order?.shippingCity ||
                          "Address on order"}
                      </strong>
                    </div>
                  </div>

                  <div className="order-total-action-column">
                    <div className="order-price-display">
                      <span className="price-lbl">Order Total</span>
                      <strong className="order-final-price">
                        {formatPrice(getOrderTotal(order))}
                      </strong>
                    </div>

                    <div className="order-btns-group">
                      <button
                        className="btn-track-shipment"
                        onClick={() => openModal(order, "tracking")}
                      >
                        <Truck size={15} />
                        Track
                      </button>

                      <button
                        className="btn-view-invoice"
                        onClick={() => openModal(order, "receipt")}
                      >
                        <ReceiptText size={15} />
                        Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedOrder && modalType === "tracking" && (
        <div
          className="modal-backdrop-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="tracking-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Order tracking"
          >
            <header className="tracking-modal-header">
              <div className="title-group">
                <div className="summary-icon-box bg-blue text-blue">
                  <Truck size={22} />
                </div>
                <div>
                  <h3>Track Your Order</h3>
                  <p>Order #{String(getOrderId(selectedOrder)).slice(-8)}</p>
                </div>
              </div>

              <button
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close tracking"
              >
                <X size={19} />
              </button>
            </header>

            <div className="tracking-modal-body">
              {getOrderStatus(selectedOrder).includes("cancel") ? (
                <div className="orders-modal-notice cancelled-notice">
                  <AlertCircle size={22} />
                  <div>
                    <strong>Order cancelled</strong>
                    <p>This order is marked as cancelled.</p>
                  </div>
                </div>
              ) : (
                <div className="tracking-stepper-container">
                  {trackingSteps.map((step, index) => (
                    <div
                      className={`stepper-step ${
                        step.done ? "completed" : ""
                      }`}
                      key={step.title}
                    >
                      <div className="step-marker">
                        {step.done ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div className="step-info">
                        <strong className="step-title">{step.title}</strong>
                        <span className="step-desc">{step.description}</span>

                        {step.done && index === trackingSteps.length - 1 && (
                          <span className="live-status-pill">
                            Successfully delivered
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="tracking-summary-footer">
                <div className="meta-box">
                  <span>Order date</span>
                  <strong>{formatDate(getOrderDate(selectedOrder))}</strong>
                </div>

                <div className="meta-box">
                  <span>Current status</span>
                  <strong>
                    {getOrderStatus(selectedOrder).replace(/\b\w/g, (char) =>
                      char.toUpperCase()
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {selectedOrder && modalType === "receipt" && (
        <div
          className="modal-backdrop-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="receipt-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Order receipt"
          >
            <header className="receipt-modal-header">
              <div className="brand-receipt">
                <span className="receipt-logo">Retail Store</span>
                <span className="receipt-invoice-tag">ORDER RECEIPT</span>
              </div>

              <button
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close receipt"
              >
                <X size={19} />
              </button>
            </header>

            <div className="receipt-modal-body">
              <div className="receipt-meta-grid">
                <div>
                  <span className="label">Order number</span>
                  <strong>#{getOrderId(selectedOrder)}</strong>
                </div>

                <div>
                  <span className="label">Order date</span>
                  <strong>{formatDate(getOrderDate(selectedOrder))}</strong>
                </div>

                <div>
                  <span className="label">Payment status</span>
                  <strong>
                    {getPaymentStatus(selectedOrder).replace(
                      /\b\w/g,
                      (char) => char.toUpperCase()
                    )}
                  </strong>
                </div>

                <div>
                  <span className="label">Order status</span>
                  <strong>
                    {getOrderStatus(selectedOrder).replace(/\b\w/g, (char) =>
                      char.toUpperCase()
                    )}
                  </strong>
                </div>
              </div>

              <div className="receipt-divider" />

              {getItems(selectedOrder).length === 0 ? (
                <p className="receipt-no-items">
                  Item-level details are not available in the order response.
                </p>
              ) : (
                getItems(selectedOrder).map((item, index) => (
                  <div className="receipt-item-row" key={index}>
                    {getProductImage(item) ? (
                      <img
                        className="receipt-thumb"
                        src={getProductImage(item)}
                        alt={getProductName(item)}
                      />
                    ) : (
                      <div className="receipt-thumb receipt-thumb-placeholder">
                        <Package size={23} />
                      </div>
                    )}

                    <div className="receipt-item-info">
                      <h4>{getProductName(item)}</h4>
                      <span>Quantity: {getQuantity(item)}</span>
                      <small>{formatPrice(getItemPrice(item))} each</small>
                    </div>

                    <div className="receipt-item-total">
                      <strong>
                        {formatPrice(
                          getItemPrice(item) * getQuantity(item)
                        )}
                      </strong>
                    </div>
                  </div>
                ))
              )}

              <div className="receipt-divider" />

              <div className="receipt-breakdown">
                <div className="receipt-break-line">
                  <span>Items subtotal</span>
                  <span>
                    {formatPrice(
                      getItems(selectedOrder).reduce(
                        (sum, item) =>
                          sum +
                          getItemPrice(item) * getQuantity(item),
                        0
                      )
                    )}
                  </span>
                </div>

                <div className="receipt-total-line">
                  <strong>Total paid / payable</strong>
                  <strong>{formatPrice(getOrderTotal(selectedOrder))}</strong>
                </div>
              </div>
            </div>

            <footer className="receipt-modal-footer">
              <button
                className="btn-close-receipt"
                onClick={closeModal}
              >
                Close
              </button>

              <button
                className="btn-print-receipt"
                onClick={() => window.print()}
              >
                <ReceiptText size={15} />
                Print Receipt
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

export default MyOrders;
