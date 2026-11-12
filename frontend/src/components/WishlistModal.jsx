import { X, ShoppingBag, Trash2, ShoppingCart, Heart } from "lucide-react";

function WishlistModal({
  isOpen,
  onClose,
  wishlist = [],
  onRemoveFromWishlist,
  onAddToCart,
}) {
  if (!isOpen) return null;

  function getProductImage(prod) {
    if (prod.image && prod.image.trim() !== "") {
      if (prod.image.startsWith("http")) return prod.image;
      return `http://localhost:5000${prod.image}`;
    }
    return `https://placehold.co/200x150?text=${encodeURIComponent(prod.name || "Product")}`;
  }

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="wishlist-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wishlist-modal-header">
          <div className="wishlist-title-group">
            <Heart size={20} className="text-red" fill="#ef4444" />
            <h3>My Saved Wishlist ({wishlist.length})</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="wishlist-modal-content">
          {wishlist.length === 0 ? (
            <div className="wishlist-empty-state">
              <div className="empty-heart-icon">💔</div>
              <h4>Your wishlist is empty</h4>
              <p>Explore our products and tap the heart icon on any product to save it here for later!</p>
              <button className="btn-browse-shop" onClick={onClose}>
                Browse Products
              </button>
            </div>
          ) : (
            <div className="wishlist-items-list">
              {wishlist.map((item) => {
                const stock = Number(item.stock !== undefined ? item.stock : 0);
                const isOut = stock <= 0;

                return (
                  <div key={item.id} className="wishlist-item-row">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="wishlist-item-img"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/120x100?text=${encodeURIComponent(
                          item.name
                        )}`;
                      }}
                    />

                    <div className="wishlist-item-meta">
                      <span className="wishlist-item-cat">{item.category || "General"}</span>
                      <h4 className="wishlist-item-name">{item.name}</h4>
                      <div className="wishlist-item-price-stock">
                        <strong className="wishlist-price">₹{Number(item.price || 0).toLocaleString()}</strong>
                        {isOut ? (
                          <span className="badge-stock out">Out of Stock</span>
                        ) : (
                          <span className="badge-stock in">In Stock ({stock})</span>
                        )}
                      </div>
                    </div>

                    <div className="wishlist-item-actions">
                      <button
                        className="btn-move-cart"
                        onClick={() => {
                          onAddToCart(item, 1);
                          onRemoveFromWishlist(item.id);
                        }}
                        disabled={isOut}
                        title="Move to Cart"
                      >
                        <ShoppingCart size={15} />
                        <span>Move to Cart</span>
                      </button>

                      <button
                        className="btn-remove-wishlist"
                        onClick={() => onRemoveFromWishlist(item.id)}
                        title="Remove from Wishlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WishlistModal;
