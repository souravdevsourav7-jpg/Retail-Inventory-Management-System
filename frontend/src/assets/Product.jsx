import { useEffect, useState } from "react";
import axios from "axios";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // SEARCH
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // ===============================
  // USER / ADMIN
  // ===============================

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const isAdmin =
    user?.role?.toLowerCase() === "admin";

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ===============================
  // GET PRODUCTS
  // ===============================

  function fetchProducts() {
    axios
      .get(
        "/api/products",
        authConfig
      )
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error(
          "ERROR FETCHING PRODUCTS:",
          error
        );
      });
  }

  // ===============================
  // GET CATEGORIES
  // ===============================

  function fetchCategories() {
    axios
      .get(
        "/api/categories",
        authConfig
      )
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error(
          "ERROR FETCHING CATEGORIES:",
          error
        );
      });
  }

  // ===============================
  // LOAD DATA
  // ===============================

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ===============================
  // IMAGE SELECT
  // ===============================

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, WEBP, or GIF image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be 2MB or smaller.");
      e.target.value = "";
      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  // ===============================
  // ADD / UPDATE PRODUCT
  // ===============================

  function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || !category) {
      alert("Please fill all required fields.");
      return;
    }

    const formData = new FormData();

    formData.append("name", name.trim());
    formData.append("category", category);
    formData.append("price", Number(price));
    formData.append("stock", Number(stock));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    // ===============================
    // UPDATE
    // ===============================

    if (editingId !== null) {
      axios
        .put(
          `/api/products/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then(() => {
          fetchProducts();
          resetForm();

          alert(
            "Product updated successfully!"
          );
        })
        .catch((error) => {
          console.error(
            "ERROR UPDATING PRODUCT:",
            error
          );

          alert(
            error.response?.data?.message ||
              "Product update nahi hua."
          );
        });

      return;
    }

    // ===============================
    // ADD
    // ===============================

    axios
      .post(
        "/api/products",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        fetchProducts();
        resetForm();

        alert(
          "Product added successfully!"
        );
      })
      .catch((error) => {
        console.error(
          "ERROR ADDING PRODUCT:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Product add nahi hua."
        );
      });
  }

  // ===============================
  // EDIT PRODUCT
  // ===============================

  function editProduct(product) {
    setEditingId(product.id);

    setName(product.name || "");
    setCategory(product.category || "");
    setPrice(product.price || "");
    setStock(product.stock || "");

    setImageFile(null);

    if (product.image) {
      setImagePreview(
        `${product.image}`
      );
    } else {
      setImagePreview("");
    }

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ===============================
  // DELETE PRODUCT
  // ===============================

  function deleteProduct(id) {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmDelete) {
      return;
    }

    axios
      .delete(
        `/api/products/${id}`,
        authConfig
      )
      .then(() => {
        fetchProducts();

        alert(
          "Product deleted successfully!"
        );
      })
      .catch((error) => {
        console.error(
          "ERROR DELETING PRODUCT:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Product delete nahi hua."
        );
      });
  }

  // ===============================
  // ADD TO CART
  // ===============================

  function addToCart(product) {
    if (product.stock <= 0) {
      alert("Product out of stock!");
      return;
    }

    const existingCart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];

    const existingProduct =
      existingCart.find(
        (item) =>
          item.id === product.id
      );

    let updatedCart;

    if (existingProduct) {
      updatedCart = existingCart.map(
        (item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.stock
                ),
              }
            : item
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price),
          stock: product.stock,
          image: product.image,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    alert(
      `${product.name} added to cart 🛒`
    );
  }

  // ===============================
  // RESET FORM
  // ===============================

  function resetForm() {
    setName("");
    setCategory("");
    setPrice("");
    setStock("");

    setImageFile(null);
    setImagePreview("");

    setEditingId(null);
    setShowForm(false);
  }

  // ===============================
  // PRODUCT IMAGE
  // ===============================

  function getProductImage(product) {
    if (
      product.image &&
      product.image.trim() !== ""
    ) {
      return `${product.image}`;
    }

    return `https://placehold.co/500x300?text=${encodeURIComponent(
      product.name
    )}`;
  }

  // ===============================
  // SEARCH + FILTER
  // ===============================

  const filteredProducts =
    products.filter((product) => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const matchesSearch =
        product.name
          ?.toLowerCase()
          .includes(search) ||
        product.category
          ?.toLowerCase()
          .includes(search);

      const matchesCategory =
        selectedCategory === "" ||
        product.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  // ===============================
  // UI
  // ===============================

  return (
    <div className="products-page">

      {/* ===============================
          HEADER
      =============================== */}

      <div className="products-header">

        <div>
          <h2>Products</h2>

          <p>
            Browse products and categories
          </p>
        </div>

        {/* SEARCH + CATEGORY */}

        <div className="products-controls">

          <div className="search-box">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search products or categories..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>

          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
          >

            <option value="">
              All Categories
            </option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.name}
              >
                {cat.name}
              </option>
            ))}

          </select>

        </div>

        {/* ADMIN ADD PRODUCT */}

        {isAdmin && (
          <button
            className="add-product-btn"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setEditingId(null);
                setName("");
                setCategory("");
                setPrice("");
                setStock("");
                setImageFile(null);
                setImagePreview("");
                setShowForm(true);
              }
            }}
          >
            + Add Product
          </button>
        )}

      </div>

      {/* ===============================
          ADMIN FORM
      =============================== */}

      {isAdmin && showForm && (
        <form
          className="product-form"
          onSubmit={handleSubmit}
        >

          <h3>
            {editingId !== null
              ? "Edit Product"
              : "Add New Product"}
          </h3>

          {/* NAME */}

          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            required
          >

            <option value="">
              Select Category
            </option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.name}
              >
                {cat.name}
              </option>
            ))}

          </select>

          {/* PRICE */}

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            required
            min="0"
          />

          {/* STOCK */}

          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            required
            min="0"
          />

          {/* IMAGE */}

          <div className="image-upload">

            <label>
              Product Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <small>
              JPG, PNG, WEBP, GIF — Max 2MB
            </small>

          </div>

          {/* IMAGE PREVIEW */}

          {imagePreview && (
            <div className="image-preview">

              <p>
                Image Preview:
              </p>

              <img
                src={imagePreview}
                alt="Product Preview"
              />

            </div>
          )}

          {/* BUTTONS */}

          <div className="form-buttons">

            <button type="submit">

              {editingId !== null
                ? "Update Product"
                : "Add Product"}

            </button>

            <button
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>

          </div>

        </form>
      )}

      {/* ===============================
          PRODUCT GRID
      =============================== */}

      <div className="product-grid">

        {filteredProducts.map(
          (product) => (

            <div
              className="product-card"
              key={product.id}
            >

              {/* IMAGE */}

              <img
                src={getProductImage(
                  product
                )}
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  e.currentTarget.src =
                    `https://placehold.co/500x300?text=${encodeURIComponent(
                      product.name
                    )}`;
                }}
              />

              {/* INFO */}

              <div className="product-info">

                {/* CATEGORY */}

                <span className="product-category">
                  {product.category}
                </span>

                {/* PRICE */}

                <p className="product-price">
                  ₹{product.price}
                </p>

                {/* ===============================
                    ADMIN ONLY STOCK
                =============================== */}

                {isAdmin && (
                  <>
                    <p className="product-stock">
                      Stock: {product.stock}
                    </p>

                    {product.stock <= 0 ? (

                      <span className="out-stock">
                        Out of Stock
                      </span>

                    ) : product.stock <= 10 ? (

                      <span className="low-stock">
                        Low Stock
                      </span>

                    ) : (

                      <span className="available-stock">
                        In Stock
                      </span>

                    )}
                  </>
                )}

                {/* ===============================
                    USER CART
                =============================== */}

                {!isAdmin && (
                  <button
                    className="cart-btn"
                    onClick={() =>
                      addToCart(product)
                    }
                    disabled={
                      product.stock <= 0
                    }
                  >
                    🛒 Add to Cart
                  </button>
                )}

                {/* ===============================
                    ADMIN ACTIONS
                =============================== */}

                {isAdmin && (
                  <div className="admin-actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        editProduct(
                          product
                        )
                      }
                    >
                      ✏️ Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteProduct(
                          product.id
                        )
                      }
                    >
                      🗑️ Delete
                    </button>

                  </div>
                )}

              </div>

            </div>

          )
        )}

      </div>

      {/* ===============================
          NO SEARCH RESULT
      =============================== */}

      {filteredProducts.length === 0 && (
        <div className="no-products">

          <h3>
            No products found
          </h3>

          <p>
            Try another product name
            or category.
          </p>

        </div>
      )}

    </div>
  );
}

export default Products;