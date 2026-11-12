import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Footer from "../components/Footer";

function Cart({ onNavigate }) {
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState({ type: "", message: "" });

  function loadCart() {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(savedCart);
    } catch {
      setCart([]);
    }
  }

  useEffect(() => {
    loadCart();

    const handleCartSync = () => loadCart();
    window.addEventListener("cartUpdated", handleCartSync);
    window.addEventListener("storage", handleCartSync);

    return () => {
      window.removeEventListener("cartUpdated", handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, []);

  function showNotice(type, message) {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  }

  // ===============================
  // REMOVE ITEM
  // ===============================
  function removeFromCart(id, name) {
    const updatedCart = cart.filter(
      (item) => (item.product_id || item.id) !== id
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
    showNotice("info", `Removed "${name || "item"}" from your cart.`);
  }

  // ===============================
  // CLEAR CART
  // ===============================
  function clearCart() {
    if (cart.length === 0) return;
    if (!window.confirm("Are you sure you want to empty your shopping cart?")) {
      return;
    }
    localStorage.removeItem("cart");
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));
    showNotice("info", "Your shopping cart has been cleared.");
  }

  // ===============================
  // INCREASE QUANTITY
  // ===============================
  function increaseQuantity(id) {
    let stockAlert = false;
    let maxAvailable = 0;

    const updatedCart = cart.map((item) => {
      const itemId = item.product_id || item.id;
      if (itemId === id) {
        const currentQty = Number(item.quantity || 1);
        const stockLimit = Number(item.stock !== undefined ? item.stock : 9999);

        if (currentQty >= stockLimit) {
          stockAlert = true;
          maxAvailable = stockLimit;
          return item;
        }

        return {
          ...item,
          quantity: currentQty + 1,
        };
      }
      return item;
    });

    if (stockAlert) {
      showNotice(
        "warning",
        `Stock limit reached: Only ${maxAvailable} unit(s) are available.`
      );
      return;
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
    showNotice("success", "Cart quantity updated.");
  }

  // ===============================
  // DECREASE QUANTITY
  // ===============================
  function decreaseQuantity(id) {
    const targetItem = cart.find(
      (item) => (item.product_id || item.id) === id
    );

    if (targetItem && Number(targetItem.quantity || 1) <= 1) {
      removeFromCart(id, targetItem.name);
      return;
    }

    const updatedCart = cart.map((item) => {
      const itemId = item.product_id || item.id;
      if (itemId === id) {
        return {
          ...item,
          quantity: Math.max(1, Number(item.quantity || 1) - 1),
        };
      }
      return item;
    });

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
    showNotice("info", "Item quantity updated.");
  }

  // Calculate totals
  const totalItemsCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const grandTotal = subtotal;

  function getProductImage(item) {
    if (item.image && item.image.trim() !== "") {
      if (item.image.startsWith("http")) return item.image;
      return `http://localhost:5000${item.image}`;
    }
    return `https://placehold.co/200x200?text=${encodeURIComponent(
      item.name || "Product"
    )}`;
  }

  return (
    <div className="ecommerce-cart-page">
      {/* NOTIFICATION TOAST */}
      {notification.message && (
        <div className={`cart-notification-toast toast-${notification.type}`}>
          {notification.type === "success" && (
            <CheckCircle2 size={18} className="notice-icon text-emerald" />
          )}
          {notification.type === "warning" && (
            <AlertCircle size={18} className="notice-icon text-amber" />
          )}
          {notification.type === "error" && (
            <AlertCircle size={18} className="notice-icon text-red" />
          )}
          {notification.type === "info" && (
            <Sparkles size={18} className="notice-icon text-blue" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="cart-page-header">
        <div>
          <h2>Your Shopping Cart</h2>
          <p className="cart-header-subtitle">
            Review your selected retail items, adjust order quantities, and proceed to secure checkout.
          </p>
        </div>

        {cart.length > 0 && (
          <button onClick={clearCart} className="btn-clear-cart">
            <Trash2 size={15} />
            <span>Empty Cart</span>
          </button>
        )}
      </div>

      {/* EMPTY CART STATE */}
      {cart.length === 0 ? (
        <div className="empty-cart-card">
          <div className="empty-cart-illustration">
            <ShoppingBag size={64} className="text-blue" />
          </div>
          <h3>Your shopping cart is empty</h3>
          <p>
            Looks like you haven't added anything to your cart yet. Explore our genuine inventory and find great deals!
          </p>
          <button
            onClick={() => onNavigate && onNavigate("products")}
            className="btn-continue-shopping"
          >
            <span>Explore Products</span>
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        /* TWO-COLUMN CART LAYOUT */
        <div className="cart-columns-layout">
          {/* LEFT: CART ITEMS LIST */}
          <div className="cart-items-column">
            <div className="cart-items-panel">
              <div className="items-panel-header">
                <h3>Cart Items ({totalItemsCount})</h3>
                <span className="stock-notice">Verified In Stock</span>
              </div>

              <div className="cart-items-list">
                {cart.map((item) => {
                  const itemId = item.product_id || item.id;
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const itemTotal = price * qty;
                  const stockLimit = Number(
                    item.stock !== undefined ? item.stock : 9999
                  );
                  const isNearMax = qty >= stockLimit;

                  return (
                    <div key={itemId} className="cart-item-row">
                      {/* THUMBNAIL */}
                      <div className="cart-item-thumb-box">
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="cart-item-thumb"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent(
                              item.name
                            )}`;
                          }}
                        />
                      </div>

                      {/* DETAILS */}
                      <div className="cart-item-details">
                        <span className="cart-item-category">
                          {item.category || "General"}
                        </span>
                        <h4 className="cart-item-title">{item.name}</h4>
                        <div className="cart-item-unit-price">
                          ₹{price.toLocaleString()} each
                        </div>

                        {stockLimit < 9999 && (
                          <div className="cart-stock-indicator">
                            {isNearMax ? (
                              <span className="stock-warning">
                                Max available stock reached ({stockLimit} units)
                              </span>
                            ) : (
                              <span className="stock-good">
                                In Stock ({stockLimit} available)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* QUANTITY CONTROLS */}
                      <div className="cart-item-quantity-group">
                        <div className="stepper-controls">
                          <button
                            onClick={() => decreaseQuantity(itemId)}
                            className="btn-stepper minus"
                            title="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="stepper-count">{qty}</span>
                          <button
                            onClick={() => increaseQuantity(itemId)}
                            className="btn-stepper plus"
                            disabled={isNearMax}
                            title={
                              isNearMax
                                ? "Maximum stock limit reached"
                                : "Increase quantity"
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* ITEM TOTAL & REMOVE */}
                      <div className="cart-item-total-group">
                        <strong className="item-subtotal-price">
                          ₹{itemTotal.toLocaleString()}
                        </strong>
                        <button
                          onClick={() => removeFromCart(itemId, item.name)}
                          className="btn-item-remove"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                          <span className="remove-text">Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-items-panel-footer">
                <button
                  onClick={() => onNavigate && onNavigate("products")}
                  className="btn-continue-browsing"
                >
                  <ArrowLeft size={16} />
                  <span>Continue Browsing Products</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (STICKY) */}
          <div className="cart-summary-column">
            <div className="order-summary-sticky-card">
              <h3>Order Summary</h3>

              <div className="summary-row-item">
                <span>Items Subtotal ({totalItemsCount} units)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row-item">
                <span>Express Shipping</span>
                <span className="text-emerald font-semibold">FREE</span>
              </div>

              <div className="summary-row-item">
                <span>Taxes & Fulfillment</span>
                <span className="text-muted">Included</span>
              </div>

              <div className="summary-divider-line"></div>

              <div className="summary-grand-total">
                <div>
                  <span className="total-title">Total Due:</span>
                  <small className="tax-notice">(All taxes included)</small>
                </div>
                <strong className="total-price-tag text-emerald">
                  ₹{grandTotal.toLocaleString()}
                </strong>
              </div>

              {/* CHECKOUT BUTTON NAVIGATION */}
              <button
                onClick={() => onNavigate && onNavigate("checkout")}
                className="btn-proceed-checkout"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <div className="summary-security-note">
                <ShieldCheck size={18} className="text-emerald" />
                <div>
                  <strong>Guaranteed Secure Checkout</strong>
                  <p>Encrypted order dispatch & doorstep verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export default Cart;