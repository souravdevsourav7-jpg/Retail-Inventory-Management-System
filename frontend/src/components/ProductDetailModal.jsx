import { useState } from "react";
import {
  X,
  ShoppingCart,
  Zap,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Share2,
} from "lucide-react";

function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
  relatedProducts = [],
  onSelectProduct,
}) {
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const stock = Number(product.stock !== undefined ? product.stock : 0);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  function getProductImage(prod) {
    if (prod.image && prod.image.trim() !== "") {
      if (prod.image.startsWith("http")) return prod.image;
      return `http://localhost:5000${prod.image}`;
    }
    return `https://placehold.co/600x400?text=${encodeURIComponent(prod.name || "Product")}`;
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="product-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div className="product-detail-modal-body">
          {/* LEFT: IMAGE CONTAINER */}
          <div className="modal-product-image-container">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="modal-product-image"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/600x400?text=${encodeURIComponent(
                  product.name
                )}`;
              }}
            />
            {isOutOfStock ? (
              <span className="stock-tag-float out">Out of Stock</span>
            ) : isLowStock ? (
              <span className="stock-tag-float low">Only {stock} Left!</span>
            ) : (
              <span className="stock-tag-float in">In Stock</span>
            )}
          </div>

          {/* RIGHT: DETAILS */}
          <div className="modal-product-info-pane">
            <div className="product-category-tag-row">
              <span className="product-cat-pill">{product.category || "General"}</span>
              <button
                className={`btn-wishlist-icon ${isWishlisted ? "active" : ""}`}
                onClick={() => onToggleWishlist(product)}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={18} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "#64748b"} />
              </button>
            </div>

            <h2 className="modal-product-title">{product.name}</h2>

            <div className="modal-product-price-row">
              <span className="modal-product-price">₹{Number(product.price || 0).toLocaleString()}</span>
              <span className="modal-tax-tag">Inclusive of all taxes</span>
            </div>

            {/* STOCK INDICATOR */}
            <div className="modal-stock-status">
              {isOutOfStock ? (
                <div className="stock-status-line out">
                  <AlertTriangle size={16} />
                  <span>Currently Out of Stock</span>
                </div>
              ) : (
                <div className="stock-status-line in">
                  <CheckCircle2 size={16} />
                  <span>Available in Stock: <strong>{stock} units</strong></span>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="modal-product-description">
              <h4>Product Description</h4>
              <p>
                {product.description && product.description.trim() !== ""
                  ? product.description
                  : `High quality ${product.name} available from our genuine retail store inventory. Thoroughly quality-checked, carefully packaged, and ready for immediate shipping.`}
              </p>
            </div>

            {/* QUANTITY SELECTOR */}
            {!isOutOfStock && (
              <div className="modal-quantity-row">
                <span className="qty-label">Quantity:</span>
                <div className="modal-qty-stepper">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="stepper-btn"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                    className="stepper-btn"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="qty-subtotal">Subtotal: <strong>₹{(Number(product.price || 0) * quantity).toLocaleString()}</strong></span>
              </div>
            )}

            {/* ACTIONS */}
            <div className="modal-actions-row">
              <button
                className="btn-modal-add-cart"
                onClick={() => {
                  onAddToCart(product, quantity);
                }}
                disabled={isOutOfStock}
              >
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>

              <button
                className="btn-modal-buy-now"
                onClick={() => {
                  onBuyNow(product, quantity);
                }}
                disabled={isOutOfStock}
              >
                <Zap size={18} />
                <span>Buy Now</span>
              </button>

              <button
                className="btn-modal-share"
                onClick={handleShare}
                title="Share link"
              >
                <Share2 size={18} />
                <span>{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>

            {/* TRUST & SERVICE HIGHLIGHTS */}
            <div className="modal-trust-strip">
              <div className="trust-item">
                <Truck size={18} className="text-blue" />
                <div>
                  <strong>Free Express Delivery</strong>
                  <span>On all orders today</span>
                </div>
              </div>

              <div className="trust-item">
                <ShieldCheck size={18} className="text-emerald" />
                <div>
                  <strong>100% Authentic Product</strong>
                  <span>Direct retail inventory</span>
                </div>
              </div>

              <div className="trust-item">
                <RotateCcw size={18} className="text-amber" />
                <div>
                  <strong>7-Day Easy Return</strong>
                  <span>Hassle-free guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="modal-related-section">
            <h3>Similar in {product.category || "Store"}</h3>
            <div className="modal-related-grid">
              {relatedProducts.slice(0, 4).map((rel) => (
                <div
                  key={rel.id}
                  className="related-prod-card"
                  onClick={() => onSelectProduct && onSelectProduct(rel)}
                >
                  <img
                    src={getProductImage(rel)}
                    alt={rel.name}
                    className="related-prod-img"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/200x150?text=${encodeURIComponent(
                        rel.name
                      )}`;
                    }}
                  />
                  <div className="related-prod-info">
                    <span className="related-name">{rel.name}</span>
                    <strong className="related-price">₹{Number(rel.price || 0).toLocaleString()}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailModal;
