import { useState } from "react";
import {
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CreditCard,
  Lock,
  ChevronRight,
  X,
} from "lucide-react";

function Footer({ onNavigate, categories = [] }) {
  const [activeModalPolicy, setActiveModalPolicy] = useState(null);

  const policyContent = {
    privacy: {
      title: "Privacy Policy",
      text: "We value your privacy and are committed to protecting your personal data. We collect order and account information strictly to process your transactions, coordinate deliveries, and provide customer support. We never sell or share your personal information with unauthorized third parties.",
    },
    terms: {
      title: "Terms & Conditions",
      text: "By accessing and using this Retail Inventory Management platform, you agree to comply with standard e-commerce operating guidelines. Product pricing, descriptions, and real-time inventory counts are updated continuously. All orders placed are subject to stock availability and authorization.",
    },
    refund: {
      title: "Refund & Return Policy",
      text: "We offer a 7-day hassle-free return and refund policy on eligible products. If your order arrives damaged, defective, or incorrect, please initiate a return through 'My Orders' or contact our support team. Refunds are processed back to the original payment method within 3-5 business days.",
    },
    shipping: {
      title: "Shipping & Delivery Policy",
      text: "We offer Free Express Shipping on orders across India. Orders are dispatched from our centralized fulfillment center within 24 hours of order placement. Real-time tracking is provided from Warehouse dispatch through final delivery.",
    },
  };

  return (
    <footer className="ecommerce-site-footer">
      <div className="footer-top-container">
        {/* BRAND COLUMN */}
        <div className="footer-col brand-col">
          <div className="footer-brand-logo">
            <span className="brand-logo-emoji">🛍️</span>
            <h3>Retail Inventory</h3>
          </div>
          <p className="footer-tagline">
            Your trusted online retail destination offering high-quality products, authentic inventory, transparent pricing, and rapid delivery.
          </p>
          <div className="footer-trust-pills">
            <div className="trust-mini-pill">
              <ShieldCheck size={14} className="text-emerald" />
              <span>100% Genuine</span>
            </div>
            <div className="trust-mini-pill">
              <Lock size={14} className="text-blue" />
              <span>Secure Transactions</span>
            </div>
          </div>
        </div>

        {/* QUICK NAVIGATION */}
        <div className="footer-col">
          <h4>Explore Store</h4>
          <ul className="footer-links">
            <li>
              <button onClick={() => onNavigate && onNavigate("dashboard")}>
                <ChevronRight size={14} /> Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate("products")}>
                <ChevronRight size={14} /> All Products
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate("categories")}>
                <ChevronRight size={14} /> Categories
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate("my-orders")}>
                <ChevronRight size={14} /> My Orders
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate("cart")}>
                <ChevronRight size={14} /> Shopping Cart
              </button>
            </li>
          </ul>
        </div>

        {/* TOP CATEGORIES */}
        <div className="footer-col">
          <h4>Product Categories</h4>
          <ul className="footer-links">
            {categories.slice(0, 5).map((cat) => (
              <li key={cat.id || cat.name}>
                <button onClick={() => onNavigate && onNavigate("products")}>
                  <ChevronRight size={14} /> {cat.name}
                </button>
              </li>
            ))}
            {categories.length === 0 && (
              <>
                <li>
                  <button onClick={() => onNavigate && onNavigate("products")}>
                    <ChevronRight size={14} /> Electronics
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate && onNavigate("products")}>
                    <ChevronRight size={14} /> Fashion & Apparel
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate && onNavigate("products")}>
                    <ChevronRight size={14} /> Home & Kitchen
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* POLICIES */}
        <div className="footer-col">
          <h4>Store Policies</h4>
          <ul className="footer-links">
            <li>
              <button onClick={() => setActiveModalPolicy("privacy")}>
                <ChevronRight size={14} /> Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => setActiveModalPolicy("terms")}>
                <ChevronRight size={14} /> Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => setActiveModalPolicy("refund")}>
                <ChevronRight size={14} /> Refund Policy
              </button>
            </li>
            <li>
              <button onClick={() => setActiveModalPolicy("shipping")}>
                <ChevronRight size={14} /> Shipping Policy
              </button>
            </li>
          </ul>
        </div>

        {/* CONTACT / SUPPORT */}
        <div className="footer-col contact-col">
          <h4>Customer Support</h4>
          <div className="footer-contact-items">
            <div className="contact-item">
              <Mail size={16} />
              <span>support@retailinventory.com</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+91 98765 43210 (9 AM - 8 PM)</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>Retail Fulfillment Center, Indiranagar, Bengaluru, KA - 560038</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BOTTOM */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p>© {new Date().getFullYear()} Retail Inventory Management System. All rights reserved.</p>
          <div className="footer-payments-supported">
            <span>Accepted Payments:</span>
            <div className="payment-badge">UPI</div>
            <div className="payment-badge">Cards</div>
            <div className="payment-badge">Netbanking</div>
            <div className="payment-badge">COD</div>
          </div>
        </div>
      </div>

      {/* POLICY POPUP MODAL */}
      {activeModalPolicy && (
        <div
          className="modal-backdrop-overlay"
          onClick={() => setActiveModalPolicy(null)}
        >
          <div
            className="policy-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="policy-modal-header">
              <h3>{policyContent[activeModalPolicy]?.title}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setActiveModalPolicy(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="policy-modal-body">
              <p>{policyContent[activeModalPolicy]?.text}</p>
            </div>
            <div className="policy-modal-footer">
              <button
                className="btn-modal-close"
                onClick={() => setActiveModalPolicy(null)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
