import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingBag,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Truck,
  Sparkles,
  ChevronRight,
} from "lucide-react";

function Checkout({ onNavigate }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderIds, setPlacedOrderIds] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Customer Information (prefilled from localStorage user)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  // Delivery Address
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Payment Method: 'cod' | 'online'
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    // Load Cart
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(savedCart);
    } catch {
      setCart([]);
    }

    // Load User
    try {
      const savedUser = JSON.parse(localStorage.getItem("user")) || {};
      setCustomerInfo({
        name: savedUser.name || "",
        email: savedUser.email || "",
        mobile: savedUser.mobile || "",
      });
    } catch {
      // ignore
    }

    // Load Saved Address
    try {
      const savedAddr = JSON.parse(localStorage.getItem("retail_saved_address")) || {};
      if (savedAddr.street) {
        setAddress(savedAddr);
      }
    } catch {
      // ignore
    }
  }, []);

  const totalItemsCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const grandTotal = subtotal; // Free delivery

  function handleAddressChange(e) {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  }

  function handleCustomerChange(e) {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  }

  // ===============================
  // PLACE ORDER
  // ===============================
  async function handlePlaceOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
      setErrorMsg("Your shopping cart is empty.");
      return;
    }

    if (!customerInfo.name.trim()) {
      setErrorMsg("Please provide your full name.");
      return;
    }

    if (!customerInfo.mobile.trim()) {
      setErrorMsg("Please provide your mobile phone number.");
      return;
    }

    if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.pincode.trim()) {
      setErrorMsg("Please complete all delivery address fields.");
      return;
    }

    // Save address for user convenience
    try {
      localStorage.setItem("retail_saved_address", JSON.stringify(address));
    } catch {
      // ignore
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");
      const orderIds = [];

      // Process orders for each cart item
      for (const item of cart) {
        const prodId = Number(item.product_id || item.id);
        const qty = Number(item.quantity || 1);

        const response = await axios.post(
          "/api/orders",
          {
            product_id: prodId,
            quantity: qty,
            payment_status: paymentMethod === "cod" ? "Pending" : "Paid",
            order_status: "Processing",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.orderId) {
          orderIds.push(response.data.orderId);
        }
      }

      // Empty cart upon success
      localStorage.removeItem("cart");
      setCart([]);
      window.dispatchEvent(new Event("cartUpdated"));

      setPlacedOrderIds(orderIds);
      setOrderSuccess(true);
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      const rawMsg = err.response?.data?.message || "Failed to place order. Please try again.";

      if (rawMsg.toLowerCase().includes("stock") || rawMsg.toLowerCase().includes("insufficient")) {
        const avail = err.response?.data?.availableStock;
        setErrorMsg(
          avail !== undefined
            ? `Stock Alert: Only ${avail} unit(s) available for one of your items. Please update your cart.`
            : rawMsg
        );
      } else {
        setErrorMsg(rawMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // SUCCESS SCREEN
  // ===============================
  if (orderSuccess) {
    return (
      <div className="checkout-success-view">
        <div className="checkout-success-card">
          <div className="success-badge-icon">
            <CheckCircle2 size={54} className="text-emerald" />
          </div>
          <h2>Thank You For Your Order!</h2>
          <p className="success-subtitle">
            Your order has been placed successfully and is now being processed at our centralized retail fulfillment center.
          </p>

          <div className="success-order-meta-box">
            <div className="meta-line">
              <span>Payment Mode:</span>
              <strong>{paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Paid Online (Razorpay Sandbox)"}</strong>
            </div>
            <div className="meta-line">
              <span>Delivery To:</span>
              <strong>{customerInfo.name}, {address.city}, {address.state} - {address.pincode}</strong>
            </div>
            <div className="meta-line">
              <span>Total Amount:</span>
              <strong className="text-emerald text-lg">₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>

          <div className="success-actions">
            <button
              className="btn-view-orders-cta"
              onClick={() => onNavigate && onNavigate("my-orders")}
            >
              <span>Track in My Orders</span>
              <ChevronRight size={18} />
            </button>

            <button
              className="btn-continue-shopping-cta"
              onClick={() => onNavigate && onNavigate("products")}
            >
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // EMPTY CART GUARD
  // ===============================
  if (cart.length === 0) {
    return (
      <div className="checkout-empty-container">
        <div className="checkout-empty-card">
          <ShoppingBag size={56} className="text-blue" />
          <h3>Your cart is empty</h3>
          <p>Please add products to your cart before proceeding to checkout.</p>
          <button
            className="btn-primary-ecom"
            onClick={() => onNavigate && onNavigate("products")}
          >
            Explore Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      {/* HEADER */}
      <div className="checkout-top-nav">
        <button
          className="btn-back-to-cart"
          onClick={() => onNavigate && onNavigate("cart")}
        >
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </button>
        <div className="checkout-badge-secure">
          <Lock size={15} />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      {errorMsg && (
        <div className="checkout-error-banner">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="checkout-form-grid">
        {/* LEFT COLUMN: INFORMATION & ADDRESS & PAYMENT */}
        <div className="checkout-left-column">
          {/* SECTION 1: CUSTOMER DETAILS */}
          <div className="checkout-section-card">
            <div className="checkout-section-header">
              <span className="step-number">1</span>
              <div>
                <h3>Customer Information</h3>
                <p>Contact details for order confirmation & shipment updates</p>
              </div>
            </div>

            <div className="checkout-fields-group">
              <div className="form-field-item">
                <label>Full Name *</label>
                <div className="input-with-icon">
                  <User size={16} />
                  <input
                    type="text"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleCustomerChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-fields-duo">
                <div className="form-field-item">
                  <label>Mobile Number *</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input
                      type="tel"
                      name="mobile"
                      value={customerInfo.mobile}
                      onChange={handleCustomerChange}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={16} />
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleCustomerChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DELIVERY ADDRESS */}
          <div className="checkout-section-card">
            <div className="checkout-section-header">
              <span className="step-number">2</span>
              <div>
                <h3>Delivery Address</h3>
                <p>Where should we deliver your order?</p>
              </div>
            </div>

            <div className="checkout-fields-group">
              <div className="form-field-item">
                <label>House / Flat No., Street, Landmark *</label>
                <div className="input-with-icon">
                  <MapPin size={16} />
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    placeholder="e.g. Flat 302, Green Avenue, Near Metro"
                    required
                  />
                </div>
              </div>

              <div className="form-fields-trio">
                <div className="form-field-item">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    placeholder="e.g. Bengaluru"
                    required
                  />
                </div>

                <div className="form-field-item">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    placeholder="e.g. Karnataka"
                    required
                  />
                </div>

                <div className="form-field-item">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleAddressChange}
                    placeholder="e.g. 560038"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PAYMENT METHOD */}
          <div className="checkout-section-card">
            <div className="checkout-section-header">
              <span className="step-number">3</span>
              <div>
                <h3>Select Payment Method</h3>
                <p>Choose your preferred payment method</p>
              </div>
            </div>

            <div className="payment-options-selector">
              {/* COD OPTION */}
              <label className={`payment-radio-card ${paymentMethod === "cod" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <div className="payment-radio-content">
                  <div className="payment-radio-title">
                    <Banknote size={20} className="text-emerald" />
                    <strong>Cash on Delivery (COD)</strong>
                  </div>
                  <span className="payment-radio-desc">
                    Pay in cash or UPI QR code at the time of doorstep delivery.
                  </span>
                </div>
              </label>

              {/* PAY ONLINE */}
              <label className={`payment-radio-card ${paymentMethod === "online" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                />
                <div className="payment-radio-content">
                  <div className="payment-radio-title">
                    <CreditCard size={20} className="text-blue" />
                    <strong>Pay Online (UPI / Card / Netbanking)</strong>
                    <span className="demo-badge">Razorpay Test Mode Ready</span>
                  </div>
                  <span className="payment-radio-desc">
                    Simulate instant online payment via test gateway (all test cards & UPI supported).
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <div className="checkout-right-column">
          <div className="checkout-summary-card">
            <h3>Order Summary</h3>
            <span className="summary-items-count">{totalItemsCount} item(s) in order</span>

            {/* ORDER ITEMS LIST */}
            <div className="checkout-items-mini-list">
              {cart.map((item) => (
                <div key={item.product_id || item.id} className="checkout-item-mini-row">
                  <div className="item-mini-info">
                    <span className="mini-name">{item.name}</span>
                    <span className="mini-qty">Qty: {item.quantity} × ₹{Number(item.price || 0).toLocaleString()}</span>
                  </div>
                  <strong className="mini-total">
                    ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            {/* PRICE BREAKDOWN */}
            <div className="summary-price-breakdown">
              <div className="breakdown-row">
                <span>Items Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="breakdown-row">
                <span>Standard Express Shipping</span>
                <span className="text-emerald font-semibold">FREE</span>
              </div>
              <div className="breakdown-row">
                <span>Applicable Taxes</span>
                <span className="text-muted">Included</span>
              </div>
            </div>

            <div className="summary-divider"></div>

            {/* GRAND TOTAL */}
            <div className="summary-grand-total-row">
              <div>
                <span className="total-label">Grand Total:</span>
                <small className="total-tax-note">(All taxes included)</small>
              </div>
              <strong className="total-amount">₹{grandTotal.toLocaleString()}</strong>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="btn-place-order-submit"
              disabled={loading}
            >
              {loading ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Confirm & Place Order (₹{grandTotal.toLocaleString()})</span>
                </>
              )}
            </button>

            <div className="checkout-guarantee-note">
              <ShieldCheck size={16} className="text-emerald" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Checkout;
